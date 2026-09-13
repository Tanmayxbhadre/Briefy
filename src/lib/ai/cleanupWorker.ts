import { prisma } from '../db';

export async function runCleanupWorker() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  try {
    // 1. Delete old unpublished Article Drafts
    const draftResult = await prisma.articleDraft.deleteMany({
      where: {
        status: {
          not: 'PUBLISHED',
        },
        createdAt: {
          lt: twoDaysAgo,
        },
      },
    });

    // 2. Delete old unpublished News Items
    const newsResult = await prisma.newsItem.deleteMany({
      where: {
        status: {
          notIn: ['PUBLISHED', 'DRAFTED'],
        },
        createdAt: {
          lt: twoDaysAgo,
        },
      },
    });

    // 3. Delete old Story Clusters with no published drafts
    // (Cascade should handle related items, but let's just delete empty/stale clusters)
    const clusterResult = await prisma.storyCluster.deleteMany({
      where: {
        createdAt: {
          lt: twoDaysAgo,
        },
        drafts: {
          none: {
            status: 'PUBLISHED',
          },
        },
      },
    });

    return {
      deletedDrafts: draftResult.count,
      deletedNewsItems: newsResult.count,
      deletedClusters: clusterResult.count,
    };
  } catch (error) {
    console.error('[CleanupWorker] Failed to clean up old news:', error);
    return { deletedDrafts: 0, deletedNewsItems: 0, deletedClusters: 0 };
  }
}
