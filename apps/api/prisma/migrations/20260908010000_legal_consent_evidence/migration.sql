ALTER TABLE "Application"
ADD COLUMN "consentVersion" TEXT NOT NULL DEFAULT 'legacy-2026-08-19',
ADD COLUMN "authorityConfirmed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Application"
ALTER COLUMN "consentVersion" DROP DEFAULT;
