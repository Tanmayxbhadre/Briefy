-- Add durable lease and end-to-end pipeline telemetry.
ALTER TABLE "CollectionJobLock" ADD COLUMN "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CollectionJobLock" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "CollectionJob" ADD COLUMN "downstreamStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "CollectionJob" ADD COLUMN "downstreamErrors" TEXT;
ALTER TABLE "CollectionJob" ADD COLUMN "clusterCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CollectionJob" ADD COLUMN "draftsCreated" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CollectionJob" ADD COLUMN "publishedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CollectionJob" ADD COLUMN "cacheRevalidatedAt" TIMESTAMP(3);
CREATE INDEX "CollectionJob_createdAt_status_idx" ON "CollectionJob"("createdAt", "status");
