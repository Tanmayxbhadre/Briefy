import { prisma } from './db';
import { Article, Source, TimelineEvent, WhatYouNeedToKnow } from './types';
import { articles as mockArticles } from './mock-data';
import { categories as mockCategories } from './mock-data';
import { IS_PRODUCTION } from './site';
import slugify from 'slugify';
import { ArticleDraft, Category as PrismaCategory } from '@prisma/client';

type DraftWithCategory = ArticleDraft & {
  category: PrismaCategory | null;
};

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=675&fit=crop',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=675&fit=crop',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=675&fit=crop',
  'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=1200&h=675&fit=crop',
  'https://images.unsplash.com/photo-1557428894-56bcc97113fe?w=1200&h=675&fit=crop',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&h=675&fit=crop',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=675&fit=crop',
  'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=1200&h=675&fit=crop'
];

function getFallbackImage(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_IMAGES[Math.abs(hash) % DEFAULT_IMAGES.length];
}

export function draftToArticle(draft: DraftWithCategory): Article {
  let sources: Source[] = [];
  try {
    if (draft.sources) sources = typeof draft.sources === 'string' ? JSON.parse(draft.sources) : draft.sources;
  } catch {}

  let quickSummary: string[] = [];
  try {
    if (draft.quickSummary) {
      quickSummary = typeof draft.quickSummary === 'string' ? JSON.parse(draft.quickSummary) : draft.quickSummary;
    }
  } catch {}

  let whatYouNeedToKnow: WhatYouNeedToKnow | undefined = undefined;
  try {
    if (draft.whatYouNeedToKnow) {
      whatYouNeedToKnow =
        typeof draft.whatYouNeedToKnow === 'string'
          ? JSON.parse(draft.whatYouNeedToKnow)
          : draft.whatYouNeedToKnow;
    }
  } catch {}

  let timeline: TimelineEvent[] = [];
  try {
    if (draft.timeline) {
      timeline = typeof draft.timeline === 'string' ? JSON.parse(draft.timeline) : draft.timeline;
    }
  } catch {}

  let tags: string[] = [];
  try {
    if (draft.tags) {
      tags = typeof draft.tags === 'string' ? JSON.parse(draft.tags) : draft.tags;
    }
  } catch {}

  return {
    id: draft.id,
    title: draft.title,
    slug: draft.slug,
    description: draft.excerpt || '',
    content: draft.content || '',
    author: {
      id: draft.authorId || 'admin-author',
      name: draft.authorName || 'Briefy.live Editorial Team',
      slug: slugify(draft.authorName || 'briefylive', { lower: true }),
    },
    category: {
      id: draft.category?.id || 'c1',
      name: draft.category?.name || 'General',
      slug: draft.category?.slug || 'news',
      description: draft.category?.description || '',
      seoTitle: draft.category?.seoTitle || '',
      seoDescription: draft.category?.seoDescription || '',
    },
    publishedAt: draft.publishedAt
      ? new Date(draft.publishedAt).toISOString()
      : new Date(draft.createdAt).toISOString(),
    updatedAt: draft.updatedAt ? new Date(draft.updatedAt).toISOString() : undefined,
    featuredImage:
      draft.featuredImage || getFallbackImage(draft.id),
    imageAlt: draft.imageAlt || draft.title,
    tags,
    readingTime: draft.readingTime || 3,
    sources,
    quickSummary: quickSummary.length > 0 ? quickSummary : undefined,
    whatYouNeedToKnow: whatYouNeedToKnow || undefined,
    timeline: timeline.length > 0 ? timeline : undefined,
    featured: draft.featured,
    breaking: draft.breaking,
    // SEO-optimized fields from src/lib/seo/optimizer.ts — previously computed
    // and stored but never surfaced to crawlers. Metadata now prefers them.
    seoTitle: draft.seoTitle || undefined,
    metaDescription: draft.metaDescription || undefined,
    canonicalUrl: draft.canonicalUrl || undefined,
  };
}

/**
 * Mock articles are fictional placeholder content. In production they must
 * never appear on public surfaces (sitemaps, feeds, listings) — only real
 * published database articles do. Controlled via src/lib/site.ts.
 */
function getMockArticles(): Article[] {
  return IS_PRODUCTION ? [] : mockArticles;
}

/**
 * Get single published article by slug
 */
export async function getPublishedArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const dbDraft = await prisma.articleDraft.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        category: true,
      },
    });

    if (dbDraft) {
      return draftToArticle(dbDraft);
    }
  } catch (err) {
    console.error('Error querying published article by slug:', err);
  }

  // Fallback to mock data (development only — production returns [])
  return getMockArticles().find((a) => a.slug === slug);
}

/**
 * Get all published articles merged with mock articles
 */
export async function getAllPublishedArticles(): Promise<Article[]> {
  const mock = getMockArticles();

  try {
    const dbDrafts = await prisma.articleDraft.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    const dbArticles = dbDrafts.map(draftToArticle);
    const existingSlugs = new Set(dbArticles.map((a) => a.slug));
    const nonDupeMocks = mock.filter((a) => !existingSlugs.has(a.slug));

    // Real published articles from database take priority, followed by baseline mock items
    return [...dbArticles, ...nonDupeMocks];
  } catch (err) {
    console.error('Error fetching all published articles:', err);
    // In production an empty list is correct: never serve fictional content.
    return mock;
  }
}

/**
 * Get published articles by category
 */
export async function getPublishedArticlesByCategory(
  categorySlug: string,
  limit?: number
): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  const filtered = all.filter((a) => a.category.slug === categorySlug);
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get latest published articles
 */
export async function getLatestPublishedArticles(limit = 10): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  return all.slice(0, limit);
}

/**
 * Search published articles (server-side; backs /api/search for the client
 * search page so it can index real database articles).
 */
export async function searchPublishedArticles(query: string): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  const q = query.toLowerCase();
  return all.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.category.name.toLowerCase().includes(q)
  );
}

/**
 * Related articles: same category first, then newest others. Prefers real
 * database articles (previously this only ever returned mock articles).
 */
export async function getRelatedArticles(
  article: Article,
  count = 4
): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  const sameCategory = all.filter(
    (a) => a.id !== article.id && a.category.slug === article.category.slug
  );
  const others = all.filter(
    (a) => a.id !== article.id && a.category.slug !== article.category.slug
  );
  return [...sameCategory, ...others].slice(0, count);
}

/**
 * Resolve a category by slug from the database, falling back to the mock
 * catalog. Previously only mock categories were recognized, so categories
 * created in the admin panel led to 404s even with published articles.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<(typeof mockCategories)[number] | undefined> {
  try {
    const dbCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (dbCategory) {
      return {
        id: dbCategory.id,
        name: dbCategory.name,
        slug: dbCategory.slug,
        description: dbCategory.description || '',
        seoTitle: dbCategory.seoTitle || dbCategory.name,
        seoDescription: dbCategory.seoDescription || dbCategory.description || '',
      };
    }
  } catch (err) {
    console.error('Error resolving category by slug:', err);
  }

  return mockCategories.find((c) => c.slug === slug);
}

/**
 * List all category slugs: database first, then any mock-only categories
 * (development). Used by the sitemap and revalidation layer so newly created
 * categories are always discoverable.
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const slugs = new Set<string>();

  try {
    const dbCategories = await prisma.category.findMany({ select: { slug: true } });
    for (const c of dbCategories) slugs.add(c.slug);
  } catch (err) {
    console.error('Error listing categories:', err);
  }

  if (!IS_PRODUCTION) {
    for (const c of mockCategories) slugs.add(c.slug);
  }

  return [...slugs];
}

/**
 * Get dynamic breaking news headline from DB or mock data
 */
export async function getDynamicBreakingNews(): Promise<import('./types').BreakingNewsItem | undefined> {
  try {
    const breakingDraft = await prisma.articleDraft.findFirst({
      where: {
        status: 'PUBLISHED',
        breaking: true,
      },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
    });

    if (breakingDraft) {
      return {
        id: breakingDraft.id,
        headline: breakingDraft.title,
        url: `/${breakingDraft.category?.slug || 'technology'}/${breakingDraft.slug}`,
        time: breakingDraft.publishedAt
          ? new Date(breakingDraft.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Live',
      };
    }
  } catch (err) {
    console.error('Error querying dynamic breaking news:', err);
  }

  if (IS_PRODUCTION) return undefined;

  const { getBreakingNews } = await import('./mock-data');
  return getBreakingNews();
}
