import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: { adminId?: string; action: string; entity: string; entityId?: string; payload?: Prisma.InputJsonValue; ipAddress?: string }) {
    return this.prisma.auditLog.create({ data: input });
  }
}
