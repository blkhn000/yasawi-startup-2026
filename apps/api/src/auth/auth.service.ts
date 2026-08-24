import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { hashIp } from "../security/ip-hash";
import { accessSecret } from "./admin-auth.guard";
import type { AuthenticatedAdmin } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string, meta: { ip?: string; userAgent?: string }) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!admin?.active || !await compare(password, admin.passwordHash)) throw new UnauthorizedException("Неверный email или пароль");

    const refreshToken = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + refreshLifetimeMs());
    await this.prisma.$transaction([
      this.prisma.authSession.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }] } }),
      this.prisma.authSession.create({ data: { tokenHash: tokenHash(refreshToken), adminId: admin.id, expiresAt, ipAddress: meta.ip ? hashIp(meta.ip) : undefined, userAgent: meta.userAgent?.slice(0, 500) } }),
      this.prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } }),
    ]);
    return { admin: publicAdmin(admin), accessToken: await this.signAccess(admin), refreshToken, refreshExpiresAt: expiresAt };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw new UnauthorizedException("Refresh-сессия отсутствует");
    const session = await this.prisma.authSession.findUnique({ where: { tokenHash: tokenHash(refreshToken) }, include: { admin: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.admin.active) throw new UnauthorizedException("Refresh-сессия недействительна");
    await this.prisma.authSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
    return { admin: publicAdmin(session.admin), accessToken: await this.signAccess(session.admin) };
  }

  async logout(refreshToken: string | undefined) {
    if (refreshToken) await this.prisma.authSession.updateMany({ where: { tokenHash: tokenHash(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
  }

  async createAdmin(input: { email: string; name: string; password: string; role?: "admin" | "editor" }) {
    return this.prisma.adminUser.create({
      data: { email: input.email.trim().toLowerCase(), name: input.name.trim(), passwordHash: await hash(input.password, 12), role: input.role ?? "editor" },
      select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
    });
  }

  async updateAdmin(id: string, input: { name?: string; role?: "admin" | "editor"; active?: boolean; password?: string }) {
    const { password, ...data } = input;
    return this.prisma.adminUser.update({
      where: { id },
      data: { ...data, ...(password ? { passwordHash: await hash(password, 12), sessions: { updateMany: { where: { revokedAt: null }, data: { revokedAt: new Date() } } } } : {}) },
      select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true },
    });
  }

  private signAccess(admin: { id: string; email: string; role: "admin" | "editor" }) {
    return this.jwt.signAsync({ sub: admin.id, email: admin.email, role: admin.role, type: "access" }, { secret: accessSecret(), expiresIn: "15m" });
  }
}

function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function refreshLifetimeMs() { return 30 * 24 * 60 * 60 * 1000; }
function publicAdmin(admin: { id: string; email: string; name: string; role: "admin" | "editor" }): AuthenticatedAdmin { return { id: admin.id, email: admin.email, name: admin.name, role: admin.role }; }
