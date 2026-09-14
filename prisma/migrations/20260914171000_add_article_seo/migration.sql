-- CreateTable
CREATE TABLE "ArticleSEO" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "primaryKeyword" TEXT,
    "secondaryKeywords" TEXT NOT NULL DEFAULT '[]',
    "longTailKeywords" TEXT NOT NULL DEFAULT '[]',
    "searchIntent" TEXT NOT NULL DEFAULT 'NEWS',
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "seoScore" INTEGER,
    "technicalScore" INTEGER,
    "contentRelevanceScore" INTEGER,
    "qualityScore" INTEGER,
    "discoverabilityScore" INTEGER,
    "imageAltText" TEXT,
    "structuredData" TEXT,
    "optimizationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lastOptimizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleSEO_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleSEO_articleId_key" ON "ArticleSEO"("articleId");

-- CreateIndex
CREATE INDEX "ArticleSEO_optimizationStatus_idx" ON "ArticleSEO"("optimizationStatus");

-- CreateIndex
CREATE INDEX "ArticleSEO_primaryKeyword_idx" ON "ArticleSEO"("primaryKeyword");

-- CreateIndex
CREATE INDEX "ArticleSEO_updatedAt_idx" ON "ArticleSEO"("updatedAt");

-- AddForeignKey
ALTER TABLE "ArticleSEO" ADD CONSTRAINT "ArticleSEO_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ArticleDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
