import { BadRequestException, Controller, Delete, Param, Post, UploadedFile, UseGuards, UseInterceptors, Body, Req } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { AuditService } from "../audit/audit.service";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import type { AuthenticatedAdmin } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import { MediaStorageService } from "./media-storage.service";

@Controller("admin/media")
@UseGuards(AdminAuthGuard)
export class MediaController {
  constructor(private readonly storage: MediaStorageService, private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 8 * 1024 * 1024, files: 1 } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @Body("alt") alt: string | undefined, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    if (!file) throw new BadRequestException("Файл не передан");
    const stored = await this.storage.save(file);
    const media = await this.prisma.mediaAsset.create({ data: { originalName: file.originalname, mimeType: stored.mimeType, size: stored.size, width: stored.width, height: stored.height, url: stored.url, storageKey: stored.key, alt: alt?.slice(0, 300) ?? "", uploadedById: admin.id } });
    await this.audit.record({ adminId: admin.id, action: "upload", entity: "media", entityId: media.id, payload: { name: file.originalname, size: stored.size }, ipAddress: request.ip });
    return media;
  }

  @Post(":mediaId/projects/:projectId")
  async attach(@Param("mediaId") mediaId: string, @Param("projectId") projectId: string, @Body() body: { kind?: string; alt?: string; sortOrder?: number }) {
    const project = await this.prisma.project.findUnique({ where: { slug: projectId } }) ?? (/^[0-9a-f-]{36}$/i.test(projectId) ? await this.prisma.project.findUnique({ where: { id: projectId } }) : null);
    if (!project) throw new BadRequestException("Проект не найден");
    return this.prisma.projectMedia.upsert({ where: { projectId_mediaId: { projectId: project.id, mediaId } }, create: { projectId: project.id, mediaId, kind: body.kind ?? "gallery", alt: body.alt ?? "", sortOrder: body.sortOrder ?? 0 }, update: { kind: body.kind, alt: body.alt, sortOrder: body.sortOrder } });
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const media = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!media) return { success: true };
    await this.storage.remove(media.storageKey);
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.audit.record({ adminId: admin.id, action: "delete", entity: "media", entityId: id, ipAddress: request.ip });
    return { success: true };
  }
}
