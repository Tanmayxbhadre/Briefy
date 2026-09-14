import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { revalidateNewsPublication } from '@/lib/cache/revalidateNews';
import { getArticleSeoAudit, optimizeAndPersistArticleSeo } from '@/lib/seo/articleSeoService';

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No drafts selected' }, { status: 400 });
    }

    if (action === 'publish') {
      const drafts = await prisma.articleDraft.findMany({
        where: { id: { in: ids } },
        include: { category: true, newsItem: true },
      });

      const invalidDrafts = drafts.map((draft) => {
        const errors: string[] = [];
        if (!draft.title?.trim()) errors.push('Title is required');
        if (!draft.slug?.trim()) errors.push('Slug is required');
        if (!draft.excerpt?.trim()) errors.push('Excerpt is required');
        if (!draft.content?.trim()) errors.push('Content is required');
        if (!draft.categoryId) errors.push('Category is required');
        if (!draft.authorName?.trim()) errors.push('Author is required');
        if (!draft.seoTitle?.trim()) errors.push('SEO title is required');
        if (!draft.metaDescription?.trim()) errors.push('Meta description is required');

        let sources: unknown = [];
        try {
          sources = draft.sources ? JSON.parse(draft.sources) : [];
        } catch {
          sources = [];
        }
        if (!Array.isArray(sources) || sources.length === 0) {
          errors.push('Source attribution is required');
        }

        const audit = getArticleSeoAudit({
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt,
          content: draft.content,
          seoTitle: draft.seoTitle,
          metaDescription: draft.metaDescription,
          categorySlug: draft.category?.slug,
          authorName: draft.authorName,
          featuredImage: draft.featuredImage,
          imageAlt: draft.imageAlt,
          sources: draft.sources,
          quickSummary: draft.quickSummary,
          whatYouNeedToKnow: draft.whatYouNeedToKnow,
          tags: draft.tags,
        });
        errors.push(...audit.checks.filter((check) => check.status === 'critical').map((check) => check.message));
        return { id: draft.id, title: draft.title, errors: Array.from(new Set(errors)) };
      }).filter((draft) => draft.errors.length > 0);

      if (invalidDrafts.length > 0) {
        return NextResponse.json(
          {
            error: 'No drafts were published because one or more failed the publication checklist.',
            validationErrors: invalidDrafts,
          },
          { status: 422 }
        );
      }

      let publishedCount = 0;
      const revalidationPromises: Promise<void>[] = [];

      for (const draft of drafts) {
        await optimizeAndPersistArticleSeo(draft.id, {
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt,
          content: draft.content,
          seoTitle: draft.seoTitle,
          metaDescription: draft.metaDescription,
          categorySlug: draft.category?.slug,
          authorName: draft.authorName,
          featuredImage: draft.featuredImage,
          imageAlt: draft.imageAlt,
          sources: draft.sources,
          quickSummary: draft.quickSummary,
          whatYouNeedToKnow: draft.whatYouNeedToKnow,
          tags: draft.tags,
        });
        const publishedAt = draft.publishedAt || new Date();

        await prisma.articleDraft.update({
          where: { id: draft.id },
          data: {
            status: 'PUBLISHED',
            publishedAt,
          },
        });

        if (draft.newsItemId) {
          await prisma.newsItem.update({
            where: { id: draft.newsItemId },
            data: { status: 'PUBLISHED' },
          });
        }

        publishedCount++;
        revalidationPromises.push(
          revalidateNewsPublication({
            categorySlug: draft.category?.slug,
            slug: draft.slug,
          })
        );
      }

      await Promise.all(revalidationPromises);

      await recordActivity(
        'bulk_drafts_publish',
        `${publishedCount} articles`,
        `Batch published ${publishedCount} drafts to public site`,
        session.user || 'Admin'
      );

      return NextResponse.json({
        success: true,
        count: publishedCount,
        status: 'PUBLISHED',
      });
    }

    if (action === 'delete') {
      const deleteResult = await prisma.articleDraft.deleteMany({
        where: { id: { in: ids } },
      });

      await recordActivity(
        'bulk_drafts_delete',
        `${deleteResult.count} drafts`,
        `Batch deleted ${deleteResult.count} drafts`,
        session.user || 'Admin'
      );

      return NextResponse.json({
        success: true,
        count: deleteResult.count,
      });
    }

    let newStatus: string;
    if (action === 'approve') newStatus = 'APPROVED';
    else if (action === 'review') newStatus = 'REVIEW';
    else if (action === 'archive') newStatus = 'ARCHIVED';
    else if (action === 'draft') newStatus = 'DRAFT';
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updateResult = await prisma.articleDraft.updateMany({
      where: { id: { in: ids } },
      data: { status: newStatus },
    });

    await recordActivity(
      `bulk_drafts_${action}`,
      `${ids.length} drafts`,
      `Updated ${updateResult.count} drafts to ${newStatus}`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      status: newStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bulk draft action failed';
    console.error('Error in bulk draft action:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
