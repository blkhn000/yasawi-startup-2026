import { BadGatewayException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApplicationsService } from "../applications/applications.service";
import { AuditService } from "../audit/audit.service";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { AdminRoleGuard, AdminRoles } from "../auth/admin-role.guard";
import { CreateAdminDto, UpdateAdminDto } from "../auth/auth.dto";
import { AuthService } from "../auth/auth.service";
import { CurrentAdmin } from "../auth/current-admin.decorator";
import type { AuthenticatedAdmin } from "../auth/auth.types";
import { PrismaService } from "../database/prisma.service";
import type { ApplicationStatus, Prisma } from "../generated/prisma/client";
import { NewsService } from "../content/news.service";
import { CohortStatsService } from "../content/cohort-stats.service";
import { MediaStorageService } from "../media/media-storage.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateCohortDto, CreateProgramDto, CreateProjectDto, ItCourseDto, NewsItemDto, PageContentDto, PartnerDto, TeamMemberDto, UpdateApplicationDto, UpdateCohortDto, UpdateItCourseDto, UpdateNewsItemDto, UpdatePageContentDto, UpdatePartnerDto, UpdateProgramDto, UpdateProjectDto, UpdateSettingsDto, UpdateTeamMemberDto } from "./admin.dto";

@Controller("admin")
@UseGuards(AdminAuthGuard, AdminRoleGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly applications: ApplicationsService,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
    private readonly news: NewsService,
    private readonly cohortStats: CohortStatsService,
    private readonly notifications: NotificationsService,
    private readonly mediaStorage: MediaStorageService,
  ) {}

  @Get("dashboard")
  async dashboard() {
    const [settings, applications, newApplications, acceptedApplications, publishedProjects, programs, recentApplications] = await Promise.all([
      this.cohortStats.settingsWithDerivedCohort(), this.prisma.application.count(), this.prisma.application.count({ where: { status: "new" } }),
      this.prisma.application.count({ where: { status: "accepted" } }), this.prisma.project.count({ where: { status: "published" } }),
      this.programs(), this.prisma.application.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { program: { select: { slug: true, title: true } } } }),
    ]);
    return { settings, counters: { applications, newApplications, acceptedApplications, publishedProjects }, programs, recentApplications };
  }

  @Get("settings")
  settings() { return this.cohortStats.settingsWithDerivedCohort(); }

  @Patch("settings")
  async updateSettings(@Body() dto: UpdateSettingsDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const data = settingsData(dto);
    const settings = await this.prisma.siteSettings.upsert({ where: { id: "main" }, create: { id: "main", ...data } as Prisma.SiteSettingsCreateInput, update: data });
    await this.log(admin, request, "update", "settings", "main", dto);
    return { ...settings, currentCohort: await this.cohortStats.currentIncubationCohort() ?? settings.currentCohort };
  }

  @Get("integrations")
  integrations() {
    return { smtp: this.notifications.status(), storage: this.mediaStorage.status() };
  }

  @Post("integrations/:service/check")
  @AdminRoles("admin")
  checkIntegration(@Param("service") service: string) {
    if (service === "smtp") return this.notifications.verify();
    if (service === "storage") return this.mediaStorage.verify();
    throw new NotFoundException("Интеграция не найдена");
  }

  @Get("applications")
  applicationsList(@Query("status") status?: ApplicationStatus, @Query("program") program?: string, @Query("search") search?: string, @Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.applications.list({ status: validApplicationStatus(status), program, search, page: numberQuery(page, 1), pageSize: numberQuery(pageSize, 20) });
  }

  @Get("applications/export")
  async exportApplications(@Res() response: Response, @Query("status") status?: ApplicationStatus, @Query("program") program?: string) {
    const csv = await this.applications.exportCsv({ status: validApplicationStatus(status), program });
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="yasawi-applications-${new Date().toISOString().slice(0, 10)}.csv"`);
    response.send(`\uFEFF${csv}`);
  }

  @Get("applications/:id/history")
  applicationHistory(@Param("id") id: string) { return this.prisma.applicationStatusHistory.findMany({ where: { applicationId: id }, include: { changedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } }); }

  @Patch("applications/:id")
  async updateApplication(@Param("id") id: string, @Body() dto: UpdateApplicationDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const application = await this.applications.updateStatus(id, dto, admin.id);
    await this.log(admin, request, "update", "application", id, dto);
    return application;
  }

  @Delete("applications/:id")
  @AdminRoles("admin")
  async deleteApplication(@Param("id") id: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const result = await this.applications.remove(id);
    await this.log(admin, request, "delete", "application", id);
    return result;
  }

  @Get("projects")
  async projects() { return (await this.prisma.project.findMany({ include: { media: { include: { media: true }, orderBy: { sortOrder: "asc" } } }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })).map(adminProject); }

  @Post("projects")
  async createProject(@Body() dto: CreateProjectDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    if (await this.prisma.project.findUnique({ where: { slug: dto.slug } })) throw new ConflictException("Проект с таким адресом уже существует");
    const project = await this.prisma.project.create({ data: projectCreateData(dto), include: { media: { include: { media: true } } } });
    await this.log(admin, request, "create", "project", project.id, { slug: project.slug });
    return adminProject(project);
  }

  @Patch("projects/:id")
  async updateProject(@Param("id") id: string, @Body() dto: UpdateProjectDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const project = await this.findProject(id);
    const updated = await this.prisma.project.update({ where: { id: project.id }, data: projectUpdateData(dto), include: { media: { include: { media: true }, orderBy: { sortOrder: "asc" } } } });
    await this.log(admin, request, "update", "project", project.id, dto);
    return adminProject(updated);
  }

  @Delete("projects/:id")
  @AdminRoles("admin")
  async archiveProject(@Param("id") id: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const project = await this.findProject(id);
    await this.prisma.project.update({ where: { id: project.id }, data: { status: "archived" } });
    await this.log(admin, request, "archive", "project", project.id);
    return { success: true };
  }

  @Get("programs")
  async programs() {
    const programs = await this.prisma.program.findMany({ include: { _count: { select: { applications: true } }, cohorts: { orderBy: { number: "desc" } } }, orderBy: { sortOrder: "asc" } });
    return programs.map(({ _count, ...program }) => ({ ...program, applicationCount: _count.applications }));
  }

  @Post("programs")
  async createProgram(@Body() dto: CreateProgramDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const program = await this.prisma.program.create({ data: programData(dto) });
    await this.log(admin, request, "create", "program", program.id, { slug: program.slug });
    return { ...program, applicationCount: 0 };
  }

  @Patch("programs/:slug")
  async updateProgram(@Param("slug") slug: string, @Body() dto: UpdateProgramDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const existing = await this.prisma.program.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException("Программа не найдена");
    const program = await this.prisma.program.update({ where: { id: existing.id }, data: programUpdateData(dto) });
    await this.log(admin, request, "update", "program", existing.id, dto);
    return { ...program, applicationCount: await this.prisma.application.count({ where: { programId: existing.id } }) };
  }

  @Get("it-courses")
  itCourses() { return this.prisma.itCourse.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] }); }

  @Post("it-courses")
  async createItCourse(@Body() dto: ItCourseDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const course = await this.prisma.itCourse.create({ data: courseData(dto) });
    await this.log(admin, request, "create", "it-course", course.id, { slug: course.slug });
    return course;
  }

  @Patch("it-courses/:id")
  async updateItCourse(@Param("id") id: string, @Body() dto: UpdateItCourseDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const course = await this.prisma.itCourse.update({ where: { id }, data: courseUpdateData(dto) });
    await this.log(admin, request, "update", "it-course", id, dto);
    return course;
  }

  @Delete("it-courses/:id")
  async deleteItCourse(@Param("id") id: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    await this.prisma.itCourse.delete({ where: { id } });
    await this.log(admin, request, "delete", "it-course", id);
    return { success: true };
  }

  @Get("cohorts")
  cohorts() { return this.prisma.cohort.findMany({ include: { program: { select: { id: true, slug: true, title: true } }, _count: { select: { applications: true, projects: true } } }, orderBy: [{ number: "desc" }, { createdAt: "desc" }] }); }

  @Post("cohorts")
  async createCohort(@Body() dto: CreateCohortDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const cohort = await this.prisma.cohort.create({ data: cohortData(dto) });
    await this.cohortStats.synchronizeSettings();
    await this.log(admin, request, "create", "cohort", cohort.id, dto);
    return cohort;
  }

  @Patch("cohorts/:id")
  async updateCohort(@Param("id") id: string, @Body() dto: UpdateCohortDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const cohort = await this.prisma.cohort.update({ where: { id }, data: cohortUpdateData(dto) });
    await this.cohortStats.synchronizeSettings();
    await this.log(admin, request, "update", "cohort", id, dto);
    return cohort;
  }

  @Get("partners")
  partners() { return this.prisma.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); }

  @Post("partners")
  async createPartner(@Body() dto: PartnerDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const partner = await this.prisma.partner.create({ data: jsonData(dto) as Prisma.PartnerCreateInput }); await this.log(admin, request, "create", "partner", partner.id, dto); return partner; }

  @Patch("partners/:id")
  async updatePartner(@Param("id") id: string, @Body() dto: UpdatePartnerDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const partner = await this.prisma.partner.update({ where: { id }, data: jsonUpdateData(dto) as Prisma.PartnerUpdateInput }); await this.log(admin, request, "update", "partner", id, dto); return partner; }

  @Delete("partners/:id")
  async deletePartner(@Param("id") id: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { await this.prisma.partner.delete({ where: { id } }); await this.log(admin, request, "delete", "partner", id); return { success: true }; }

  @Get("pages")
  pages() { return this.prisma.pageContent.findMany({ orderBy: [{ page: "asc" }, { key: "asc" }] }); }

  @Post("pages")
  async createPage(@Body() dto: PageContentDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const page = await this.prisma.pageContent.create({ data: { ...dto, content: dto.content as Prisma.InputJsonValue, translations: (dto.translations ?? {}) as Prisma.InputJsonValue } }); await this.log(admin, request, "create", "page", page.id, { key: page.key }); return page; }

  @Patch("pages/:id")
  async updatePage(@Param("id") id: string, @Body() dto: UpdatePageContentDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const page = await this.prisma.pageContent.update({ where: { id }, data: { ...dto, content: dto.content as Prisma.InputJsonValue | undefined, translations: dto.translations as Prisma.InputJsonValue | undefined } }); await this.log(admin, request, "update", "page", id, dto); return page; }

  @Get("team")
  teamList() { return this.prisma.teamMember.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); }

  @Post("team")
  async createTeamMember(@Body() dto: TeamMemberDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const member = await this.prisma.teamMember.create({ data: { ...dto, translations: (dto.translations ?? {}) as Prisma.InputJsonValue, source: "manual", manualOverride: true } }); await this.log(admin, request, "create", "team", member.id, dto); return member; }

  @Patch("team/:id")
  async updateTeamMember(@Param("id") id: string, @Body() dto: UpdateTeamMemberDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const { translations, ...data } = dto; const member = await this.prisma.teamMember.update({ where: { id }, data: { ...data, ...(translations !== undefined ? { translations: translations as Prisma.InputJsonValue } : {}), manualOverride: true } }); await this.log(admin, request, "update", "team", id, dto); return member; }

  @Delete("team/:id")
  async deleteTeamMember(@Param("id") id: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { await this.prisma.teamMember.delete({ where: { id } }); await this.log(admin, request, "delete", "team", id); return { success: true }; }

  @Get("news")
  newsList() { return this.prisma.newsItem.findMany({ orderBy: { eventDate: "desc" } }); }

  @Post("news")
  async createNews(@Body() dto: NewsItemDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const item = await this.prisma.newsItem.create({ data: { ...dto, translations: (dto.translations ?? {}) as Prisma.InputJsonValue, eventDate: new Date(dto.eventDate), source: "manual", manualOverride: true } }); await this.log(admin, request, "create", "news", item.id, dto); return item; }

  @Patch("news/:id")
  async updateNews(@Param("id") id: string, @Body() dto: UpdateNewsItemDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const { eventDate, translations, ...data } = dto; const item = await this.prisma.newsItem.update({ where: { id }, data: { ...data, ...(eventDate !== undefined ? { eventDate: new Date(eventDate) } : {}), ...(translations !== undefined ? { translations: translations as Prisma.InputJsonValue } : {}), manualOverride: true } }); await this.log(admin, request, "update", "news", id, dto); return item; }

  @Delete("news/:id")
  async deleteNews(@Param("id") id: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { await this.prisma.newsItem.delete({ where: { id } }); await this.log(admin, request, "delete", "news", id); return { success: true }; }

  @Get("sync")
  syncStates() { return this.prisma.syncState.findMany({ orderBy: { source: "asc" } }); }

  @Post("sync/:source")
  async runSync(@Param("source") source: string, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) {
    const result = source === "news" ? await this.news.refresh() : null;
    if (!result) throw new NotFoundException("Неизвестный источник синхронизации");
    await this.log(admin, request, "sync", source, undefined, { success: result.success, importedItems: result.importedItems, cachedItems: result.items.length, error: result.error });
    if (!result.success) throw new BadGatewayException({ message: "Не удалось получить свежие новости с сайта AYU", error: result.error, cachedItems: result.items.length });
    return { success: true, importedItems: result.importedItems, items: result.items.length, usedCache: false };
  }

  @Get("users")
  @AdminRoles("admin")
  users() { return this.prisma.adminUser.findMany({ select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true }, orderBy: { createdAt: "asc" } }); }

  @Post("users")
  @AdminRoles("admin")
  async createUser(@Body() dto: CreateAdminDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const user = await this.auth.createAdmin(dto); await this.log(admin, request, "create", "admin-user", user.id, { email: user.email, role: user.role }); return user; }

  @Patch("users/:id")
  @AdminRoles("admin")
  async updateUser(@Param("id") id: string, @Body() dto: UpdateAdminDto, @CurrentAdmin() admin: AuthenticatedAdmin, @Req() request: Request) { const user = await this.auth.updateAdmin(id, dto); await this.log(admin, request, "update", "admin-user", id, { name: dto.name, role: dto.role, active: dto.active, passwordChanged: Boolean(dto.password) }); return user; }

  @Get("audit")
  @AdminRoles("admin")
  auditList(@Query("page") page?: string) { const skip = (numberQuery(page, 1) - 1) * 50; return this.prisma.auditLog.findMany({ include: { admin: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip, take: 50 }); }

  private async findProject(idOrSlug: string) { const project = await this.prisma.project.findUnique({ where: { slug: idOrSlug } }) ?? (isUuid(idOrSlug) ? await this.prisma.project.findUnique({ where: { id: idOrSlug } }) : null); if (!project) throw new NotFoundException("Проект не найден"); return project; }
  private log(admin: AuthenticatedAdmin, request: Request, action: string, entity: string, entityId?: string, payload?: unknown) { return this.audit.record({ adminId: admin.id, action, entity, entityId, payload: payload as Prisma.InputJsonValue | undefined, ipAddress: request.ip }); }
}

function numberQuery(value: string | undefined, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback; }
function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function validApplicationStatus(status?: string): ApplicationStatus | undefined { return status && ["new", "reviewing", "interview", "accepted", "rejected"].includes(status) ? status as ApplicationStatus : undefined; }
function dateOrUndefined(value?: string | null) { return value ? new Date(value) : value === null ? null : undefined; }
function jsonData<T extends { translations?: Record<string, unknown> }>(dto: T) { return { ...dto, translations: (dto.translations ?? {}) as Prisma.InputJsonValue }; }
function jsonUpdateData<T extends { translations?: Record<string, unknown> }>(dto: T) { const { translations, ...data } = dto; return { ...data, ...(translations !== undefined ? { translations: translations as Prisma.InputJsonValue } : {}) }; }
function settingsData(dto: UpdateSettingsDto): Prisma.SiteSettingsUpdateInput { const { currentCohort: _derivedCohort, contextStats, translations, ...data } = dto; return { ...data, ...(contextStats !== undefined ? { contextStats: contextStats as unknown as Prisma.InputJsonValue } : {}), ...(translations !== undefined ? { translations: translations as Prisma.InputJsonValue } : {}) }; }
function projectCreateData(dto: CreateProjectDto): Prisma.ProjectCreateInput { return { slug: dto.slug, name: dto.name, summary: dto.summary, description: dto.description ?? "", translations: (dto.translations ?? {}) as Prisma.InputJsonValue, tags: dto.tags, accent: dto.accent ?? "#a8efd8", secondary: dto.secondary ?? "#d9ff62", glyph: dto.glyph ?? dto.name.slice(0, 2).toUpperCase(), stage: dto.stage, trlLevel: dto.trlLevel, cohortLabel: dto.cohortLabel ?? "", cohort: dto.cohortId ? { connect: { id: dto.cohortId } } : undefined, visual: dto.visual ?? "nodes", websiteUrl: dto.websiteUrl, demoUrl: dto.demoUrl, presentationUrl: dto.presentationUrl, socialUrl: dto.socialUrl, team: (dto.team ?? []) as Prisma.InputJsonValue, metrics: (dto.metrics ?? []) as Prisma.InputJsonValue, featured: dto.featured ?? false, sortOrder: dto.sortOrder ?? 0, status: dto.status ?? (dto.published ? "published" : "draft") }; }
function projectUpdateData(dto: UpdateProjectDto): Prisma.ProjectUpdateInput { const { published, cohortId, team, metrics, translations, ...data } = dto; return { ...data, ...(published !== undefined ? { status: published ? "published" : "draft" } : {}), ...(cohortId !== undefined ? { cohort: cohortId ? { connect: { id: cohortId } } : { disconnect: true } } : {}), ...(team !== undefined ? { team: team as Prisma.InputJsonValue } : {}), ...(metrics !== undefined ? { metrics: metrics as Prisma.InputJsonValue } : {}), ...(translations !== undefined ? { translations: translations as Prisma.InputJsonValue } : {}) }; }
function programData(dto: CreateProgramDto | UpdateProgramDto): Prisma.ProgramCreateInput { return { slug: dto.slug, title: dto.title, shortDescription: dto.shortDescription ?? "", description: dto.description ?? "", translations: (dto.translations ?? {}) as Prisma.InputJsonValue, duration: dto.duration, durationWeeks: dto.durationWeeks, price: dto.price ?? "0 ₸", runsPerYear: dto.runsPerYear ?? 1, equity: dto.equity ?? "0%", isFree: dto.isFree ?? true, status: dto.status ?? "open", format: dto.format ?? "Офлайн и онлайн", capacity: dto.capacity, applicationDeadline: dateOrUndefined(dto.applicationDeadline), startDate: dateOrUndefined(dto.startDate), endDate: dateOrUndefined(dto.endDate), requirements: (dto.requirements ?? []) as Prisma.InputJsonValue, stages: (dto.stages ?? []) as Prisma.InputJsonValue, outcomes: (dto.outcomes ?? []) as Prisma.InputJsonValue, sortOrder: dto.sortOrder ?? 0, published: dto.published ?? true }; }
function cohortData(dto: CreateCohortDto | UpdateCohortDto): Prisma.CohortUncheckedCreateInput { return { programId: dto.programId, number: dto.number, title: dto.title, status: dto.status ?? "soon", capacity: dto.capacity, applicationDeadline: dateOrUndefined(dto.applicationDeadline), startDate: dateOrUndefined(dto.startDate), endDate: dateOrUndefined(dto.endDate), published: dto.published ?? true }; }
function programUpdateData(dto: UpdateProgramDto): Prisma.ProgramUpdateInput { return { ...(dto.slug !== undefined ? { slug: dto.slug } : {}), ...(dto.title !== undefined ? { title: dto.title } : {}), ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}), ...(dto.description !== undefined ? { description: dto.description } : {}), ...(dto.translations !== undefined ? { translations: dto.translations as Prisma.InputJsonValue } : {}), ...(dto.duration !== undefined ? { duration: dto.duration } : {}), ...(dto.durationWeeks !== undefined ? { durationWeeks: dto.durationWeeks } : {}), ...(dto.price !== undefined ? { price: dto.price } : {}), ...(dto.runsPerYear !== undefined ? { runsPerYear: dto.runsPerYear } : {}), ...(dto.equity !== undefined ? { equity: dto.equity } : {}), ...(dto.isFree !== undefined ? { isFree: dto.isFree } : {}), ...(dto.status !== undefined ? { status: dto.status } : {}), ...(dto.format !== undefined ? { format: dto.format } : {}), ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}), ...(dto.applicationDeadline !== undefined ? { applicationDeadline: dateOrUndefined(dto.applicationDeadline) } : {}), ...(dto.startDate !== undefined ? { startDate: dateOrUndefined(dto.startDate) } : {}), ...(dto.endDate !== undefined ? { endDate: dateOrUndefined(dto.endDate) } : {}), ...(dto.requirements !== undefined ? { requirements: dto.requirements as Prisma.InputJsonValue } : {}), ...(dto.stages !== undefined ? { stages: dto.stages as Prisma.InputJsonValue } : {}), ...(dto.outcomes !== undefined ? { outcomes: dto.outcomes as Prisma.InputJsonValue } : {}), ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}), ...(dto.published !== undefined ? { published: dto.published } : {}) }; }
function cohortUpdateData(dto: UpdateCohortDto): Prisma.CohortUncheckedUpdateInput { return { ...(dto.programId !== undefined ? { programId: dto.programId } : {}), ...(dto.number !== undefined ? { number: dto.number } : {}), ...(dto.title !== undefined ? { title: dto.title } : {}), ...(dto.status !== undefined ? { status: dto.status } : {}), ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}), ...(dto.applicationDeadline !== undefined ? { applicationDeadline: dateOrUndefined(dto.applicationDeadline) } : {}), ...(dto.startDate !== undefined ? { startDate: dateOrUndefined(dto.startDate) } : {}), ...(dto.endDate !== undefined ? { endDate: dateOrUndefined(dto.endDate) } : {}), ...(dto.published !== undefined ? { published: dto.published } : {}) }; }
function courseData(dto: ItCourseDto): Prisma.ItCourseCreateInput { return { slug: dto.slug, title: dto.title, shortDescription: dto.shortDescription ?? "", description: dto.description ?? "", translations: (dto.translations ?? {}) as Prisma.InputJsonValue, dateLabel: dto.dateLabel ?? "", format: dto.format ?? "Офлайн", duration: dto.duration ?? "", includes: (dto.includes ?? []) as Prisma.InputJsonValue, imageUrl: dto.imageUrl, sortOrder: dto.sortOrder ?? 0, published: dto.published ?? true }; }
function courseUpdateData(dto: UpdateItCourseDto): Prisma.ItCourseUpdateInput { const { includes, translations, ...data } = dto; return { ...data, ...(includes !== undefined ? { includes: includes as Prisma.InputJsonValue } : {}), ...(translations !== undefined ? { translations: translations as Prisma.InputJsonValue } : {}) }; }
function adminProject(project: { id: string; slug: string; name: string; summary: string; description: string; tags: string[]; accent: string; secondary: string; glyph: string; stage: string; trlLevel: number | null; cohortLabel: string; visual: string; websiteUrl: string | null; demoUrl: string | null; presentationUrl: string | null; socialUrl: string | null; team: unknown; metrics: unknown; featured: boolean; sortOrder: number; status: string; media: Array<{ kind: string; alt: string; sortOrder: number; media: { id: string; url: string; width: number | null; height: number | null } }> }) { return { ...project, id: project.slug, databaseId: project.id, text: project.summary, cohort: project.cohortLabel, published: project.status === "published", media: project.media.map((entry) => ({ ...entry.media, kind: entry.kind, alt: entry.alt, sortOrder: entry.sortOrder })) }; }
