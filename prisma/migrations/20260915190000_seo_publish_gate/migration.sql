ALTER TABLE "ArticleDraft"
  ADD COLUMN "seoWorkflowStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "seoVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "seoValidatedVersion" INTEGER,
  ADD COLUMN "seoValidation" TEXT,
  ADD COLUMN "seoProcessingAt" TIMESTAMP(3),
  ADD COLUMN "seoLastError" TEXT,
  ADD COLUMN "seoRetryCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "ArticleSEO"
  ADD COLUMN "contentVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "validatedVersion" INTEGER,
  ADD COLUMN "validationPayload" TEXT,
  ADD COLUMN "processingAt" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT,
  ADD COLUMN "retryCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "ArticleDraft_seoWorkflowStatus_idx" ON "ArticleDraft"("seoWorkflowStatus");
CREATE INDEX "ArticleDraft_seoValidatedVersion_idx" ON "ArticleDraft"("seoValidatedVersion");
CREATE INDEX "ArticleSEO_validatedVersion_idx" ON "ArticleSEO"("validatedVersion");

UPDATE "ArticleDraft"
SET "contentVersion" = 1,
    "seoVersion" = CASE WHEN "seoTitle" IS NOT NULL OR "metaDescription" IS NOT NULL THEN 1 ELSE 0 END
WHERE "contentVersion" = 1;
