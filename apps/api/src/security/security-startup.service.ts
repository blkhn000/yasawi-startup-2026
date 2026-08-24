import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { compare } from "bcryptjs";
import { PrismaService } from "../database/prisma.service";

const knownDefaultPasswords = ["ChangeMe-2026!", "password", "admin123"];

@Injectable()
export class SecurityStartupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SecurityStartupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV !== "production") return;
    const admins = await this.prisma.adminUser.findMany({ where: { active: true }, select: { email: true, passwordHash: true } });
    if (!admins.length) throw new Error("Production requires at least one active administrator");

    for (const admin of admins) {
      if (await usesKnownDefaultPassword(admin.passwordHash)) {
        this.logger.error(`Unsafe administrator password detected for ${admin.email}`);
        throw new Error("Production cannot start while an administrator uses a known default password");
      }
    }
  }
}

export async function usesKnownDefaultPassword(passwordHash: string) {
  for (const password of knownDefaultPasswords) if (await compare(password, passwordHash)) return true;
  return false;
}
