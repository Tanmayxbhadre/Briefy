import { prisma } from '../db';

export async function runCleanupWorker() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    // 1. Delete old unpublished Article Drafts
    const draftResult = await prisma.articleDraft.deleteMany({
      where: {
        status: { not: 'PUBLISHED' },
        createdAt: { lt: twoDaysAgo },
      },
    });

    // 2. Delete useless news (importance < 50) AND old unpublished News Items
    const newsResult = await prisma.newsItem.deleteMany({
      where: {
        status: { notIn: ['PUBLISHED', 'DRAFTED'] },
        OR: [
          { importanceScore: { lt: 50 } },
          { createdAt: { lt: twoDaysAgo } }
        ]
      },
    });

    // 3. Delete old empty Story Clusters
    const clusterResult = await prisma.storyCluster.deleteMany({
      where: {
        createdAt: { lt: twoDaysAgo },
        drafts: { none: { status: 'PUBLISHED' } },
      },
    });

    // 4. Delete old logs to keep DB organized
    const fetchLogResult = await prisma.fetchLog.deleteMany({
      where: { createdAt: { lt: sevenDaysAgo } }
    });
    
    const aiLogResult = await prisma.aIGenerationLog.deleteMany({
      where: { createdAt: { lt: sevenDaysAgo } }
    });

    const activityLogResult = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });

    return {
      deletedDrafts: draftResult.count,
      deletedNewsItems: newsResult.count,
      deletedClusters: clusterResult.count,
      deletedLogs: fetchLogResult.count + aiLogResult.count + activityLogResult.count
    };
  } catch (error) {
    console.error('[CleanupWorker] Failed to clean up database:', error);
    return { deletedDrafts: 0, deletedNewsItems: 0, deletedClusters: 0, deletedLogs: 0 };
  }
}
