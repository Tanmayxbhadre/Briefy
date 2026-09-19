import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { optimizeAndPersistArticleSeo } from '@/lib/seo/articleSeoService';
import { revalidateNewsPublication } from '@/lib/cache/revalidateNews';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let limit = 1000;
    try {
      const body = await request.json().catch(() => ({}));
      if (body.limit && typeof body.limit === 'number') {
        limit = Math.min(body.limit, 2000);
      }
    } catch {
      // Use default limit
    }

    // 1. Retrieve all drafts eligible for publication (DRAFT, REVIEW, APPROVED)
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

    let publishedCount = 0;
    let skippedCount = 0;
    const errors: Array<{ id: string; title: string; error: string }> = [];
    const revalidationPromises: Promise<void>[] = [];
    const now = new Date();
    const publishedDraftNewsItemIds = new Set<string>();

    for (const draft of drafts) {
      try {
        // Ensure essential fields exist
        if (!draft.title?.trim() || !draft.slug?.trim()) {
          skippedCount++;
          continue;
        }

        if (draft.newsItemId) {
          publishedDraftNewsItemIds.add(draft.newsItemId);
        }

        // Optimize and persist SEO if content exists
        if (draft.content?.trim()) {
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
          }).catch((err) => {
            console.warn(`[AUTO-PUBLISH-ALL] SEO optimization warning for draft ${draft.id}:`, err);
          });
        }

        // Mark draft as published
        await prisma.articleDraft.update({
          where: { id: draft.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: now,
            autoPublished: true,
            content: draft.content?.trim() || `## What Happened\n\n${draft.excerpt || draft.title}\n\n## Key Details\n\nOriginal reporting and verification provided by Briefy.live Editorial Desk.\n\n## Why It Matters\n\nFollow Briefy.live for ongoing editorial updates and verified global coverage.`,
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

    // 2. Also publish all pending NewsItems in queue (status not in ['PUBLISHED', 'REJECTED', 'ARCHIVED'])
    const remainingLimit = Math.max(0, limit - publishedCount);
    if (remainingLimit > 0) {
      const pendingNewsItems = await prisma.newsItem.findMany({
        where: {
          status: { notIn: ['PUBLISHED', 'REJECTED', 'ARCHIVED'] },
          id: { notIn: Array.from(publishedDraftNewsItemIds) },
        },
        include: {
          source: true,
          category: true,
          drafts: true,
        },
        orderBy: { discoveredAt: 'desc' },
        take: remainingLimit,
      });

      for (const item of pendingNewsItems) {
        try {
          let publishedSlug = '';
          const categorySlug = item.category?.slug || 'general';

          if (item.drafts && item.drafts.length > 0) {
            const draft = item.drafts[0];
            publishedSlug = draft.slug;

            await prisma.articleDraft.update({
              where: { id: draft.id },
              data: {
                status: 'PUBLISHED',
                publishedAt: draft.publishedAt || now,
                autoPublished: true,
                content: draft.content?.trim() || `## What Happened\n\n${item.description || item.title}\n\n## Key Details\n\nOriginal reporting provided by ${item.source?.name || 'Wire Service'}.\n\n## Why It Matters\n\nFollow Briefy.live for ongoing editorial updates and verified global coverage.`,
                excerpt: draft.excerpt?.trim() || item.description || item.title,
                authorName: draft.authorName || session.user || 'Briefy.live Editorial Desk',
                seoTitle: draft.seoTitle || item.title,
                metaDescription: draft.metaDescription || (item.description || item.title).slice(0, 155),
                sources: draft.sources || JSON.stringify([{ name: item.source?.name || 'Wire Service', url: item.originalUrl }]),
                quickSummary: draft.quickSummary || JSON.stringify([item.title, `Original coverage by ${item.source?.name || 'Wire Service'}`]),
              },
            });
          } else {
            // Generate unique slug
            const baseSlug = slugify(item.title, { lower: true, strict: true, trim: true }) || `news-item-${Date.now()}`;
            let slug = baseSlug;
            let counter = 1;
            while (await prisma.articleDraft.findUnique({ where: { slug } })) {
              slug = `${baseSlug}-${counter}`;
              counter++;
            }
            publishedSlug = slug;

            await prisma.articleDraft.create({
              data: {
                newsItemId: item.id,
                title: item.title,
                slug,
                excerpt: item.description || item.title,
                content: `## What Happened\n\n${item.description || item.title}\n\n## Key Details\n\nOriginal reporting provided by ${item.source?.name || 'Wire Service'}.\n\n## Why It Matters\n\nFollow Briefy.live for real-time journalistic verification and in-depth reporting.`,
                categoryId: item.categoryId || null,
                authorName: session.user || 'Briefy.live Editorial Desk',
                featuredImage: item.imageUrl || '',
                imageAlt: item.imageAlt || item.title,
                status: 'PUBLISHED',
                publishedAt: item.publishedAt || now,
                autoPublished: true,
                seoTitle: item.title,
                metaDescription: (item.description || item.title).slice(0, 155),
                sources: JSON.stringify([{ name: item.source?.name || 'Wire Service', url: item.originalUrl }]),
                quickSummary: JSON.stringify([item.title, `Original reporting by ${item.source?.name || 'Wire Service'}`]),
                tags: JSON.stringify(['News', item.category?.name || 'General']),
              },
            });
          }

          // Update news item status to PUBLISHED
          await prisma.newsItem.update({
            where: { id: item.id },
            data: { status: 'PUBLISHED' },
          });

          publishedCount++;

          revalidationPromises.push(
            revalidateNewsPublication({
              categorySlug,
              slug: publishedSlug,
            }).catch((err) => {
              console.warn(`[AUTO-PUBLISH-ALL] Revalidation failed for ${publishedSlug}:`, err);
            })
          );
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Publish error';
          console.error(`[AUTO-PUBLISH-ALL] Error publishing news item ${item.id}:`, errorMsg);
          errors.push({ id: item.id, title: item.title, error: errorMsg });
        }
      }
    }

    await Promise.allSettled(revalidationPromises);

    // Record admin activity
    await recordActivity(
      'auto_publish_all_triggered',
      `${publishedCount} articles`,
      `Manual Auto-Publish All triggered. Published ${publishedCount} articles, skipped ${skippedCount}.`,
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
          : 'Processed queue, but no pending news items or drafts were found.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[AUTO-PUBLISH-ALL] Uncaught error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
