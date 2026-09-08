"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, Building2, CalendarDays, Check, Code2, Download, ExternalLink, FileText, Globe2, Info, LayoutDashboard, LogOut, Newspaper, Plus, RefreshCw, Rocket, Save, Settings, ShieldCheck, Trash2, UserCog, Users, UsersRound } from "lucide-react";
import styles from "./admin.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const applicationStatuses = ["new", "reviewing", "interview", "accepted", "rejected"] as const;
const enrollmentStatuses = ["open", "soon", "closed", "completed"] as const;
const defaultContextStats = [
  { value: "7", label: "потоков", note: "проведено с момента запуска", source: "currentCohort" as const },
  { value: "400+", label: "участников", note: "подали заявки на программы", source: "totalParticipants" as const },
  { value: "60", label: "часов", note: "практики в одном потоке" },
  { value: "15", label: "стартапов", note: "представлено в витрине", source: "startupCount" as const },
];
const statusLabels: Record<string, string> = {
  new: "Новая", reviewing: "На рассмотрении", interview: "Интервью", accepted: "Принята", rejected: "Отклонена",
  open: "Набор открыт", soon: "Скоро", closed: "Набор закрыт", completed: "Завершена",
  draft: "Черновик", published: "Опубликовано", archived: "Архив",
};

type SettingsData = {
  id: string; currentCohort: number; totalParticipants: number; incubationWeeks: number;
  nextCohortStatus: typeof enrollmentStatuses[number]; nextCohortDate: string;
  responseDays: number; contactEmail: string; contactPhone: string; address: string;
  whatsapp: string | null; instagram: string | null; telegram: string | null; youtube: string | null;
  contextStats: Array<{ value: string; label: string; note?: string; source?: "manual" | "currentCohort" | "totalParticipants" | "incubationWeeks" | "startupCount" }>;
  heroEyebrow: string; heroTitle: string; heroOutline: string; heroDescription: string; defaultLocale: string; translations?: Record<string, unknown>; updatedAt: string;
};
type Application = {
  id: string; program: { slug: string; title: string }; programSlug: string; name: string; email: string; phone: string; idea: string;
  status: typeof applicationStatuses[number]; notes: string; createdAt: string; locale: string;
  consent: boolean; consentAt: string | null; consentVersion: string; authorityConfirmed: boolean;
};
type Media = { id: string; url: string; alt: string; kind: string };
type Project = {
  id: string; databaseId: string; name: string; tags: string[]; text: string; summary: string; description: string;
  accent: string; secondary: string; glyph: string; stage: string; cohort: string; cohortLabel: string; visual: string;
  trlLevel: number | null;
  websiteUrl: string | null; demoUrl: string | null; presentationUrl: string | null; socialUrl: string | null;
  featured: boolean; sortOrder: number; published: boolean; media?: Media[]; translations?: Record<string, unknown>;
};
type Program = {
  id: string; slug: string; title: string; shortDescription: string; description: string; duration: string; durationWeeks: number | null;
  price: string; runsPerYear: number; equity: string;
  isFree: boolean; status: typeof enrollmentStatuses[number]; format: string; capacity: number | null; applicationDeadline: string | null;
  startDate: string | null; endDate: string | null; sortOrder: number; published: boolean; applicationCount: number; translations?: Record<string, unknown>;
};
type Cohort = {
  id: string; programId: string; number: number; title: string; status: typeof enrollmentStatuses[number]; capacity: number | null;
  applicationDeadline: string | null; startDate: string | null; endDate: string | null; published: boolean;
  program: { id: string; slug: string; title: string }; _count: { applications: number; projects: number };
};
type Partner = { id: string; name: string; logoUrl: string; websiteUrl: string | null; alt: string; sortOrder: number; published: boolean; translations?: Record<string, unknown> };
type TeamMember = { id: string; name: string; role: string; email: string; phone: string | null; imageUrl: string; profileUrl: string | null; source: string; sortOrder: number; published: boolean; translations?: Record<string, unknown> };
type NewsItem = { id: string; title: string; summary: string; eventDate: string; imageUrl: string; sourceUrl: string; location: string; source: string; sortOrder: number; published: boolean; translations?: Record<string, unknown> };
type ItCourse = { id: string; slug: string; title: string; shortDescription: string; description: string; dateLabel: string; format: string; duration: string; includes: string[]; imageUrl: string | null; sortOrder: number; published: boolean; translations?: Record<string, unknown> };
type PageContent = { id: string; key: string; page: string; content: Record<string, unknown>; contentText: string; seoTitle: string | null; seoDescription: string | null; status: "draft" | "published" | "archived"; translations?: Record<string, unknown> };
type AboutContent = {
  hero: { eyebrow: string; title: string; outline: string; description: string };
  story: { eyebrow: string; title: string; outline: string; paragraphs: string[] };
  values: Array<{ title: string; text: string }>;
  stats: Array<{ value: string; label: string }>;
  contact: { eyebrow: string; title: string; buttonLabel: string };
};
type AdminUser = { id: string; email: string; name: string; role: "admin" | "editor"; active?: boolean; lastLoginAt?: string | null; createdAt?: string; password?: string };
type AuditLog = { id: string; action: string; entity: string; entityId: string | null; createdAt: string; admin: { name: string; email: string } | null };
type SyncState = { id: string; source: string; status: string; lastAttemptAt: string | null; lastSuccessAt: string | null; lastError: string | null; itemsCount: number };
type IntegrationStatus = { service: "smtp" | "storage"; configured: boolean; reachable?: boolean; host?: string | null; port?: number; from?: string | null; mode?: "local" | "s3"; bucket?: string | null; publicUrl?: string | null };
type Integrations = { smtp: IntegrationStatus; storage: IntegrationStatus };
type Dashboard = { counters: { applications: number; newApplications: number; acceptedApplications: number; publishedProjects: number } };
type ApplicationResponse = { items: Application[]; total: number; page: number; pageSize: number; pages: number };
type Tab = "applications" | "settings" | "projects" | "programs" | "courses" | "cohorts" | "partners" | "team" | "news" | "pages" | "localization" | "users" | "audit" | "integrations" | "sync";

const tabGuide: Partial<Record<Tab, { text: string; href?: string }>> = {
  applications: { text: "Все заявки с публичной формы приходят сюда. Изменение статуса и внутренняя заметка не показываются заявителю." },
  settings: { text: "Главный экран, статус набора, контакты и социальные сети. Карточки статистики на главной редактируются отдельно в блоке «Цифры с контекстом». Срок ответа показывается на странице заявки.", href: "/" },
  projects: { text: "На витрине отображаются только проекты с включённым переключателем «На сайте». Обложка, описание, TRL, поток и ссылки берутся отсюда.", href: "/startups" },
  programs: { text: "Здесь меняются цифры и описания программ. «На сайте» управляет видимостью карточки, а статус — доступностью программы в форме заявки.", href: "/program" },
  courses: { text: "Опубликованные курсы появляются на странице IT-обучения. Полное описание, дата и состав открываются в модальном окне.", href: "/program/it-education" },
  cohorts: { text: "Поток относится к выбранной программе и хранит сроки, вместимость и статус конкретного набора. Номер текущего потока на главной автоматически берётся из последнего опубликованного потока инкубации." },
  partners: { text: "Опубликованные логотипы выводятся на главной в заданном порядке.", href: "/#partners" },
  team: { text: "Команда управляется только здесь и больше не импортируется с сайта университета.", href: "/" },
  news: { text: "Можно добавлять материалы вручную или импортировать с AYU. Три последние записи показываются на главной, а все опубликованные записи — в галерее.", href: "/gallery" },
  pages: { text: "Раздел для расширенного контента страниц. Ключ about управляет страницей «О нас»; JSON должен оставаться корректным.", href: "/about" },
  localization: { text: "Переводы накладываются на русские поля. После сохранения переключите язык на публичном сайте для проверки.", href: "/" },
  integrations: { text: "Здесь видно, настроены ли почтовые уведомления и постоянное хранилище изображений. Проверка соединения не отправляет письмо и не загружает файл." },
  sync: { text: "Ручной запуск немедленно запрашивает свежие новости с официальной страницы AYU." },
};

let refreshRequest: Promise<Response> | null = null;

async function request(path: string, init?: RequestInit, retry = true): Promise<Response> {
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers);
  if (init?.body && !isForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init, credentials: "include", headers });
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    refreshRequest ??= fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" }).finally(() => { refreshRequest = null; });
    if ((await refreshRequest).ok) return request(path, init, false);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string | string[] } | null;
    throw new Error(Array.isArray(error?.message) ? error.message.join(". ") : error?.message ?? (response.status === 401 ? "Требуется повторный вход" : `Ошибка API: ${response.status}`));
  }
  return response;
}

async function api<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  return (await request(path, init, retry)).json() as Promise<T>;
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loginEmail, setLoginEmail] = useState("admin@yasawi.local");
  const [loginPassword, setLoginPassword] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<Tab>("applications");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [courses, setCourses] = useState<ItCourse[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [syncStates, setSyncStates] = useState<SyncState[]>([]);
  const [integrations, setIntegrations] = useState<Integrations | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "", role: "editor" as "admin" | "editor" });
  const [newCohortProgramId, setNewCohortProgramId] = useState("");

  useEffect(() => {
    api<{ admin: AdminUser }>("/auth/me")
      .then((result) => setAdmin(result.admin))
      .catch(() => undefined)
      .finally(() => setAuthReady(true));
  }, []);
  useEffect(() => { if (admin) void loadAll(); }, [admin]);

  async function loadAll() {
    setLoading(true);
    const results = await Promise.allSettled([
      api<Dashboard>("/admin/dashboard"), api<SettingsData>("/admin/settings"), api<ApplicationResponse>("/admin/applications?pageSize=100"),
      api<Project[]>("/admin/projects"), api<Program[]>("/admin/programs"), api<Cohort[]>("/admin/cohorts"), api<Partner[]>("/admin/partners"),
      api<TeamMember[]>("/admin/team"), api<NewsItem[]>("/admin/news"), api<Array<Omit<PageContent, "contentText">>>("/admin/pages"),
      api<SyncState[]>("/admin/sync"), admin?.role === "admin" ? api<AdminUser[]>("/admin/users") : Promise.resolve([]), admin?.role === "admin" ? api<AuditLog[]>("/admin/audit") : Promise.resolve([]), api<ItCourse[]>("/admin/it-courses"), api<Integrations>("/admin/integrations"),
    ]);
    assignResult(results[0], setDashboard); assignResult(results[1], (value) => setSettings({ ...value, contextStats: (value.contextStats?.length ? value.contextStats : defaultContextStats).map((stat) => ({ ...stat, source: stat.source ?? inferStatSource(stat.label) })) }));
    assignResult(results[2], (value) => setApplications(value.items)); assignResult(results[3], setProjects); assignResult(results[4], setPrograms);
    assignResult(results[5], setCohorts); assignResult(results[6], setPartners); assignResult(results[7], setTeam); assignResult(results[8], setNews);
    assignResult(results[9], (value) => setPages(value.map(normalizePage))); assignResult(results[10], setSyncStates); assignResult(results[11], setUsers); assignResult(results[12], setAudit); assignResult(results[13], setCourses); assignResult(results[14], setIntegrations);
    const sectionNames = ["сводка", "настройки", "заявки", "проекты", "программы", "потоки", "партнёры", "команда", "новости", "страницы", "синхронизация", "администраторы", "история", "IT-курсы", "сервисы"];
    const failed = results.map((result, index) => result.status === "rejected" ? sectionNames[index] : null).filter(Boolean);
    setMessage(failed.length ? `Не удалось загрузить: ${failed.join(", ")}.` : "");
    setLoading(false);
  }

  async function login(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    try { const result = await api<{ admin: AdminUser }>("/auth/login", { method: "POST", body: JSON.stringify({ email: loginEmail, password: loginPassword }) }, false); setAdmin(result.admin); setLoginPassword(""); }
    catch (error) { setMessage(errorMessage(error, "Не удалось войти")); }
    finally { setLoading(false); }
  }
  async function logout() { await api("/auth/logout", { method: "POST" }, false).catch(() => undefined); setAdmin(null); setDashboard(null); }

  async function saveSettings(event: FormEvent) {
    event.preventDefault(); if (!settings) return;
    await runSave(async () => setSettings(await api<SettingsData>("/admin/settings", { method: "PATCH", body: JSON.stringify(settingsPayload(settings)) })));
  }
  async function updateApplication(item: Application) { await runSave(async () => { const updated = await api<Application>(`/admin/applications/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: item.status, notes: item.notes }) }); patchList(setApplications, item.id, updated); await refreshDashboard(); }); }
  async function updateProject(item: Project) { await runSave(async () => { const updated = await api<Project>(`/admin/projects/${item.id}`, { method: "PATCH", body: JSON.stringify(projectPayload(item)) }); patchList(setProjects, item.id, updated); await refreshDashboard(); }); }
  async function createProject() { await runSave(async () => { const slug = `project-${Date.now()}`; const created = await api<Project>("/admin/projects", { method: "POST", body: JSON.stringify({ slug, name: "Новый проект", tags: ["Startup"], summary: "Добавьте краткое описание нового проекта здесь.", stage: "Идея", cohortLabel: `Поток ${String(settings?.currentCohort ?? 1).padStart(2, "0")}`, published: false }) }); setProjects((items) => [created, ...items]); }); }
  async function archiveProject(item: Project) { if (!confirm(`Перенести «${item.name}» в архив?`)) return; await runSave(async () => { await api(`/admin/projects/${item.id}`, { method: "DELETE" }); setProjects((items) => items.filter((entry) => entry.id !== item.id)); await refreshDashboard(); }); }
  async function updateProgram(item: Program) { await runSave(async () => { const updated = await api<Program>(`/admin/programs/${item.slug}`, { method: "PATCH", body: JSON.stringify(programPayload(item)) }); patchList(setPrograms, item.slug, updated, "slug"); }); }
  async function createCohort() { const program = programs.find((item) => item.id === newCohortProgramId) ?? programs[0]; if (!program) return setMessage("Сначала создайте программу"); const next = Math.max(0, ...cohorts.filter((item) => item.programId === program.id).map((item) => item.number)) + 1; await runSave(async () => { await api<Cohort>("/admin/cohorts", { method: "POST", body: JSON.stringify({ programId: program.id, number: next, title: `Поток ${next}`, status: "soon", published: true }) }); setNewCohortProgramId(program.id); await loadAll(); }); }
  async function updateCohort(item: Cohort) { await runSave(async () => { await api<Partial<Cohort>>(`/admin/cohorts/${item.id}`, { method: "PATCH", body: JSON.stringify(cohortPayload(item)) }); await loadAll(); }); }
  async function updatePartner(item: Partner) { await runSave(async () => patchList(setPartners, item.id, await api<Partner>(`/admin/partners/${item.id}`, { method: "PATCH", body: JSON.stringify(partnerPayload(item)) }))); }
  async function createPartner() { await runSave(async () => { const created = await api<Partner>("/admin/partners", { method: "POST", body: JSON.stringify({ name: "Новый партнёр", logoUrl: "/partners/ayu.png", alt: "Логотип партнёра", sortOrder: partners.length, published: false }) }); setPartners((items) => [...items, created]); }); }
  async function deletePartner(item: Partner) { if (!confirm(`Удалить партнёра «${item.name}»?`)) return; await runSave(async () => { await api(`/admin/partners/${item.id}`, { method: "DELETE" }); setPartners((items) => items.filter((entry) => entry.id !== item.id)); }); }
  async function updateTeamMember(item: TeamMember) { await runSave(async () => patchList(setTeam, item.id, await api<TeamMember>(`/admin/team/${item.id}`, { method: "PATCH", body: JSON.stringify(teamPayload(item)) }))); }
  async function createTeamMember() { await runSave(async () => { const stamp = Date.now(); const created = await api<TeamMember>("/admin/team", { method: "POST", body: JSON.stringify({ name: "Новый участник", role: "Должность", email: `member-${stamp}@example.com`, imageUrl: "/brand/yasawi-startup-logo.png", published: false }) }); setTeam((items) => [...items, created]); }); }
  async function updateNews(item: NewsItem) { await runSave(async () => patchList(setNews, item.id, await api<NewsItem>(`/admin/news/${item.id}`, { method: "PATCH", body: JSON.stringify(newsPayload(item)) }))); }
  async function createNews() { await runSave(async () => { const stamp = Date.now(); const created = await api<NewsItem>("/admin/news", { method: "POST", body: JSON.stringify({ title: "Новая публикация", summary: "Добавьте описание новости", eventDate: new Date().toISOString(), imageUrl: "/brand/yasawi-startup-logo.png", sourceUrl: `https://ayu.edu.kz/news/${stamp}`, location: "Туркестан", published: false }) }); setNews((items) => [created, ...items]); }); }
  async function deleteNews(item: NewsItem) { if (!confirm(`Удалить новость «${item.title}»?`)) return; await runSave(async () => { await api(`/admin/news/${item.id}`, { method: "DELETE" }); setNews((items) => items.filter((entry) => entry.id !== item.id)); }); }
  async function deleteTeamMember(item: TeamMember) { if (!confirm(`Удалить «${item.name}» из команды?`)) return; await runSave(async () => { await api(`/admin/team/${item.id}`, { method: "DELETE" }); setTeam((items) => items.filter((entry) => entry.id !== item.id)); }); }
  async function createCourse() { await runSave(async () => { const stamp = Date.now(); const created = await api<ItCourse>("/admin/it-courses", { method: "POST", body: JSON.stringify({ slug: `course-${stamp}`, title: "Новый IT-курс", shortDescription: "Краткое описание курса", description: "Полное описание курса", dateLabel: "Дата будет объявлена", format: "Офлайн", duration: "4 недели", includes: [], sortOrder: courses.length, published: false }) }); setCourses((items) => [...items, created]); }); }
  async function updateCourse(item: ItCourse) { await runSave(async () => patchList(setCourses, item.id, await api<ItCourse>(`/admin/it-courses/${item.id}`, { method: "PATCH", body: JSON.stringify(coursePayload(item)) }))); }
  async function deleteCourse(item: ItCourse) { if (!confirm(`Удалить курс «${item.title}»?`)) return; await runSave(async () => { await api(`/admin/it-courses/${item.id}`, { method: "DELETE" }); setCourses((items) => items.filter((entry) => entry.id !== item.id)); }); }
  async function updatePage(item: PageContent) { await runSave(async () => { const content = JSON.parse(item.contentText) as Record<string, unknown>; const updated = await api<Omit<PageContent, "contentText">>(`/admin/pages/${item.id}`, { method: "PATCH", body: JSON.stringify({ key: item.key, page: item.page, content, seoTitle: emptyToNull(item.seoTitle), seoDescription: emptyToNull(item.seoDescription), status: item.status }) }); patchList(setPages, item.id, normalizePage(updated)); }); }
  async function createPage() { return createSeoPage(); }
  async function createSeoPage() {
    const templates = [
      ["home", "Главная"], ["about", "О нас"], ["programs", "Программы"],
      ["incubation", "Инкубация"], ["acceleration", "Акселерация"], ["education", "IT-обучение"],
      ["startups", "Стартапы"], ["gallery", "Галерея"], ["faq", "FAQ"],
      ["apply", "Подача заявки"], ["privacy", "Конфиденциальность"],
    ] as const;
    const template = templates.find(([key]) => !pages.some((page) => page.key === key));
    if (!template) {
      await runSave(async () => {
        const stamp = Date.now();
        const created = await api<Omit<PageContent, "contentText">>("/admin/pages", { method: "POST", body: JSON.stringify({ key: `page-${stamp}`, page: "Новая страница", content: {}, status: "draft" }) });
        setPages((items) => [...items, normalizePage(created)]);
      });
      return;
    }
    await runSave(async () => {
      const created = await api<Omit<PageContent, "contentText">>("/admin/pages", { method: "POST", body: JSON.stringify({ key: template[0], page: template[1], content: {}, status: "published" }) });
      setPages((items) => [...items, normalizePage(created)]);
    });
  }
  async function updateUser(item: AdminUser) { await runSave(async () => patchList(setUsers, item.id, await api<AdminUser>(`/admin/users/${item.id}`, { method: "PATCH", body: JSON.stringify({ name: item.name, role: item.role, active: item.active, ...(item.password ? { password: item.password } : {}) }) }))); }
  async function createUser(event: FormEvent) { event.preventDefault(); await runSave(async () => { const created = await api<AdminUser>("/admin/users", { method: "POST", body: JSON.stringify(newAdmin) }); setUsers((items) => [...items, created]); setNewAdmin({ name: "", email: "", password: "", role: "editor" }); }); }
  async function uploadProjectImage(project: Project, file: File) { await runSave(async () => { const form = new FormData(); form.append("file", file); form.append("alt", project.name); const media = await api<{ id: string }>("/admin/media", { method: "POST", body: form }); await api(`/admin/media/${media.id}/projects/${project.databaseId}`, { method: "POST", body: JSON.stringify({ kind: "cover", alt: project.name, sortOrder: 0 }) }); await loadAll(); }); }
  async function runSync() {
    setLoading(true); setMessage("");
    try {
      const result = await api<{ success: true; importedItems: number }>("/admin/sync/news", { method: "POST" });
      setMessage(`Синхронизация завершена: получено ${result.importedItems} новостей с AYU.`);
      window.localStorage.setItem("yasawi-cms-updated", String(Date.now()));
    } catch (error) {
      setMessage(errorMessage(error, "Не удалось синхронизировать новости"));
    } finally {
      const states = await api<SyncState[]>("/admin/sync").catch(() => null);
      if (states) setSyncStates(states);
      setLoading(false);
    }
  }
  async function checkIntegration(service: "smtp" | "storage") {
    setLoading(true); setMessage("");
    try {
      const result = await api<IntegrationStatus>(`/admin/integrations/${service}/check`, { method: "POST" });
      setIntegrations((current) => current ? { ...current, [service]: result } : current);
      setMessage(service === "smtp" ? "SMTP доступен — соединение установлено" : "Медиахранилище доступно для записи");
    } catch (error) {
      setMessage(errorMessage(error, "Не удалось проверить сервис"));
    } finally { setLoading(false); }
  }
  async function downloadApplications() { await runSave(async () => { const response = await request("/admin/applications/export"); const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = `yasawi-applications-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url); }); }

  async function runSave(operation: () => Promise<void>) { setLoading(true); setMessage(""); try { await operation(); await fetch("/api/revalidate", { method: "POST" }).catch(() => undefined); window.localStorage.setItem("yasawi-cms-updated", String(Date.now())); setMessage("Изменения сохранены — открытые вкладки сайта обновляются автоматически"); } catch (error) { setMessage(errorMessage(error, "Не удалось сохранить")); } finally { setLoading(false); } }
  async function refreshDashboard() { setDashboard(await api<Dashboard>("/admin/dashboard")); }
  const filteredApplications = useMemo(() => { const query = search.trim().toLowerCase(); return query ? applications.filter((item) => `${item.name} ${item.email} ${item.phone} ${item.idea}`.toLowerCase().includes(query)) : applications; }, [applications, search]);

  if (!authReady || !admin) return <LoginPage authReady={authReady} loading={loading} message={message} email={loginEmail} password={loginPassword} onEmail={setLoginEmail} onPassword={setLoginPassword} onSubmit={login} />;

  const nav: Array<{ id: Tab; label: string; icon: typeof Users }> = [
    { id: "applications", label: "Заявки", icon: Users }, { id: "settings", label: "Настройки", icon: Settings },
    { id: "projects", label: "Проекты", icon: Rocket }, { id: "programs", label: "Программы", icon: LayoutDashboard },
    { id: "courses", label: "IT-курсы", icon: Code2 },
    { id: "cohorts", label: "Потоки", icon: CalendarDays }, { id: "partners", label: "Партнёры", icon: Building2 },
    { id: "team", label: "Команда", icon: UsersRound }, { id: "news", label: "Новости", icon: Newspaper },
    { id: "pages", label: "Страницы", icon: FileText },
    { id: "localization", label: "Переводы", icon: Globe2 },
    ...(admin.role === "admin" ? [{ id: "users" as const, label: "Доступ", icon: UserCog }, { id: "audit" as const, label: "История", icon: Activity }] : []),
    { id: "integrations", label: "Сервисы", icon: ShieldCheck },
    { id: "sync", label: "Синхронизация", icon: RefreshCw },
  ];
  const counters = dashboard?.counters ?? { applications: applications.length, newApplications: applications.filter((item) => item.status === "new").length, acceptedApplications: applications.filter((item) => item.status === "accepted").length, publishedProjects: projects.filter((item) => item.published).length };

  return <main className={styles.adminPage}>
    <aside className={styles.sidebar}><div className={styles.brand}><span>Y</span><strong>YASAWI<br />CONTROL</strong></div><nav>{nav.map((item) => <button type="button" className={tab === item.id ? styles.activeNav : ""} onClick={() => setTab(item.id)} key={item.id}><item.icon />{item.label}</button>)}</nav><button type="button" className={styles.logout} onClick={logout}><LogOut />Выйти</button></aside>
    <section className={styles.workspace}>
      <header className={styles.topbar}><div><small>АДМИНИСТРИРОВАНИЕ</small><h1>{nav.find((item) => item.id === tab)?.label}</h1></div><div className={styles.topActions}>{message && <span className={message.includes("сохранены") ? styles.success : styles.errorText}>{message}</span>}<a href="/" target="_blank" rel="noreferrer">Открыть сайт <ExternalLink /></a><button type="button" onClick={() => void loadAll()} disabled={loading}><RefreshCw className={loading ? styles.spinning : ""} />Обновить данные</button></div></header>
      {tabGuide[tab] && <aside className={styles.sectionGuide}><Info /><p>{tabGuide[tab]?.text}</p>{tabGuide[tab]?.href && <a href={tabGuide[tab]?.href} target="_blank" rel="noreferrer">Проверить на сайте <ExternalLink /></a>}</aside>}
      <div className={styles.metrics}><article><small>ВСЕГО ЗАЯВОК</small><strong>{counters.applications}</strong></article><article><small>НОВЫЕ</small><strong>{counters.newApplications}</strong></article><article><small>ПРИНЯТО</small><strong>{counters.acceptedApplications}</strong></article><article><small>ПРОЕКТОВ НА САЙТЕ</small><strong>{counters.publishedProjects}</strong></article></div>

      {tab === "applications" && <Panel eyebrow="ВХОДЯЩИЕ" title="Заявки участников" action={<div className={styles.panelTools}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по заявкам" /><button type="button" onClick={() => void downloadApplications()}><Download />CSV</button></div>}><div className={styles.applicationList}>{filteredApplications.length === 0 && <Empty>Заявок по выбранному запросу нет.</Empty>}{filteredApplications.map((item) => <article className={styles.applicationCard} key={item.id}><div className={styles.person}><span>{item.name.slice(0, 1).toUpperCase()}</span><div><h3>{item.name}</h3><small>{formatDate(item.createdAt)}</small></div></div><div className={styles.applicationBody}><b>{item.program.title}</b><p>{item.idea}</p><small className={styles.consentEvidence}>Согласие: {item.consentVersion} · {item.locale.toUpperCase()} · {item.consentAt ? formatDate(item.consentAt) : "дата не записана"}{item.authorityConfirmed ? " · полномочия подтверждены" : " · прежняя запись"}</small><div><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a></div></div><div className={styles.applicationControls}><select value={item.status} onChange={(event) => patchState(setApplications, item.id, { status: event.target.value as Application["status"] })}>{applicationStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select><textarea value={item.notes} onChange={(event) => patchState(setApplications, item.id, { notes: event.target.value })} placeholder="Заметка для команды" /><button type="button" onClick={() => void updateApplication(item)} disabled={loading}><Save />Сохранить</button></div></article>)}</div></Panel>}

      {tab === "settings" && settings && <form className={styles.panel} onSubmit={saveSettings}>
        <PanelHeader eyebrow="ПУБЛИЧНЫЕ ДАННЫЕ" title="Параметры сайта и набора" action={<button className={styles.saveButton} disabled={loading}><Save />Сохранить всё</button>} />
        <div className={styles.settingsGrid}>
          <Field label="Текущий поток" hint="Автоматически: последний опубликованный поток инкубации"><input type="number" value={settings.currentCohort} disabled /></Field>
          <Field label="Всего участников" hint="Общая служебная цифра программы"><input type="number" min="0" value={settings.totalParticipants} onChange={(event) => setSettings({ ...settings, totalParticipants: Number(event.target.value) })} /></Field>
          <Field label="Длительность инкубации, недель" hint="Точная цифра отдельной программы меняется в разделе «Программы»"><input type="number" min="1" max="52" value={settings.incubationWeeks} onChange={(event) => setSettings({ ...settings, incubationWeeks: Number(event.target.value) })} /></Field>
          <Field label="Срок ответа, дней" hint="Показывается рядом с формой заявки"><input type="number" min="1" max="30" value={settings.responseDays} onChange={(event) => setSettings({ ...settings, responseDays: Number(event.target.value) })} /></Field>
          <Field label="Статус следующего набора" hint="Меняет статус на первом экране"><StatusSelect value={settings.nextCohortStatus} onChange={(value) => setSettings({ ...settings, nextCohortStatus: value })} /></Field>
          <Field label="Дата или пояснение" hint="Например: Приём до 15 сентября"><input value={settings.nextCohortDate} onChange={(event) => setSettings({ ...settings, nextCohortDate: event.target.value })} /></Field>
          <Field label="Контактный email"><input type="email" value={settings.contactEmail} onChange={(event) => setSettings({ ...settings, contactEmail: event.target.value })} /></Field>
          <Field label="Контактный телефон"><input value={settings.contactPhone} onChange={(event) => setSettings({ ...settings, contactPhone: event.target.value })} /></Field>
          <Field label="Адрес"><input value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} /></Field>
          <Field label="WhatsApp" hint="Полная ссылка, например https://wa.me/..."><input value={settings.whatsapp ?? ""} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })} /></Field>
          <Field label="Instagram" hint="Полная ссылка на профиль"><input value={settings.instagram ?? ""} onChange={(event) => setSettings({ ...settings, instagram: event.target.value })} /></Field>
          <Field label="Telegram" hint="Полная ссылка на канал или профиль"><input value={settings.telegram ?? ""} onChange={(event) => setSettings({ ...settings, telegram: event.target.value })} /></Field>
          <Field label="YouTube" hint="Полная ссылка на канал"><input value={settings.youtube ?? ""} onChange={(event) => setSettings({ ...settings, youtube: event.target.value })} /></Field>
          <Field label="Надпись над заголовком"><input value={settings.heroEyebrow} onChange={(event) => setSettings({ ...settings, heroEyebrow: event.target.value })} /></Field>
          <Field label="Главный заголовок"><input value={settings.heroTitle} onChange={(event) => setSettings({ ...settings, heroTitle: event.target.value })} /></Field>
          <Field label="Выделенная часть"><input value={settings.heroOutline} onChange={(event) => setSettings({ ...settings, heroOutline: event.target.value })} /></Field>
          <Field label="Описание первого экрана" wide><textarea value={settings.heroDescription} onChange={(event) => setSettings({ ...settings, heroDescription: event.target.value })} /></Field>
        </div>
        <div className={styles.subsectionHead}><div><h3>Цифры с контекстом</h3><p>Именно эти карточки и значения выводятся в блоке статистики на главной.</p></div><button type="button" onClick={() => setSettings({ ...settings, contextStats: [...settings.contextStats, { value: "0", label: "Новый показатель", note: "Добавьте пояснение" }] })}><Plus />Добавить показатель</button></div>
        <div className={styles.settingsGrid}>{(settings.contextStats ?? []).map((stat, index) => <div className={styles.contentCard} key={index}><Field label="Источник числа" hint="Можно связать карточку с живыми данными"><select value={stat.source ?? "manual"} onChange={(event) => setSettings({ ...settings, contextStats: settings.contextStats.map((entry, itemIndex) => itemIndex === index ? { ...entry, source: event.target.value as NonNullable<typeof stat.source> } : entry) })}><option value="manual">Ввести вручную</option><option value="currentCohort">Текущий поток</option><option value="totalParticipants">Всего участников</option><option value="incubationWeeks">Недели инкубации</option><option value="startupCount">Опубликованные проекты</option></select></Field><Field label="Число" hint={stat.source && stat.source !== "manual" ? "Обновляется автоматически из связанного раздела" : undefined}><input value={contextStatValue(stat, settings, projects)} disabled={Boolean(stat.source && stat.source !== "manual")} onChange={(event) => setSettings({ ...settings, contextStats: settings.contextStats.map((entry, itemIndex) => itemIndex === index ? { ...entry, value: event.target.value } : entry) })} /></Field><Field label="Подпись"><input value={stat.label} onChange={(event) => setSettings({ ...settings, contextStats: settings.contextStats.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry) })} /></Field><Field label="Контекст"><textarea value={stat.note ?? ""} onChange={(event) => setSettings({ ...settings, contextStats: settings.contextStats.map((entry, itemIndex) => itemIndex === index ? { ...entry, note: event.target.value } : entry) })} /></Field><button className={styles.inlineDanger} type="button" onClick={() => setSettings({ ...settings, contextStats: settings.contextStats.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 />Удалить показатель</button></div>)}</div>
      </form>}

      {tab === "projects" && <Panel eyebrow="ПОРТФОЛИО" title="Проекты на сайте" action={<button className={styles.saveButton} type="button" onClick={() => void createProject()}><Plus />Добавить</button>}><div className={styles.projectList}>{projects.map((item) => <article className={styles.projectRow} key={item.id}>{item.media?.[0]?.url ? <img className={styles.rowPreview} src={item.media[0].url} alt={item.media[0].alt || item.name} /> : <div className={styles.projectGlyph} style={{ background: item.accent }}>{item.glyph}</div>}<div className={styles.projectFields}>
        <Field label="Название"><input value={item.name} onChange={(event) => patchState(setProjects, item.id, { name: event.target.value })} /></Field>
        <Field label="Теги через запятую"><input value={item.tags.join(", ")} onChange={(event) => patchState(setProjects, item.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></Field>
        <Field label="Краткое описание" wide><textarea value={item.text} onChange={(event) => patchState(setProjects, item.id, { text: event.target.value, summary: event.target.value })} /></Field>
        <Field label="Полное описание" wide><textarea value={item.description} onChange={(event) => patchState(setProjects, item.id, { description: event.target.value })} /></Field>
        <Field label="Стадия"><input value={item.stage} onChange={(event) => patchState(setProjects, item.id, { stage: event.target.value })} /></Field>
        <Field label="TRL (1–9)"><input type="number" min="1" max="9" value={item.trlLevel ?? ""} onChange={(event) => patchState(setProjects, item.id, { trlLevel: optionalNumber(event.target.value) })} /></Field>
        <Field label="Поток"><input value={item.cohort} onChange={(event) => patchState(setProjects, item.id, { cohort: event.target.value, cohortLabel: event.target.value })} /></Field>
        <Field label="Сайт проекта"><input value={item.websiteUrl ?? ""} onChange={(event) => patchState(setProjects, item.id, { websiteUrl: event.target.value || null })} /></Field>
        <Field label="Demo"><input value={item.demoUrl ?? ""} onChange={(event) => patchState(setProjects, item.id, { demoUrl: event.target.value || null })} /></Field>
        <Field label="Презентация"><input value={item.presentationUrl ?? ""} onChange={(event) => patchState(setProjects, item.id, { presentationUrl: event.target.value || null })} /></Field>
        <Field label="Соцсеть / контакт проекта"><input value={item.socialUrl ?? ""} onChange={(event) => patchState(setProjects, item.id, { socialUrl: event.target.value || null })} /></Field>
        <Field label="Обложка"><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProjectImage(item, file); }} /></Field>
        <Field label="Порядок"><input type="number" value={item.sortOrder} onChange={(event) => patchState(setProjects, item.id, { sortOrder: Number(event.target.value) })} /></Field>
      </div><div className={styles.rowActions}><Toggle checked={item.published} label={item.published ? "На сайте" : "Скрыт"} onChange={(checked) => patchState(setProjects, item.id, { published: checked })} /><Toggle checked={item.featured} label="Главный" onChange={(checked) => patchState(setProjects, item.id, { featured: checked })} /><button type="button" onClick={() => void updateProject(item)} disabled={loading}><Save />Сохранить</button><button type="button" className={styles.dangerButton} onClick={() => void archiveProject(item)}><Trash2 />В архив</button></div></article>)}</div></Panel>}

      {tab === "programs" && <Panel eyebrow="НАПРАВЛЕНИЯ" title="Программы и наборы"><div className={styles.programGrid}>{programs.map((item) => <article className={styles.programCard} key={item.slug}>
        <span>{String(item.applicationCount).padStart(2, "0")}<small>заявок</small></span>
        <Field label="Название"><input value={item.title} onChange={(event) => patchState(setPrograms, item.slug, { title: event.target.value }, "slug")} /></Field>
        <Field label="Краткое описание" hint="Показывается в каталоге и на первом экране"><textarea value={item.shortDescription} onChange={(event) => patchState(setPrograms, item.slug, { shortDescription: event.target.value }, "slug")} /></Field>
        <Field label="Полное описание"><textarea value={item.description} onChange={(event) => patchState(setPrograms, item.slug, { description: event.target.value }, "slug")} /></Field>
        <Field label="Длительность" hint="Готовая подпись, например «12 недель»"><input value={item.duration} onChange={(event) => patchState(setPrograms, item.slug, { duration: event.target.value }, "slug")} /></Field>
        <Field label="Количество недель"><input type="number" min="1" value={item.durationWeeks ?? ""} onChange={(event) => patchState(setPrograms, item.slug, { durationWeeks: optionalNumber(event.target.value) }, "slug")} /></Field>
        <Field label="Стоимость"><input value={item.price} onChange={(event) => patchState(setPrograms, item.slug, { price: event.target.value }, "slug")} /></Field>
        <Field label="Наборов в год"><input type="number" min="1" value={item.runsPerYear} onChange={(event) => patchState(setPrograms, item.slug, { runsPerYear: Number(event.target.value) }, "slug")} /></Field>
        <Field label="Equity"><input value={item.equity} onChange={(event) => patchState(setPrograms, item.slug, { equity: event.target.value }, "slug")} /></Field>
        <Field label="Формат"><input value={item.format} onChange={(event) => patchState(setPrograms, item.slug, { format: event.target.value }, "slug")} /></Field>
        <Field label="Вместимость"><input type="number" min="1" value={item.capacity ?? ""} onChange={(event) => patchState(setPrograms, item.slug, { capacity: optionalNumber(event.target.value) }, "slug")} /></Field>
        <Field label="Срок подачи"><input type="date" value={dateInput(item.applicationDeadline)} onChange={(event) => patchState(setPrograms, item.slug, { applicationDeadline: event.target.value || null }, "slug")} /></Field>
        <Field label="Дата старта"><input type="date" value={dateInput(item.startDate)} onChange={(event) => patchState(setPrograms, item.slug, { startDate: event.target.value || null }, "slug")} /></Field>
        <Field label="Дата завершения"><input type="date" value={dateInput(item.endDate)} onChange={(event) => patchState(setPrograms, item.slug, { endDate: event.target.value || null }, "slug")} /></Field>
        <Field label="Статус"><StatusSelect value={item.status} onChange={(value) => patchState(setPrograms, item.slug, { status: value }, "slug")} /></Field>
        <Toggle checked={item.isFree} label="Бесплатная" onChange={(checked) => patchState(setPrograms, item.slug, { isFree: checked }, "slug")} />
        <Toggle checked={item.published} label="На сайте" onChange={(checked) => patchState(setPrograms, item.slug, { published: checked }, "slug")} />
        <button type="button" onClick={() => void updateProgram(item)} disabled={loading}><Save />Сохранить программу</button>
      </article>)}</div></Panel>}

      {tab === "courses" && <Panel eyebrow="IT-ОБУЧЕНИЕ" title="Курсы" action={<button className={styles.saveButton} type="button" onClick={() => void createCourse()}><Plus />Добавить курс</button>}><div className={styles.projectList}>{courses.length === 0 && <Empty>Курсов пока нет.</Empty>}{courses.map((item) => <article className={styles.contentCard} key={item.id}><div className={styles.projectFields}><Field label="Название"><input value={item.title} onChange={(event) => patchState(setCourses, item.id, { title: event.target.value })} /></Field><Field label="Адрес (slug)"><input value={item.slug} onChange={(event) => patchState(setCourses, item.id, { slug: event.target.value })} /></Field><Field label="Краткое описание" wide><textarea value={item.shortDescription} onChange={(event) => patchState(setCourses, item.id, { shortDescription: event.target.value })} /></Field><Field label="Полное описание" wide><textarea value={item.description} onChange={(event) => patchState(setCourses, item.id, { description: event.target.value })} /></Field><Field label="Дата / период"><input value={item.dateLabel} onChange={(event) => patchState(setCourses, item.id, { dateLabel: event.target.value })} /></Field><Field label="Формат"><input value={item.format} onChange={(event) => patchState(setCourses, item.id, { format: event.target.value })} /></Field><Field label="Длительность"><input value={item.duration} onChange={(event) => patchState(setCourses, item.id, { duration: event.target.value })} /></Field><Field label="Что входит — по строке" wide><textarea value={item.includes.join("\n")} onChange={(event) => patchState(setCourses, item.id, { includes: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></Field><Field label="Изображение (необязательно)"><input value={item.imageUrl ?? ""} onChange={(event) => patchState(setCourses, item.id, { imageUrl: event.target.value || null })} /></Field><Field label="Порядок"><input type="number" value={item.sortOrder} onChange={(event) => patchState(setCourses, item.id, { sortOrder: Number(event.target.value) })} /></Field></div><div className={styles.rowActions}><Toggle checked={item.published} label="На сайте" onChange={(checked) => patchState(setCourses, item.id, { published: checked })} /><button type="button" onClick={() => void updateCourse(item)}><Save />Сохранить</button><button type="button" className={styles.dangerButton} onClick={() => void deleteCourse(item)}><Trash2 />Удалить</button></div></article>)}</div></Panel>}

      {tab === "cohorts" && <Panel eyebrow="НАБОРЫ" title="Потоки программ" action={<div className={styles.panelTools}><select aria-label="Программа для нового потока" value={newCohortProgramId || programs[0]?.id || ""} onChange={(event) => setNewCohortProgramId(event.target.value)}>{programs.map((program) => <option value={program.id} key={program.id}>{program.title}</option>)}</select><button className={styles.saveButton} type="button" onClick={() => void createCohort()}><Plus />Добавить поток</button></div>}><div className={styles.programGrid}>{cohorts.length === 0 && <Empty>Потоки ещё не созданы.</Empty>}{cohorts.map((item) => <article className={styles.programCard} key={item.id}>
        <span>{item.number}<small>{item.program.title}</small></span>
        <Field label="Программа"><select value={item.programId} onChange={(event) => patchState(setCohorts, item.id, { programId: event.target.value })}>{programs.map((program) => <option value={program.id} key={program.id}>{program.title}</option>)}</select></Field>
        <Field label="Название"><input value={item.title} onChange={(event) => patchState(setCohorts, item.id, { title: event.target.value })} /></Field>
        <Field label="Номер"><input type="number" min="1" value={item.number} onChange={(event) => patchState(setCohorts, item.id, { number: Number(event.target.value) })} /></Field>
        <Field label="Вместимость"><input type="number" min="1" value={item.capacity ?? ""} onChange={(event) => patchState(setCohorts, item.id, { capacity: optionalNumber(event.target.value) })} /></Field>
        <Field label="Старт"><input type="date" value={dateInput(item.startDate)} onChange={(event) => patchState(setCohorts, item.id, { startDate: event.target.value || null })} /></Field>
        <Field label="Завершение"><input type="date" value={dateInput(item.endDate)} onChange={(event) => patchState(setCohorts, item.id, { endDate: event.target.value || null })} /></Field>
        <Field label="Срок подачи"><input type="date" value={dateInput(item.applicationDeadline)} onChange={(event) => patchState(setCohorts, item.id, { applicationDeadline: event.target.value || null })} /></Field>
        <Field label="Статус"><StatusSelect value={item.status} onChange={(value) => patchState(setCohorts, item.id, { status: value })} /></Field>
        <Toggle checked={item.published} label="На сайте" onChange={(checked) => patchState(setCohorts, item.id, { published: checked })} />
        <p>{item._count?.applications ?? 0} заявок · {item._count?.projects ?? 0} проектов</p>
        <button type="button" onClick={() => void updateCohort(item)}><Save />Сохранить поток</button>
      </article>)}</div></Panel>}

      {tab === "partners" && <Panel eyebrow="ЭКОСИСТЕМА" title="Партнёры" action={<button className={styles.saveButton} type="button" onClick={() => void createPartner()}><Plus />Добавить</button>}><div className={styles.projectList}>{partners.map((item) => <article className={styles.projectRow} key={item.id}><img className={styles.logoPreview} src={item.logoUrl} alt={item.alt || item.name} /><div className={styles.projectFields}><Field label="Название"><input value={item.name} onChange={(event) => patchState(setPartners, item.id, { name: event.target.value })} /></Field><Field label="Адрес логотипа"><input value={item.logoUrl} onChange={(event) => patchState(setPartners, item.id, { logoUrl: event.target.value })} /></Field><Field label="Официальный сайт"><input value={item.websiteUrl ?? ""} onChange={(event) => patchState(setPartners, item.id, { websiteUrl: event.target.value || null })} /></Field><Field label="Описание логотипа"><input value={item.alt} onChange={(event) => patchState(setPartners, item.id, { alt: event.target.value })} /></Field><Field label="Порядок"><input type="number" value={item.sortOrder} onChange={(event) => patchState(setPartners, item.id, { sortOrder: Number(event.target.value) })} /></Field></div><div className={styles.rowActions}><Toggle checked={item.published} label={item.published ? "На сайте" : "Скрыт"} onChange={(checked) => patchState(setPartners, item.id, { published: checked })} /><button type="button" onClick={() => void updatePartner(item)}><Save />Сохранить</button><button type="button" className={styles.dangerButton} onClick={() => void deletePartner(item)}><Trash2 />Удалить</button></div></article>)}</div></Panel>}

      {tab === "team" && <Panel eyebrow="ЛЮДИ" title="Команда программы" action={<button className={styles.saveButton} type="button" onClick={() => void createTeamMember()}><Plus />Добавить</button>}><div className={styles.projectList}>{team.map((item) => <article className={styles.projectRow} key={item.id}><img className={styles.rowPreview} src={item.imageUrl} alt={item.name} /><div className={styles.projectFields}><Field label="Имя"><input value={item.name} onChange={(event) => patchState(setTeam, item.id, { name: event.target.value })} /></Field><Field label="Должность"><input value={item.role} onChange={(event) => patchState(setTeam, item.id, { role: event.target.value })} /></Field><Field label="Email"><input type="email" value={item.email} onChange={(event) => patchState(setTeam, item.id, { email: event.target.value })} /></Field><Field label="Телефон"><input value={item.phone ?? ""} onChange={(event) => patchState(setTeam, item.id, { phone: event.target.value || null })} /></Field><Field label="Фотография"><input value={item.imageUrl} onChange={(event) => patchState(setTeam, item.id, { imageUrl: event.target.value })} /></Field><Field label="Профиль"><input value={item.profileUrl ?? ""} onChange={(event) => patchState(setTeam, item.id, { profileUrl: event.target.value || null })} /></Field></div><div className={styles.rowActions}><small>Управляется вручную</small><Toggle checked={item.published} label="На сайте" onChange={(checked) => patchState(setTeam, item.id, { published: checked })} /><button type="button" onClick={() => void updateTeamMember(item)}><Save />Сохранить</button><button type="button" className={styles.dangerButton} onClick={() => void deleteTeamMember(item)}><Trash2 />Удалить</button></div></article>)}</div></Panel>}

      {tab === "news" && <Panel eyebrow="ПУБЛИКАЦИИ И ФОТО" title="Новости, события и галерея" action={<button className={styles.saveButton} type="button" onClick={() => void createNews()}><Plus />Добавить материал</button>}><div className={styles.projectList}>{news.length === 0 && <Empty>Материалов пока нет. Можно добавить вручную или запустить синхронизацию.</Empty>}{news.map((item) => <article className={styles.projectRow} key={item.id}><img className={styles.rowPreview} src={item.imageUrl} alt={item.title} /><div className={styles.projectFields}><Field label="Заголовок"><input value={item.title} onChange={(event) => patchState(setNews, item.id, { title: event.target.value })} /></Field><Field label="Дата"><input type="date" value={dateInput(item.eventDate)} onChange={(event) => patchState(setNews, item.id, { eventDate: event.target.value })} /></Field><Field label="История / описание" hint="Этот текст откроется вместе с фотографией" wide><textarea value={item.summary} onChange={(event) => patchState(setNews, item.id, { summary: event.target.value })} /></Field><Field label="Изображение"><input value={item.imageUrl} onChange={(event) => patchState(setNews, item.id, { imageUrl: event.target.value })} /></Field><Field label="Источник или ссылка"><input value={item.sourceUrl} onChange={(event) => patchState(setNews, item.id, { sourceUrl: event.target.value })} /></Field><Field label="Место"><input value={item.location} onChange={(event) => patchState(setNews, item.id, { location: event.target.value })} /></Field></div><div className={styles.rowActions}><small>{item.source === "ayu" ? "Автоматически с AYU" : "Добавлено вручную"}</small><Toggle checked={item.published} label="На главной и в галерее" onChange={(checked) => patchState(setNews, item.id, { published: checked })} /><button type="button" onClick={() => void updateNews(item)}><Save />Сохранить</button><button type="button" className={styles.dangerButton} onClick={() => void deleteNews(item)}><Trash2 />Удалить</button></div></article>)}</div></Panel>}

      {tab === "pages" && <Panel eyebrow="CMS" title="Страницы и SEO" action={<button className={styles.saveButton} type="button" onClick={() => void createPage()}><Plus />Добавить</button>}><div className={styles.projectList}>{pages.length === 0 && <Empty>Дополнительные CMS-страницы ещё не созданы.</Empty>}{pages.map((item) => item.key === "about" ? <AboutPageEditor key={item.id} item={item} onPatch={(patch) => patchState(setPages, item.id, patch)} onChange={(content) => patchState(setPages, item.id, { content, contentText: JSON.stringify(content, null, 2) })} onSave={() => void updatePage(item)} /> : <article className={styles.contentCard} key={item.id}><div className={styles.projectFields}><Field label="Ключ" hint="Должен совпадать с ключом, который использует сайт"><input value={item.key} onChange={(event) => patchState(setPages, item.id, { key: event.target.value })} /></Field><Field label="Название страницы"><input value={item.page} onChange={(event) => patchState(setPages, item.id, { page: event.target.value })} /></Field><Field label="SEO title"><input value={item.seoTitle ?? ""} onChange={(event) => patchState(setPages, item.id, { seoTitle: event.target.value })} /></Field><Field label="SEO description"><input value={item.seoDescription ?? ""} onChange={(event) => patchState(setPages, item.id, { seoDescription: event.target.value })} /></Field><Field label="Контент JSON — расширенный режим" hint="Не удаляйте фигурные скобки и кавычки" wide><textarea className={styles.codeArea} value={item.contentText} onChange={(event) => patchState(setPages, item.id, { contentText: event.target.value })} /></Field><Field label="Статус"><select value={item.status} onChange={(event) => patchState(setPages, item.id, { status: event.target.value as PageContent["status"] })}><option value="draft">Черновик</option><option value="published">Опубликовано</option><option value="archived">Архив</option></select></Field></div><button type="button" onClick={() => void updatePage(item)}><Save />Сохранить страницу</button></article>)}</div></Panel>}

      {tab === "localization" && <Panel eyebrow="RU · KK · EN · TR" title="Переводы контента"><div className={styles.contentCard}><p>Русский текст редактируется в основных разделах. Здесь хранятся смысловые версии для казахского, английского и турецкого языков. Формат: объект с ключами <code>kk</code>, <code>en</code>, <code>tr</code>.</p></div><div className={styles.projectList}><TranslationEditor title="Главная и контакты" initial={settings?.translations} onSave={(translations) => void runSave(async () => { await api("/admin/settings", { method: "PATCH", body: JSON.stringify({ translations }) }); })} />{programs.map((item) => <TranslationEditor key={`program-${item.id}`} title={`Программа · ${item.title}`} initial={item.translations} onSave={(translations) => void runSave(async () => { await api(`/admin/programs/${item.slug}`, { method: "PATCH", body: JSON.stringify({ translations }) }); })} />)}{courses.map((item) => <TranslationEditor key={`course-${item.id}`} title={`IT-курс · ${item.title}`} initial={item.translations} onSave={(translations) => void runSave(async () => { await api(`/admin/it-courses/${item.id}`, { method: "PATCH", body: JSON.stringify({ translations }) }); })} />)}{projects.map((item) => <TranslationEditor key={`project-${item.id}`} title={`Проект · ${item.name}`} initial={item.translations} onSave={(translations) => void runSave(async () => { await api(`/admin/projects/${item.id}`, { method: "PATCH", body: JSON.stringify({ translations }) }); })} />)}{team.map((item) => <TranslationEditor key={`team-${item.id}`} title={`Команда · ${item.name}`} initial={item.translations} onSave={(translations) => void runSave(async () => { await api(`/admin/team/${item.id}`, { method: "PATCH", body: JSON.stringify({ translations }) }); })} />)}{news.map((item) => <TranslationEditor key={`news-${item.id}`} title={`Новость · ${item.title}`} initial={item.translations} onSave={(translations) => void runSave(async () => { await api(`/admin/news/${item.id}`, { method: "PATCH", body: JSON.stringify({ translations }) }); })} />)}{pages.map((item) => <TranslationEditor key={`page-${item.id}`} title={`Страница · ${item.page}`} initial={item.translations} onSave={(translations) => void runSave(async () => { await api(`/admin/pages/${item.id}`, { method: "PATCH", body: JSON.stringify({ translations }) }); })} />)}</div></Panel>}

      {tab === "users" && <Panel eyebrow="БЕЗОПАСНОСТЬ" title="Администраторы"><form className={styles.createUser} onSubmit={createUser}><input required minLength={2} value={newAdmin.name} onChange={(event) => setNewAdmin({ ...newAdmin, name: event.target.value })} placeholder="Имя" /><input required type="email" value={newAdmin.email} onChange={(event) => setNewAdmin({ ...newAdmin, email: event.target.value })} placeholder="Email" /><input required minLength={14} type="password" value={newAdmin.password} onChange={(event) => setNewAdmin({ ...newAdmin, password: event.target.value })} placeholder="Сильный пароль от 14 символов" title="Нужны заглавная и строчная буквы, цифра и специальный символ" /><select value={newAdmin.role} onChange={(event) => setNewAdmin({ ...newAdmin, role: event.target.value as AdminUser["role"] })}><option value="editor">Редактор</option><option value="admin">Администратор</option></select><button disabled={loading}><Plus />Создать доступ</button></form><div className={styles.projectList}>{users.map((item) => <article className={styles.userRow} key={item.id}><ShieldCheck /><Field label="Имя"><input value={item.name} onChange={(event) => patchState(setUsers, item.id, { name: event.target.value })} /></Field><div><strong>{item.email}</strong><small>Последний вход: {item.lastLoginAt ? formatDate(item.lastLoginAt) : "ещё не входил"}</small></div><Field label="Новый пароль" hint="Оставьте пустым, если менять не нужно"><input minLength={14} type="password" value={item.password ?? ""} onChange={(event) => patchState(setUsers, item.id, { password: event.target.value })} placeholder="••••••••••••••" autoComplete="new-password" /></Field><select value={item.role} onChange={(event) => patchState(setUsers, item.id, { role: event.target.value as AdminUser["role"] })}><option value="editor">Редактор</option><option value="admin">Администратор</option></select><Toggle checked={item.active ?? true} label="Активен" onChange={(checked) => patchState(setUsers, item.id, { active: checked })} /><button type="button" onClick={() => void updateUser(item)}><Save />Сохранить</button></article>)}</div></Panel>}

      {tab === "audit" && <Panel eyebrow="КОНТРОЛЬ" title="История изменений"><div className={styles.auditList}>{audit.length === 0 && <Empty>История пока пуста.</Empty>}{audit.map((item) => <article key={item.id}><span><Activity /></span><div><strong>{item.action} · {item.entity}</strong><small>{item.admin?.name ?? "Система"} · {formatDate(item.createdAt)}</small></div><code>{item.entityId ?? "—"}</code></article>)}</div></Panel>}

      {tab === "integrations" && <Panel eyebrow="ИНФРАСТРУКТУРА" title="Почта и медиахранилище"><div className={styles.programGrid}><IntegrationCard title="Почтовые уведомления" status={integrations?.smtp} description="Отправляет подтверждение заявителю и уведомление команде." onCheck={() => void checkIntegration("smtp")} loading={loading} canCheck={admin.role === "admin"} /><IntegrationCard title="Хранилище изображений" status={integrations?.storage} description="Сохраняет фотографии проектов и материалы админки." onCheck={() => void checkIntegration("storage")} loading={loading} canCheck={admin.role === "admin"} /></div></Panel>}
      {tab === "sync" && <Panel eyebrow="AYU" title="Автоматическая синхронизация новостей"><div className={styles.programGrid}>{(() => { const state = syncStates.find((item) => item.source === "ayu-news"); return <article className={styles.programCard}><span>{state?.itemsCount ?? 0}<small>записей</small></span><h3>Новости AYU</h3><p>Команда больше не парсится — она полностью управляется в разделе «Команда».</p><p>Статус: {state?.status ?? "ещё не запускалась"}</p><p>Последнее обновление: {state?.lastSuccessAt ? formatDate(state.lastSuccessAt) : "—"}</p>{state?.lastError && <p className={styles.errorText}>{state.lastError}</p>}<button type="button" onClick={() => void runSync()} disabled={loading}><RefreshCw />Обновить сейчас</button></article>; })()}</div></Panel>}
    </section>
  </main>;
}

function LoginPage(props: { authReady: boolean; loading: boolean; message: string; email: string; password: string; onEmail: (value: string) => void; onPassword: (value: string) => void; onSubmit: (event: FormEvent) => void }) {
  return <main className={styles.loginPage}><div className={styles.loginGlow} /><form className={styles.loginCard} onSubmit={props.onSubmit}><div className={styles.brand}><span>Y</span><strong>YASAWI<br />CONTROL</strong></div><small>ЗАКРЫТАЯ ПАНЕЛЬ</small><h1>Управление<br />программой.</h1><p>Войдите под учётной записью администратора. Доступ защищён серверной сессией.</p><label>Email<input type="email" value={props.email} onChange={(event) => props.onEmail(event.target.value)} autoComplete="username" autoFocus /></label><label>Пароль<input type="password" value={props.password} onChange={(event) => props.onPassword(event.target.value)} placeholder="••••••••••••" autoComplete="current-password" /></label>{props.message && <div className={styles.error}>{props.message}</div>}<button disabled={props.loading || !props.authReady}>{props.loading || !props.authReady ? "Проверяем…" : "Войти"}<ArrowRight /></button></form></main>;
}
function Panel(props: { eyebrow: string; title: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className={styles.panel}><PanelHeader eyebrow={props.eyebrow} title={props.title} action={props.action} />{props.children}</section>; }
function PanelHeader(props: { eyebrow: string; title: string; action?: React.ReactNode }) { return <div className={styles.panelHead}><div><small>{props.eyebrow}</small><h2>{props.title}</h2></div>{props.action}</div>; }
function IntegrationCard(props: { title: string; description: string; status?: IntegrationStatus; onCheck: () => void; loading: boolean; canCheck: boolean }) {
  const ready = props.status?.reachable ?? props.status?.configured ?? false;
  const detail = props.status?.service === "smtp"
    ? props.status.host ? `${props.status.host}:${props.status.port}` : "Укажите SMTP_HOST и учётные данные"
    : props.status?.mode === "s3" ? `S3 · ${props.status.bucket ?? "bucket не указан"}` : "Локальная папка uploads";
  return <article className={styles.programCard}><span>{ready ? <Check /> : <Info />}<small>{ready ? "ГОТОВО" : "ТРЕБУЕТ НАСТРОЙКИ"}</small></span><h3>{props.title}</h3><p>{props.description}</p><p>{detail}</p>{props.canCheck ? <button type="button" onClick={props.onCheck} disabled={props.loading || !props.status?.configured}><ShieldCheck />Проверить соединение</button> : <p>Проверка доступна администратору.</p>}</article>;
}
function Field(props: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) { return <label className={props.wide ? styles.wideField : undefined}>{props.label}{props.hint && <small>{props.hint}</small>}{props.children}</label>; }
function Empty(props: { children: React.ReactNode }) { return <div className={styles.empty}>{props.children}</div>; }
function AboutPageEditor(props: { item: PageContent; onPatch: (patch: Partial<PageContent>) => void; onChange: (content: AboutContent) => void; onSave: () => void }) {
  const content = normalizeAboutContent(props.item.content);
  const change = <K extends keyof AboutContent>(key: K, value: AboutContent[K]) => props.onChange({ ...content, [key]: value });
  return <article className={styles.contentCard}>
    <div className={styles.editorHeading}><div><small>СТРАНИЦА /ABOUT</small><h3>О нас</h3><p>Обычный редактор: JSON открывать не нужно.</p></div><a href="/about" target="_blank" rel="noreferrer">Открыть страницу <ExternalLink /></a></div>
    <div className={styles.projectFields}>
      <Field label="Название в CMS"><input value={props.item.page} onChange={(event) => props.onPatch({ page: event.target.value })} /></Field>
      <Field label="Статус"><select value={props.item.status} onChange={(event) => props.onPatch({ status: event.target.value as PageContent["status"] })}><option value="draft">Черновик</option><option value="published">Опубликовано</option><option value="archived">Архив</option></select></Field>
      <Field label="SEO title"><input value={props.item.seoTitle ?? ""} onChange={(event) => props.onPatch({ seoTitle: event.target.value })} /></Field>
      <Field label="SEO description"><input value={props.item.seoDescription ?? ""} onChange={(event) => props.onPatch({ seoDescription: event.target.value })} /></Field>
      <Field label="Надпись первого экрана"><input value={content.hero.eyebrow} onChange={(event) => change("hero", { ...content.hero, eyebrow: event.target.value })} /></Field>
      <Field label="Главный заголовок"><input value={content.hero.title} onChange={(event) => change("hero", { ...content.hero, title: event.target.value })} /></Field>
      <Field label="Выделенная часть заголовка"><input value={content.hero.outline} onChange={(event) => change("hero", { ...content.hero, outline: event.target.value })} /></Field>
      <Field label="Описание первого экрана" wide><textarea value={content.hero.description} onChange={(event) => change("hero", { ...content.hero, description: event.target.value })} /></Field>
      <Field label="Надпись над историей"><input value={content.story.eyebrow} onChange={(event) => change("story", { ...content.story, eyebrow: event.target.value })} /></Field>
      <Field label="Заголовок истории"><input value={content.story.title} onChange={(event) => change("story", { ...content.story, title: event.target.value })} /></Field>
      <Field label="Выделенная часть истории"><input value={content.story.outline} onChange={(event) => change("story", { ...content.story, outline: event.target.value })} /></Field>
      <Field label="Абзацы истории" hint="Каждый новый абзац — с новой строки" wide><textarea value={content.story.paragraphs.join("\n")} onChange={(event) => change("story", { ...content.story, paragraphs: event.target.value.split("\n").filter(Boolean) })} /></Field>
    </div>
    <h3>Ценности</h3>
    <div className={styles.settingsGrid}>{content.values.map((value, index) => <div className={styles.contentCard} key={`value-${index}`}><Field label={`Заголовок ${index + 1}`}><input value={value.title} onChange={(event) => change("values", content.values.map((entry, itemIndex) => itemIndex === index ? { ...entry, title: event.target.value } : entry))} /></Field><Field label="Описание"><textarea value={value.text} onChange={(event) => change("values", content.values.map((entry, itemIndex) => itemIndex === index ? { ...entry, text: event.target.value } : entry))} /></Field></div>)}</div>
    <h3>Цифры на странице «О нас»</h3>
    <div className={styles.settingsGrid}>{content.stats.map((stat, index) => <div className={styles.contentCard} key={`stat-${index}`}><Field label="Значение"><input value={stat.value} onChange={(event) => change("stats", content.stats.map((entry, itemIndex) => itemIndex === index ? { ...entry, value: event.target.value } : entry))} /></Field><Field label="Подпись"><input value={stat.label} onChange={(event) => change("stats", content.stats.map((entry, itemIndex) => itemIndex === index ? { ...entry, label: event.target.value } : entry))} /></Field></div>)}</div>
    <div className={styles.projectFields}><Field label="Надпись блока контактов"><input value={content.contact.eyebrow} onChange={(event) => change("contact", { ...content.contact, eyebrow: event.target.value })} /></Field><Field label="Заголовок блока контактов"><input value={content.contact.title} onChange={(event) => change("contact", { ...content.contact, title: event.target.value })} /></Field><Field label="Текст кнопки"><input value={content.contact.buttonLabel} onChange={(event) => change("contact", { ...content.contact, buttonLabel: event.target.value })} /></Field></div>
    <button type="button" onClick={props.onSave}><Save />Сохранить страницу «О нас»</button>
  </article>;
}
function TranslationEditor(props: { title: string; initial?: Record<string, unknown>; onSave: (translations: Record<string, unknown>) => void }) { const [value, setValue] = useState(() => JSON.stringify(props.initial ?? { kk: {}, en: {}, tr: {} }, null, 2)); const [error, setError] = useState(""); return <article className={styles.contentCard}><h3>{props.title}</h3><Field label="Переводы JSON" wide><textarea className={styles.codeArea} value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} /></Field>{error && <p className={styles.errorText}>{error}</p>}<button type="button" onClick={() => { try { const parsed = JSON.parse(value) as Record<string, unknown>; setError(""); props.onSave(parsed); } catch { setError("Проверьте синтаксис JSON"); } }}><Save />Сохранить переводы</button></article>; }
function StatusSelect(props: { value: typeof enrollmentStatuses[number]; onChange: (value: typeof enrollmentStatuses[number]) => void }) { return <select value={props.value} onChange={(event) => props.onChange(event.target.value as typeof enrollmentStatuses[number])}>{enrollmentStatuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select>; }
function Toggle(props: { checked: boolean; label: string; onChange: (checked: boolean) => void }) { return <label className={styles.switch}><input type="checkbox" checked={props.checked} onChange={(event) => props.onChange(event.target.checked)} /><span /><b>{props.label}</b></label>; }

function assignResult<T>(result: PromiseSettledResult<T>, setter: (value: T) => void) { if (result.status === "fulfilled") setter(result.value); }
function patchState<T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string, patch: Partial<T>, key: keyof T = "id") { setter((items) => items.map((item) => item[key] === id ? { ...item, ...patch } : item)); }
function patchList<T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string, value: T, key: keyof T = "id") { setter((items) => items.map((item) => item[key] === id ? value : item)); }
function settingsPayload(item: SettingsData) { return { totalParticipants: item.totalParticipants, incubationWeeks: item.incubationWeeks, nextCohortStatus: item.nextCohortStatus, nextCohortDate: item.nextCohortDate, responseDays: item.responseDays, contactEmail: item.contactEmail, contactPhone: item.contactPhone, address: item.address, whatsapp: item.whatsapp ?? "", instagram: item.instagram ?? "", telegram: item.telegram ?? "", youtube: item.youtube ?? "", contextStats: item.contextStats ?? [], heroEyebrow: item.heroEyebrow, heroTitle: item.heroTitle, heroOutline: item.heroOutline, heroDescription: item.heroDescription }; }
function projectPayload(item: Project) { return { name: item.name, summary: item.text, description: item.description, tags: item.tags, stage: item.stage, trlLevel: item.trlLevel, cohortLabel: item.cohort, websiteUrl: emptyToNull(item.websiteUrl), demoUrl: emptyToNull(item.demoUrl), presentationUrl: emptyToNull(item.presentationUrl), socialUrl: emptyToNull(item.socialUrl), featured: item.featured, sortOrder: item.sortOrder, published: item.published }; }
function programPayload(item: Program) { return { title: item.title, shortDescription: item.shortDescription, description: item.description, duration: item.duration, durationWeeks: item.durationWeeks, price: item.price, runsPerYear: item.runsPerYear, equity: item.equity, isFree: item.isFree, status: item.status, format: item.format, capacity: item.capacity, applicationDeadline: emptyToNull(item.applicationDeadline), startDate: emptyToNull(item.startDate), endDate: emptyToNull(item.endDate), sortOrder: item.sortOrder, published: item.published }; }
function cohortPayload(item: Cohort) { return { programId: item.programId, number: item.number, title: item.title, status: item.status, capacity: item.capacity, applicationDeadline: emptyToNull(item.applicationDeadline), startDate: emptyToNull(item.startDate), endDate: emptyToNull(item.endDate), published: item.published }; }
function partnerPayload(item: Partner) { return { name: item.name, logoUrl: item.logoUrl, websiteUrl: emptyToNull(item.websiteUrl), alt: item.alt, sortOrder: item.sortOrder, published: item.published }; }
function teamPayload(item: TeamMember) { return { name: item.name, role: item.role, email: item.email, phone: emptyToNull(item.phone), imageUrl: item.imageUrl, profileUrl: emptyToNull(item.profileUrl), sortOrder: item.sortOrder, published: item.published }; }
function newsPayload(item: NewsItem) { return { title: item.title, summary: item.summary, eventDate: item.eventDate, imageUrl: item.imageUrl, sourceUrl: item.sourceUrl, location: item.location, sortOrder: item.sortOrder, published: item.published }; }
function coursePayload(item: ItCourse) { return { slug: item.slug, title: item.title, shortDescription: item.shortDescription, description: item.description, dateLabel: item.dateLabel, format: item.format, duration: item.duration, includes: item.includes, imageUrl: emptyToNull(item.imageUrl), sortOrder: item.sortOrder, published: item.published }; }
function inferStatSource(label: string): NonNullable<SettingsData["contextStats"][number]["source"]> {
  const normalized = label.toLowerCase();
  if (/участ|қатыс|participant|katılımc/.test(normalized)) return "totalParticipants";
  if (/поток|лек|cohort|dönem/.test(normalized)) return "currentCohort";
  if (/недел|апта|week|hafta/.test(normalized)) return "incubationWeeks";
  if (/стартап|startup|girişim/.test(normalized)) return "startupCount";
  return "manual";
}
function contextStatValue(stat: SettingsData["contextStats"][number], settings: SettingsData, projects: Project[]) {
  if (stat.source === "currentCohort") return String(settings.currentCohort);
  if (stat.source === "totalParticipants") return `${settings.totalParticipants}+`;
  if (stat.source === "incubationWeeks") return String(settings.incubationWeeks);
  if (stat.source === "startupCount") return String(projects.filter((project) => project.published).length);
  return stat.value;
}
function normalizeAboutContent(input: Record<string, unknown>): AboutContent {
  const source = input as Partial<AboutContent>;
  return {
    hero: { eyebrow: "", title: "", outline: "", description: "", ...(source.hero ?? {}) },
    story: { eyebrow: "", title: "", outline: "", paragraphs: [], ...(source.story ?? {}) },
    values: Array.isArray(source.values) ? source.values : [],
    stats: Array.isArray(source.stats) ? source.stats : [],
    contact: { eyebrow: "", title: "", buttonLabel: "", ...(source.contact ?? {}) },
  };
}
function normalizePage(item: Omit<PageContent, "contentText">): PageContent { return { ...item, contentText: JSON.stringify(item.content, null, 2) }; }
function emptyToUndefined(value: string | null | undefined) { return value?.trim() || undefined; }
function emptyToNull(value: string | null | undefined) { return value?.trim() || null; }
function optionalNumber(value: string) { return value === "" ? null : Number(value); }
function dateInput(value: string | null | undefined) { return value ? value.slice(0, 10) : ""; }
function formatDate(value: string) { return new Date(value).toLocaleString("ru-RU"); }
function errorMessage(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback; }
