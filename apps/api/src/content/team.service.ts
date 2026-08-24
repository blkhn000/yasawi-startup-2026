import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { localizeRecord } from "./localization";

export interface PublicTeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  image: string;
  profileUrl: string | null;
  source: "YASAWI";
}

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async list(limit = 20, locale = "ru"): Promise<PublicTeamMember[]> {
    const members = await this.prisma.teamMember.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: Math.min(50, Math.max(1, limit)),
    });
    return members.map((record) => {
      const member = localizeRecord(record, locale);
      return {
      id: member.id, name: member.name, role: member.role, email: member.email, phone: member.phone, image: member.imageUrl, profileUrl: member.profileUrl,
      source: "YASAWI" as const,
    }; });
  }
}
