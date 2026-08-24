import assert from "node:assert/strict";
import { localizeRecord } from "../src/content/localization";

const localized = localizeRecord({
  contextStats: [{ value: "7", label: "потоков", source: "currentCohort" }],
  translations: { en: { contextStats: [{ value: "7", label: "cohorts" }] } },
}, "en");

assert.deepEqual(localized.contextStats, [{ value: "7", label: "cohorts", source: "currentCohort" }]);
console.log("Localization metadata checks passed");
