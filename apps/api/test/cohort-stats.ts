import assert from "node:assert/strict";
import { CohortStatsService } from "../src/content/cohort-stats.service";

async function run() {
  const calls: Array<Record<string, unknown>> = [];
  const prisma = {
    cohort: {
      aggregate: async (query: Record<string, unknown>) => {
        calls.push({ method: "aggregate", query });
        return { _max: { number: 7 } };
      },
    },
    siteSettings: {
      findUnique: async () => ({ id: "main", currentCohort: 120, totalParticipants: 400 }),
      updateMany: async (query: Record<string, unknown>) => {
        calls.push({ method: "updateMany", query });
        return { count: 1 };
      },
    },
  };

  const service = new CohortStatsService(prisma as never);
  const settings = await service.settingsWithDerivedCohort();
  assert.equal(settings?.currentCohort, 7, "published incubation cohort must override a stale setting");

  const synchronized = await service.synchronizeSettings();
  assert.equal(synchronized, 7);
  assert.deepEqual(calls.at(-1), {
    method: "updateMany",
    query: { where: { id: "main", currentCohort: { not: 7 } }, data: { currentCohort: 7 } },
  });

  const emptyPrisma = {
    cohort: { aggregate: async () => ({ _max: { number: null } }) },
    siteSettings: {
      findUnique: async () => ({ id: "main", currentCohort: 6 }),
      updateMany: async () => { throw new Error("must not update without a published cohort"); },
    },
  };
  const emptyService = new CohortStatsService(emptyPrisma as never);
  assert.equal((await emptyService.settingsWithDerivedCohort())?.currentCohort, 6);
  assert.equal(await emptyService.synchronizeSettings(), null);

  console.log("Cohort statistics checks passed");
}

void run();
