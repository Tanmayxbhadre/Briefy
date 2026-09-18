import { prisma } from '../db';
import { isDealContent } from './articleGenerationWorker';

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

    // 5. Archive published deal/coupon/affiliate articles that slipped
    // through under editorial categories (technology, business, etc.).
    let archivedDealArticles = 0;
    const editorialCategories = ['technology', 'business', 'science', 'ai', 'india', 'world'];
    const suspectArticles = await prisma.articleDraft.findMany({
      where: {
        status: 'PUBLISHED',
        category: { slug: { in: editorialCategories } },
      },
      select: { id: true, title: true, excerpt: true, content: true },
      take: 200,
    });

    for (const article of suspectArticles) {
      const combinedText = `${article.title} ${article.excerpt ?? ''} ${article.content ?? ''}`;
      if (isDealContent(combinedText)) {
        await prisma.articleDraft.update({
          where: { id: article.id },
          data: { status: 'ARCHIVED' },
        });
        archivedDealArticles++;
        console.log(`[CleanupWorker] Archived deal article: "${article.title}"`);
      }
    }

    return {
      deletedDrafts: draftResult.count,
      deletedNewsItems: newsResult.count,
      deletedClusters: clusterResult.count,
      deletedLogs: fetchLogResult.count + aiLogResult.count + activityLogResult.count,
      archivedDealArticles,
    };
  } catch (error) {
    console.error('[CleanupWorker] Failed to clean up database:', error);
    return { deletedDrafts: 0, deletedNewsItems: 0, deletedClusters: 0, deletedLogs: 0, archivedDealArticles: 0 };
  }
}
