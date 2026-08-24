import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { AdminRole } from "../generated/prisma/enums";
import type { AuthenticatedRequest } from "./auth.types";

const ROLES_KEY = "admin-roles";
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const admin = context.switchToHttp().getRequest<AuthenticatedRequest>().admin;
    if (!admin || !roles.includes(admin.role)) throw new ForbiddenException("Недостаточно прав");
    return true;
  }
}
