import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      latestJob,
      latestSuccessJob,
      recentJobs,
      totalPublished,
      publishedLast24h,
      autoPublishedLast24h,
      pendingDraftsCount,
      approvedDraftsCount,
      discoveredNewsCount,
    ] = await Promise.all([
      // Latest collection / pipeline job
      prisma.collectionJob.findFirst({
        orderBy: { startedAt: 'desc' },
      }),
      // Latest completed job
      prisma.collectionJob.findFirst({
        where: { status: { in: ['COMPLETED', 'PARTIAL'] } },
        orderBy: { completedAt: 'desc' },
      }),
      // Recent jobs
      prisma.collectionJob.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
      // Overall published count
      prisma.articleDraft.count({
        where: { status: 'PUBLISHED' },
      }),
      // Published in last 24h
      prisma.articleDraft.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: last24h },
        },
      }),
      // Auto-published in last 24h
      prisma.articleDraft.count({
        where: {
          status: 'PUBLISHED',
          autoPublished: true,
          publishedAt: { gte: last24h },
        },
      }),
      // Drafts pending review / unapproved
      prisma.articleDraft.count({
        where: { status: { in: ['DRAFT', 'REVIEW'] } },
      }),
      // Approved drafts ready for publishing
      prisma.articleDraft.count({
        where: { status: 'APPROVED' },
      }),
      // Discovered news items awaiting draft generation
      prisma.newsItem.count({
        where: { status: { in: ['DISCOVERED', 'REVIEW'] } },
      }),
    ]);

    // Determine system pipeline status
    let pipelineStatus: 'HEALTHY' | 'RUNNING' | 'WARNING' | 'FAILED' | 'IDLE' = 'HEALTHY';
    if (!latestJob) {
      pipelineStatus = 'IDLE';
    } else if (latestJob.status === 'RUNNING') {
      pipelineStatus = 'RUNNING';
    } else if (latestJob.status === 'FAILED') {
      pipelineStatus = 'FAILED';
    } else if (
      latestSuccessJob?.completedAt &&
      now.getTime() - new Date(latestSuccessJob.completedAt).getTime() > 2 * 60 * 60 * 1000
    ) {
      pipelineStatus = 'WARNING'; // Stale if more than 2h since last successful run
    }

    const runsLast24h = recentJobs.filter((j) => new Date(j.startedAt) >= last24h).length;

    return NextResponse.json({
      success: true,
      status: pipelineStatus,
      lastRun: latestJob?.startedAt ?? null,
      lastRunCompletedAt: latestJob?.completedAt ?? null,
      lastRunStatus: latestJob?.status ?? null,
      lastRunTrigger: latestJob?.trigger ?? null,
      lastRunDurationMs: latestJob?.durationMs ?? null,
      itemsFound: latestJob?.itemsFound ?? 0,
      itemsInserted: latestJob?.itemsInserted ?? 0,
      duplicates: latestJob?.duplicates ?? 0,
      publishedLastRun: latestJob?.publishedCount ?? 0,
      draftsCreatedLastRun: latestJob?.draftsCreated ?? 0,
      failedSources: latestJob?.failedSources ?? 0,
      totalPublished,
      publishedLast24h,
      autoPublishedLast24h,
      pendingDraftsCount,
      approvedDraftsCount,
      totalPendingEditorial: pendingDraftsCount + approvedDraftsCount,
      discoveredNewsCount,
      runsLast24h,
      config: {
        autoPublishEnabled: process.env.AUTO_PUBLISH_ENABLED === 'true',
        cronSchedule: 'Hourly at :00 (Fetch & Draft) & :30 (Auto-Publish)',
        minConfidence: process.env.AUTO_PUBLISH_MIN_CONFIDENCE || '70',
        minQuality: process.env.AUTO_PUBLISH_MIN_QUALITY || '65',
      },
      recentJobs: recentJobs.map((j) => ({
        id: j.id,
        trigger: j.trigger,
        startedAt: j.startedAt,
        completedAt: j.completedAt,
        status: j.status,
        itemsFound: j.itemsFound,
        itemsInserted: j.itemsInserted,
        duplicates: j.duplicates,
        publishedCount: j.publishedCount,
        draftsCreated: j.draftsCreated,
        durationMs: j.durationMs,
        errorMessage: j.errorMessage,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch automation status';
    console.error('[AUTOMATION-STATUS] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
