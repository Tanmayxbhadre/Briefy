import { randomUUID } from 'crypto';
import { prisma } from '../db';
import { collectAllNews, CollectionSummary } from './collector';

export interface JobRunnerResult {
  success: boolean;
  jobId?: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
  skipped?: boolean;
  reason?: string;
  sourcesProcessed: number;
  newItems: number;
  duplicates: number;
  staleFiltered: number;
  failedSources: number;
  itemsFound: number;
  durationMs: number;
  errorMessage?: string;
}

const JOB_LOCK_NAME = 'news-collection';
const DEFAULT_LOCK_TTL_MS = 180_000;

async function acquireCollectionLock(jobName = JOB_LOCK_NAME, ttlMs = DEFAULT_LOCK_TTL_MS) {
  const now = new Date();
  const ownerId = randomUUID();
  await prisma.collectionJobLock.deleteMany({ where: { jobName, expiresAt: { lt: now } } }).catch(() => undefined);
  try {
    const lock = await prisma.collectionJobLock.create({
      data: { jobName, acquiredAt: now, expiresAt: new Date(now.getTime() + ttlMs), heartbeatAt: now, ownerId },
    });
    return { acquired: true, lockId: lock.id, ownerId };
  } catch {
    return { acquired: false, reason: 'job_already_running' };
  }
}

async function releaseCollectionLock(jobName = JOB_LOCK_NAME, ownerId?: string) {
  await prisma.collectionJobLock.deleteMany({ where: { jobName, ...(ownerId ? { ownerId } : {}) } }).catch((error) => {
    console.error('[JOB-LOCK] Error releasing lock:', error);
  });
}

export async function runNewsCollectionJob(options?: { trigger?: 'cron' | 'manual' | 'cli' | 'watch' | 'webhook' }): Promise<JobRunnerResult> {
  const trigger = options?.trigger || 'cron';
  const startTime = Date.now();
  const lockResult = await acquireCollectionLock();
  if (!lockResult.acquired) {
    return { success: true, status: 'SKIPPED', skipped: true, reason: lockResult.reason, sourcesProcessed: 0, newItems: 0, duplicates: 0, staleFiltered: 0, failedSources: 0, itemsFound: 0, durationMs: Date.now() - startTime };
  }

  let jobRecord: { id: string } | null = null;
  try {
    jobRecord = await prisma.collectionJob.create({ data: { trigger, startedAt: new Date(), status: 'RUNNING' } });
  } catch (error) {
    console.error('[NEWS-CRON] Failed to initialize CollectionJob record:', error);
  }

  const heartbeat = lockResult.ownerId ? setInterval(() => {
    prisma.collectionJobLock.updateMany({
      where: { jobName: JOB_LOCK_NAME, ownerId: lockResult.ownerId },
      data: { heartbeatAt: new Date(), expiresAt: new Date(Date.now() + DEFAULT_LOCK_TTL_MS) },
    }).catch(() => undefined);
  }, Math.floor(DEFAULT_LOCK_TTL_MS / 3)) : undefined;

  try {
    const summary: CollectionSummary = await collectAllNews();
    const durationMs = Date.now() - startTime;
    const status: 'COMPLETED' | 'PARTIAL' | 'FAILED' = summary.failedSources > 0 && summary.successfulSources === 0 && summary.sourcesProcessed > 0 ? 'FAILED' : summary.failedSources > 0 ? 'PARTIAL' : 'COMPLETED';
    if (jobRecord) {
      await prisma.collectionJob.update({ where: { id: jobRecord.id }, data: {
        completedAt: new Date(), status, sourcesProcessed: summary.sourcesProcessed, successfulSources: summary.successfulSources,
        failedSources: summary.failedSources, itemsFound: summary.itemsFound, itemsInserted: summary.newItems, duplicates: summary.duplicates,
        errorCount: summary.failedSources, durationMs, sourceErrors: summary.sourceErrors ? JSON.stringify(summary.sourceErrors) : null,
      } });
    }
    return { success: status !== 'FAILED', jobId: jobRecord?.id, status, sourcesProcessed: summary.sourcesProcessed, newItems: summary.newItems, duplicates: summary.duplicates, staleFiltered: summary.staleFiltered, failedSources: summary.failedSources, itemsFound: summary.itemsFound, durationMs };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Fatal news collection exception';
    const durationMs = Date.now() - startTime;
    if (jobRecord) await prisma.collectionJob.update({ where: { id: jobRecord.id }, data: { completedAt: new Date(), status: 'FAILED', durationMs, errorMessage: message } });
    return { success: false, jobId: jobRecord?.id, status: 'FAILED', errorMessage: message, sourcesProcessed: 0, newItems: 0, duplicates: 0, staleFiltered: 0, failedSources: 0, itemsFound: 0, durationMs };
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    await releaseCollectionLock(JOB_LOCK_NAME, lockResult.ownerId);
  }
}

export async function runAutomaticNewsUpdate(options?: { trigger?: 'cron' | 'manual' | 'cli' | 'watch' | 'webhook' }) {
  const collection = await runNewsCollectionJob(options);
  if (collection.skipped || !collection.success) return collection;
  const downstreamErrors: string[] = [];
  let clustering = { processed: 0, clustersCreated: 0 };
  let aiGeneration = { processed: 0, draftsCreated: 0, autoPublishedCount: 0, errors: [] as Array<{ id: string; error: string }> };
  let autoPublish = { swept: 0, published: 0, skipped: 0, errors: 0 };
  try { clustering = await (await import('./clustering')).clusterUnassignedNewsItems(); } catch (error) { downstreamErrors.push(`clustering: ${error instanceof Error ? error.message : 'failed'}`); }
  try { aiGeneration = await (await import('../ai/articleGenerationWorker')).runArticleGenerationWorker(); } catch (error) { downstreamErrors.push(`generation: ${error instanceof Error ? error.message : 'failed'}`); }
  try { const result = await (await import('../ai/autoPublishWorker')).runAutoPublishWorker(100); autoPublish = { swept: result.swept, published: result.published, skipped: result.skipped, errors: result.errors.length }; } catch (error) { downstreamErrors.push(`publish: ${error instanceof Error ? error.message : 'failed'}`); }
  try { await (await import('../cache/revalidateNews')).revalidateNewsPublication(); } catch (error) { downstreamErrors.push(`cache: ${error instanceof Error ? error.message : 'failed'}`); }
  try { await (await import('../ai/cleanupWorker')).runCleanupWorker(); } catch (error) { downstreamErrors.push(`cleanup: ${error instanceof Error ? error.message : 'failed'}`); }
  
  const totalPublishedCount = autoPublish.published + aiGeneration.autoPublishedCount;
  if (collection.jobId) await prisma.collectionJob.update({ where: { id: collection.jobId }, data: { downstreamStatus: downstreamErrors.length ? 'PARTIAL' : 'COMPLETED', downstreamErrors: downstreamErrors.length ? JSON.stringify(downstreamErrors) : null, clusterCount: clustering.clustersCreated, draftsCreated: aiGeneration.draftsCreated, publishedCount: totalPublishedCount, cacheRevalidatedAt: downstreamErrors.some((item) => item.startsWith('cache:')) ? null : new Date() } });
  return { ...collection, success: downstreamErrors.length === 0, status: downstreamErrors.length ? 'PARTIAL' as const : collection.status, downstream: { clustering, aiGeneration, autoPublish, errors: downstreamErrors } };
}
