import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { PrismaService } from "../database/prisma.service";

type ApplicationMessage = { id: string; name: string; email: string; phone: string; idea: string; program: { title: string } };

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly prisma: PrismaService) {
    const port = Number(process.env.SMTP_PORT) || 587;
    this.transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    }) : null;
  }

  status() {
    return {
      service: "smtp" as const,
      configured: Boolean(this.transporter),
      host: process.env.SMTP_HOST || null,
      port: Number(process.env.SMTP_PORT) || 587,
      from: process.env.SMTP_FROM || null,
    };
  }

  async verify() {
    if (!this.transporter) throw new ServiceUnavailableException("SMTP не настроен");
    try {
      await this.transporter.verify();
      return { ...this.status(), reachable: true };
    } catch (error) {
      this.logger.error(`SMTP connection check failed: ${errorMessage(error)}`);
      throw new ServiceUnavailableException("Не удалось подключиться к SMTP. Проверьте адрес, порт и учётные данные.");
    }
  }

  async applicationReceived(application: ApplicationMessage) {
    if (!this.transporter) { this.logger.log(`Application ${application.id} stored; SMTP is not configured`); return; }
    try {
      const settings = await this.prisma.siteSettings.findUnique({ where: { id: "main" } });
      const from = process.env.SMTP_FROM ?? "Yasawi Startup <no-reply@yasawi.local>";
      await Promise.all([
        this.transporter.sendMail({ from, to: application.email, subject: "Заявка в Yasawi Startup получена", html: `<p>Здравствуйте, ${escapeHtml(application.name)}!</p><p>Мы получили вашу заявку на программу «${escapeHtml(application.program.title)}».</p><p>Номер заявки: <strong>${application.id}</strong>.</p>` }),
        settings?.contactEmail ? this.transporter.sendMail({ from, to: settings.contactEmail, replyTo: application.email, subject: `Новая заявка: ${application.program.title}`, html: `<p><strong>${escapeHtml(application.name)}</strong></p><p>${escapeHtml(application.email)} · ${escapeHtml(application.phone)}</p><p>${escapeHtml(application.idea)}</p>` }) : Promise.resolve(),
      ]);
    } catch (error) {
      this.logger.error(`Email notification for application ${application.id} failed: ${errorMessage(error)}`);
    }
  }
}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character); }
function errorMessage(error: unknown) { return error instanceof Error ? error.message : "Unknown error"; }
