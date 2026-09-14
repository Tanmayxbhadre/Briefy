import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { revalidateNewsPublication } from '@/lib/cache/revalidateNews';
import { getArticleSeoAudit, optimizeAndPersistArticleSeo } from '@/lib/seo/articleSeoService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    const { id } = await params;

    const draft = await prisma.articleDraft.findUnique({
      where: { id },
      include: { category: true, newsItem: true, seoProfile: true },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Comprehensive publish validation rules (Section 27)
    const errors: string[] = [];
    if (!draft.title?.trim()) errors.push('Title is required');
    if (!draft.slug?.trim()) errors.push('Slug is required');
    if (!draft.excerpt?.trim()) errors.push('Excerpt / summary is required');
    if (!draft.content?.trim()) errors.push('Article content is required');
    if (!draft.categoryId) errors.push('Category must be selected');
    if (!draft.authorName?.trim()) errors.push('Author name is required');
    if (!draft.seoTitle?.trim()) errors.push('SEO Title is required');
    if (!draft.metaDescription?.trim()) errors.push('Meta Description is required');

    // Parse sources
    let sources: { name: string; url: string }[] = [];
    try {
      if (draft.sources) sources = JSON.parse(draft.sources);
    } catch {
      sources = [];
    }
    if (!Array.isArray(sources) || sources.length === 0) {
      errors.push('At least one original source attribution is required');
    }

    const seoAudit = getArticleSeoAudit({
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
    for (const check of seoAudit.checks.filter((item) => item.status === 'critical')) {
      errors.push(check.message);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed. Please resolve the following checklist items before publishing.',
          validationErrors: errors,
        },
        { status: 422 }
      );
    }

    if (!draft.seoProfile) {
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
    }

    const publishedAt = draft.publishedAt || new Date();

    // Update draft to PUBLISHED
    const publishedArticle = await prisma.articleDraft.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt,
      },
      include: { category: true },
    });

    // If attached to a newsItem, update that NewsItem's status too
    if (draft.newsItemId) {
      await prisma.newsItem.update({
        where: { id: draft.newsItemId },
        data: { status: 'PUBLISHED' },
      });
    }

    // Centralized cache revalidation
    await revalidateNewsPublication({
      categorySlug: publishedArticle.category?.slug,
      slug: publishedArticle.slug,
    });

    await recordActivity(
      'article_published',
      publishedArticle.title,
      `Published to /${publishedArticle.category?.slug || 'news'}/${publishedArticle.slug}`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      article: publishedArticle,
      liveUrl: `/${publishedArticle.category?.slug || 'news'}/${publishedArticle.slug}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Publishing failed';
    console.error('Error publishing article:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
