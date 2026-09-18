import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { optimizeAndPersistArticleSeo } from '@/lib/seo/articleSeoService';
import { revalidateNewsPublication } from '@/lib/cache/revalidateNews';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let limit = 100;
    try {
      const body = await request.json().catch(() => ({}));
      if (body.limit && typeof body.limit === 'number') {
        limit = Math.min(body.limit, 200);
      }
    } catch {
      // Use default limit
    }

    // Retrieve all drafts eligible for publication (DRAFT, REVIEW, APPROVED)
    const drafts = await prisma.articleDraft.findMany({
      where: {
        status: { in: ['APPROVED', 'DRAFT', 'REVIEW'] },
      },
      include: {
        category: true,
      },
      orderBy: [
        { status: 'asc' }, // APPROVED first
        { publishConfidence: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    if (drafts.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No pending drafts found to publish. All news is already published!',
      });
    }

    let publishedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ id: string; title: string; error: string }> = [];
    const revalidationPromises: Promise<void>[] = [];
    const now = new Date();

    for (const draft of drafts) {
      try {
        // Ensure essential fields exist
        if (!draft.title?.trim() || !draft.slug?.trim() || !draft.content?.trim()) {
          skippedCount++;
          continue;
        }

        // Optimize and persist SEO
        await optimizeAndPersistArticleSeo(draft.id, {
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt || draft.title,
          content: draft.content,
          seoTitle: draft.seoTitle || draft.title,
          metaDescription: draft.metaDescription || draft.excerpt || draft.title.slice(0, 155),
          categorySlug: draft.category?.slug,
          authorName: draft.authorName || 'Briefy.live Editorial Team',
          featuredImage: draft.featuredImage,
          imageAlt: draft.imageAlt,
          sources: draft.sources,
          quickSummary: draft.quickSummary,
          whatYouNeedToKnow: draft.whatYouNeedToKnow,
          tags: draft.tags,
        });

        // Mark draft as published
        await prisma.articleDraft.update({
          where: { id: draft.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            autoPublished: true,
          },
        });

        // Update associated news item if linked
        if (draft.newsItemId) {
          await prisma.newsItem.update({
            where: { id: draft.newsItemId },
            data: { status: 'PUBLISHED' },
          }).catch((err) => {
            console.warn(`[AUTO-PUBLISH-ALL] Note updating newsItem ${draft.newsItemId}:`, err);
          });
        }

        publishedCount++;

        revalidationPromises.push(
          revalidateNewsPublication({
            categorySlug: draft.category?.slug,
            slug: draft.slug,
          }).catch((err) => {
            console.warn(`[AUTO-PUBLISH-ALL] Revalidation failed for ${draft.slug}:`, err);
          })
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Publish error';
        console.error(`[AUTO-PUBLISH-ALL] Error publishing draft ${draft.id}:`, errorMsg);
        errors.push({ id: draft.id, title: draft.title, error: errorMsg });
      }
    }

    await Promise.allSettled(revalidationPromises);

    // Record admin activity
    await recordActivity(
      'auto_publish_all_triggered',
      `${publishedCount} articles`,
      `Manual Auto-Publish All triggered from Automation sidebar. Published ${publishedCount} articles, skipped ${skippedCount}.`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      count: publishedCount,
      skipped: skippedCount,
      totalCandidateDrafts: drafts.length,
      errors: errors.slice(0, 5),
      message:
        publishedCount > 0
          ? `Successfully published ${publishedCount} article${publishedCount > 1 ? 's' : ''} to Briefy.live!`
          : 'Processed drafts, but none were eligible for publication.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[AUTO-PUBLISH-ALL] Uncaught error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
