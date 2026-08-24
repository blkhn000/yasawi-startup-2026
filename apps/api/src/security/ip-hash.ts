import { createHmac } from "node:crypto";

export function hashIp(ip: string) {
  const salt = process.env.IP_HASH_SALT ?? "yasawi-development-only-ip-salt";
  return createHmac("sha256", salt).update(ip).digest("hex");
}
