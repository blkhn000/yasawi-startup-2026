import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class CohortStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async currentIncubationCohort() {
    const result = await this.prisma.cohort.aggregate({
      where: { published: true, program: { slug: "incubation" } },
      _max: { number: true },
    });
    return result._max.number;
  }

  async settingsWithDerivedCohort() {
    const [settings, currentCohort] = await Promise.all([
      this.prisma.siteSettings.findUnique({ where: { id: "main" } }),
      this.currentIncubationCohort(),
    ]);
    return settings ? { ...settings, currentCohort: currentCohort ?? settings.currentCohort } : null;
  }

  async synchronizeSettings() {
    const currentCohort = await this.currentIncubationCohort();
    if (currentCohort === null) return null;
    await this.prisma.siteSettings.updateMany({ where: { id: "main", currentCohort: { not: currentCohort } }, data: { currentCohort } });
    return currentCohort;
  }
}
