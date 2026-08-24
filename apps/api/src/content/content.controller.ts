import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { NewsService } from "./news.service";
import { TeamService } from "./team.service";
import { CohortStatsService } from "./cohort-stats.service";
import { localizeRecord, normalizeLocale } from "./localization";

@Controller()
export class ContentController {
  constructor(private readonly prisma: PrismaService, private readonly news: NewsService, private readonly team: TeamService, private readonly cohortStats: CohortStatsService) {}

  @Get("health")
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", service: "yasawi-api", database: "ok", timestamp: new Date().toISOString() };
  }

  @Get("public/home")
  async home(@Query("locale") localeInput?: string) {
    const locale = normalizeLocale(localeInput);
    const [settings, programs, projects, partners, news, team, itCourses] = await Promise.all([
      this.publicSettings(locale), this.publicPrograms(locale), this.publicProjects(locale), this.publicPartners(locale), this.news.list(3, locale), this.team.list(3, locale), this.publicItCourses(locale),
    ]);
    return { settings, programs, projects, partners, news, team, itCourses, startupCount: projects.length };
  }

  @Get("site")
  async site() {
    const settings = await this.requireSettings();
    return {
      name: "YASAWI STARTUP", location: "Туркестан, Казахстан",
      stats: [
        { value: "2022", label: "год запуска" }, { value: `${settings.totalParticipants}+`, label: "зарегистрированных участников" },
        { value: "60", label: "часов практической работы" }, { value: String(settings.currentCohort), label: "потоков программы" },
      ],
      contacts: { email: settings.contactEmail, phone: settings.contactPhone, address: settings.address, instagram: settings.instagram, youtube: settings.youtube, telegram: settings.telegram, whatsapp: settings.whatsapp },
    };
  }

  @Get("public/site-settings")
  async publicSettings(@Query("locale") locale?: string) { return localizeRecord(await this.requireSettings(), locale); }

  @Get("public/programs")
  async publicPrograms(@Query("locale") locale?: string) {
    const programs = await this.prisma.program.findMany({ where: { published: true }, include: { _count: { select: { applications: true } } }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
    return programs.map(({ _count, ...program }) => ({ ...localizeRecord(program, locale), applicationCount: _count.applications }));
  }

  @Get("public/programs/:slug")
  async publicProgram(@Param("slug") slug: string, @Query("locale") locale?: string) {
    const program = await this.prisma.program.findFirst({ where: { slug, published: true }, include: { cohorts: { where: { published: true }, orderBy: { number: "desc" } }, _count: { select: { applications: true } } } });
    if (!program) throw new NotFoundException("Программа не найдена");
    const { _count, ...data } = program;
    return { ...localizeRecord(data, locale), applicationCount: _count.applications };
  }

  @Get("public/news")
  publicNews(@Query("limit") limit?: string, @Query("locale") locale?: string) { return this.news.list(limit ? Number(limit) : 6, locale); }

  @Get("public/team")
  publicTeam(@Query("limit") limit?: string, @Query("locale") locale?: string) { return this.team.list(limit ? Number(limit) : 20, locale); }

  @Get("public/partners")
  async publicPartners(@Query("locale") locale?: string) { return (await this.prisma.partner.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })).map((item) => localizeRecord(item, locale)); }

  @Get("public/it-courses")
  async publicItCourses(@Query("locale") locale?: string) { return (await this.prisma.itCourse.findMany({ where: { published: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] })).map((item) => localizeRecord(item, locale)); }

  @Get("public/pages/:key")
  async publicPage(@Param("key") key: string, @Query("locale") locale?: string) {
    const content = await this.prisma.pageContent.findFirst({ where: { key, status: "published" } });
    if (!content) throw new NotFoundException("Страница не найдена");
    return localizeRecord(content, locale);
  }

  @Get("startups")
  startups(@Query("locale") locale?: string) { return this.publicProjects(locale); }

  @Get("public/projects")
  async publicProjects(@Query("locale") locale?: string) {
    const projects = await this.prisma.project.findMany({ where: { status: "published" }, include: { media: { include: { media: true }, orderBy: { sortOrder: "asc" } } }, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });
    return projects.map((project) => projectResponse(localizeRecord(project, locale)));
  }

  @Get("public/projects/:slug")
  async publicProject(@Param("slug") slug: string, @Query("locale") locale?: string) {
    const project = await this.prisma.project.findFirst({ where: { slug, status: "published" }, include: { media: { include: { media: true }, orderBy: { sortOrder: "asc" } } } });
    if (!project) throw new NotFoundException("Проект не найден");
    return projectResponse(localizeRecord(project, locale));
  }

  private async requireSettings() {
    const settings = await this.cohortStats.settingsWithDerivedCohort();
    if (!settings) throw new NotFoundException("Настройки сайта не инициализированы");
    return settings;
  }
}

function projectResponse(project: { id: string; slug: string; name: string; summary: string; description: string; tags: string[]; accent: string; secondary: string; glyph: string; stage: string; trlLevel: number | null; cohortLabel: string; visual: string; websiteUrl: string | null; demoUrl: string | null; presentationUrl: string | null; socialUrl: string | null; team: unknown; metrics: unknown; featured: boolean; status: string; media: Array<{ kind: string; alt: string; sortOrder: number; media: { id: string; url: string; width: number | null; height: number | null } }> }) {
  return { id: project.slug, databaseId: project.id, slug: project.slug, name: project.name, text: project.summary, summary: project.summary, description: project.description, tags: project.tags, accent: project.accent, secondary: project.secondary, glyph: project.glyph, stage: project.stage, trlLevel: project.trlLevel, cohort: project.cohortLabel, visual: project.visual, websiteUrl: project.websiteUrl, demoUrl: project.demoUrl, presentationUrl: project.presentationUrl, socialUrl: project.socialUrl, team: project.team, metrics: project.metrics, featured: project.featured, published: project.status === "published", media: project.media.map((entry) => ({ ...entry.media, kind: entry.kind, alt: entry.alt, sortOrder: entry.sortOrder })) };
}
