import type { AdminRole } from "../generated/prisma/enums";

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export type AuthenticatedRequest = {
  admin?: AuthenticatedAdmin;
  cookies?: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};
