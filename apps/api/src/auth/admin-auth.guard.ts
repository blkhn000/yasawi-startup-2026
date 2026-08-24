import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedRequest } from "./auth.types";

type AccessPayload = { sub: string; email: string; role: "admin" | "editor"; type: "access" };

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const bearer = typeof authorization === "string" && authorization.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const token = request.cookies?.yasawi_access ?? bearer;
    if (!token) throw new UnauthorizedException("Требуется вход в административную панель");

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, { secret: accessSecret() });
      if (payload.type !== "access") throw new Error("Unexpected token type");
      const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, name: true, role: true, active: true } });
      if (!admin?.active) throw new Error("Administrator is inactive");
      request.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
      return true;
    } catch {
      throw new UnauthorizedException("Сессия истекла или недействительна");
    }
  }
}

export function accessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_ACCESS_SECRET must contain at least 32 characters");
  return secret;
}
