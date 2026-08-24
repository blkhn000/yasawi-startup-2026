import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { ApplicationStatus, Prisma } from "../generated/prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { hashIp } from "../security/ip-hash";
import { CreateApplicationDto } from "./create-application.dto";

export type ApplicationFilters = { status?: ApplicationStatus; program?: string; search?: string; page?: number; pageSize?: number };

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  async create(dto: CreateApplicationDto, meta: { ip?: string; userAgent?: string } = {}) {
    if (dto.website) return { id: "received", status: "received", createdAt: new Date().toISOString() };
    const program = await this.prisma.program.findUnique({ where: { slug: dto.program } });
    if (!program?.published) throw new NotFoundException("Программа не найдена");
    if (program.status === "closed" || program.status === "completed") throw new BadRequestException("Приём заявок на эту программу закрыт");

    const email = dto.email.trim().toLowerCase();
    const duplicate = await this.prisma.application.findFirst({ where: { email, programId: program.id, createdAt: { gte: new Date(Date.now() - 10 * 60_000) } }, select: { id: true } });
    if (duplicate) throw new ConflictException("Такая заявка уже получена. Дождитесь ответа команды.");

    const application = await this.prisma.application.create({
      data: {
        programId: program.id, cohortId: dto.cohortId || undefined,
        name: dto.name.trim(), email, phone: dto.phone.trim(), idea: dto.idea.trim(),
        institution: dto.institution?.trim(), faculty: dto.faculty?.trim(), teamInfo: dto.teamInfo?.trim(),
        consent: dto.consent, consentAt: new Date(), locale: dto.locale ?? "ru", utm: dto.utm,
        ipHash: meta.ip ? hashIp(meta.ip) : undefined, userAgent: meta.userAgent?.slice(0, 500),
        statusHistory: { create: { toStatus: "new", note: "Заявка отправлена через сайт" } },
      },
      include: { program: { select: { slug: true, title: true } } },
    });

    void this.notifications.applicationReceived(application).catch(() => undefined);
    return { id: application.id, status: "received", createdAt: application.createdAt.toISOString() };
  }

  async list(filters: ApplicationFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const where: Prisma.ApplicationWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.program ? { program: { slug: filters.program } } : {}),
      ...(filters.search ? { OR: [
        { name: { contains: filters.search, mode: "insensitive" } }, { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } }, { idea: { contains: filters.search, mode: "insensitive" } },
      ] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({ where, include: { program: { select: { slug: true, title: true } }, assignedTo: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.application.count({ where }),
    ]);
    return { items: items.map(publicApplication), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  async updateStatus(id: string, input: { status: ApplicationStatus; notes?: string; assignedToId?: string | null }, adminId?: string) {
    const current = await this.prisma.application.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Заявка не найдена");
    return this.prisma.$transaction(async (database) => {
      const updated = await database.application.update({
        where: { id },
        data: { status: input.status, ...(input.notes !== undefined ? { notes: input.notes } : {}), ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId || null } : {}) },
        include: { program: { select: { slug: true, title: true } }, assignedTo: { select: { id: true, name: true } } },
      });
      if (current.status !== input.status) await database.applicationStatusHistory.create({ data: { applicationId: id, fromStatus: current.status, toStatus: input.status, note: input.notes, changedById: adminId } });
      return publicApplication(updated);
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.application.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Заявка не найдена");
    await this.prisma.application.delete({ where: { id } });
    return { success: true };
  }

  async exportCsv(filters: ApplicationFilters = {}) {
    const where: Prisma.ApplicationWhereInput = { ...(filters.status ? { status: filters.status } : {}), ...(filters.program ? { program: { slug: filters.program } } : {}) };
    const items = await this.prisma.application.findMany({ where, include: { program: { select: { title: true } } }, orderBy: { createdAt: "desc" } });
    const header = ["ID", "Дата", "Язык", "Программа", "Статус", "Имя", "Email", "Телефон", "Организация", "Факультет", "Идея", "Заметки"];
    const rows = items.map((item) => [item.id, item.createdAt.toISOString(), item.locale, item.program.title, item.status, item.name, item.email, item.phone, item.institution ?? "", item.faculty ?? "", item.idea, item.notes]);
    return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  }
}

function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function publicApplication<T extends { program: { slug: string; title: string }; createdAt: Date; updatedAt: Date }>(item: T) { return { ...item, programSlug: item.program.slug, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }; }
