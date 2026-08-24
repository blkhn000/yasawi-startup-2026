import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedAdmin, AuthenticatedRequest } from "./auth.types";

export const CurrentAdmin = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedAdmin => {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.admin) throw new Error("Authenticated administrator is missing from request");
  return request.admin;
});
