ALTER TABLE "SiteSettings"
ADD COLUMN "youtube" TEXT,
ADD COLUMN "contextStats" JSONB NOT NULL DEFAULT '[{"value":"7","label":"потоков","note":"проведено с момента запуска"},{"value":"400+","label":"участников","note":"подали заявки на программы"},{"value":"60","label":"часов","note":"практики в одном потоке"},{"value":"15","label":"стартапов","note":"представлено в витрине"}]';

ALTER TABLE "Program"
ADD COLUMN "price" TEXT NOT NULL DEFAULT '0 ₸',
ADD COLUMN "runsPerYear" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "equity" TEXT NOT NULL DEFAULT '0%';

ALTER TABLE "Project"
ADD COLUMN "trlLevel" INTEGER;

CREATE TABLE "ItCourse" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "dateLabel" TEXT NOT NULL DEFAULT '',
  "format" TEXT NOT NULL DEFAULT 'Офлайн',
  "duration" TEXT NOT NULL DEFAULT '',
  "includes" JSONB NOT NULL DEFAULT '[]',
  "imageUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ItCourse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ItCourse_slug_key" ON "ItCourse"("slug");
CREATE INDEX "ItCourse_published_sortOrder_idx" ON "ItCourse"("published", "sortOrder");
