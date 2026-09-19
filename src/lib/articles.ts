import { prisma } from './db';
import { Article, Source, TimelineEvent, WhatYouNeedToKnow } from './types';
import { articles as mockArticles } from './mock-data';
import { categories as mockCategories } from './mock-data';
import { IS_PRODUCTION } from './site';
import { SITE_CATEGORIES, CATEGORY_BY_SLUG } from './categories';
import { deduplicateArticles } from './utils';
import slugify from 'slugify';
import { ArticleDraft, Category as PrismaCategory, NewsItem, StoryCluster } from '@prisma/client';

import { evaluateArticleQuality } from './seo/qualityGate';

type DraftWithRelations = ArticleDraft & {
  category?: PrismaCategory | null;
  newsItem?: NewsItem | null;
  cluster?: StoryCluster | null;
};

export function draftToArticle(draft: DraftWithRelations): Article {
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

  // Resolve true story publication time: prefer original source timestamp over batch publishing moment
  const resolvedDate =
    draft.newsItem?.publishedAt ||
    draft.cluster?.firstSeenAt ||
    draft.publishedAt ||
    draft.createdAt;

  const publishedAtIso = resolvedDate
    ? new Date(resolvedDate).toISOString()
    : new Date().toISOString();

  // Prefer true image, else empty string which triggers branded placeholder component
  const featuredImage =
    draft.featuredImage ||
    draft.cluster?.leadImageUrl ||
    draft.newsItem?.imageUrl ||
    '';

  const categorySlug = draft.category?.slug || 'news';
  const categoryMeta = CATEGORY_BY_SLUG.get(categorySlug);

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
      id: draft.category?.id || categoryMeta?.id || 'c1',
      name: draft.category?.name || categoryMeta?.name || 'General',
      slug: categorySlug,
      description: draft.category?.description || categoryMeta?.description || '',
      seoTitle: draft.category?.seoTitle || categoryMeta?.seoTitle || '',
      seoDescription: draft.category?.seoDescription || categoryMeta?.seoDescription || '',
    },
    publishedAt: publishedAtIso,
    updatedAt: draft.updatedAt ? new Date(draft.updatedAt).toISOString() : undefined,
    featuredImage,
    imageAlt: draft.imageAlt || draft.title,
    tags,
    readingTime: draft.readingTime || 3,
    sources,
    quickSummary: quickSummary.length > 0 ? quickSummary : undefined,
    whatYouNeedToKnow: whatYouNeedToKnow || undefined,
    timeline: timeline.length > 0 ? timeline : undefined,
    featured: draft.featured,
    breaking: draft.breaking,
    seoTitle: draft.seoTitle || undefined,
    metaDescription: draft.metaDescription || undefined,
    canonicalUrl: draft.canonicalUrl || undefined,
    noindex: !evaluateArticleQuality({
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      sources,
    }).indexable,
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
        newsItem: true,
        cluster: true,
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
 * Get all published articles merged with mock articles (deduplicated by canonical slug)
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
        newsItem: true,
        cluster: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    const dbArticles = deduplicateArticles(dbDrafts.map(draftToArticle));
    const existingSlugs = new Set(dbArticles.map((a) => a.slug.toLowerCase()));
    const nonDupeMocks = mock.filter((a) => !existingSlugs.has(a.slug.toLowerCase()));

    // Real published articles from database take priority, followed by baseline mock items
    return deduplicateArticles([...dbArticles, ...nonDupeMocks]);
  } catch (err) {
    console.error('Error fetching all published articles:', err);
    // In production an empty list is correct: never serve fictional content.
    return deduplicateArticles(mock);
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
  const normalizedSlug = categorySlug.toLowerCase();
  const filtered = all.filter((a) => a.category.slug.toLowerCase() === normalizedSlug);
  const deduped = deduplicateArticles(filtered);
  return limit ? deduped.slice(0, limit) : deduped;
}

/**
 * Get latest published articles
 */
export async function getLatestPublishedArticles(limit = 10): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  return deduplicateArticles(all).slice(0, limit);
}

/**
 * Search published articles (server-side; backs /api/search for the client
 * search page so it can index real database articles).
 */
export async function searchPublishedArticles(query: string): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  const q = query.toLowerCase().trim();
  const filtered = all.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.category.name.toLowerCase().includes(q)
  );
  return deduplicateArticles(filtered);
}

/**
 * Related articles: chooses by shared tags/entities/topic similarity plus recency,
 * not just 'latest in section'. Falls back to same-category when no shared tags exist.
 */
export async function getRelatedArticles(
  article: Article,
  count = 4
): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  const candidates = all.filter((a) => a.id !== article.id && !a.noindex);

  const currentTags = new Set(article.tags.map((t) => t.toLowerCase()));
  const currentWords = new Set(
    article.title
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );

  const scored = candidates.map((candidate) => {
    let score = 0;

    // Shared tags score (high weight)
    for (const tag of candidate.tags) {
      if (currentTags.has(tag.toLowerCase())) {
        score += 10;
      }
    }

    // Shared title keywords
    for (const word of candidate.title.toLowerCase().split(/\W+/)) {
      if (word.length > 3 && currentWords.has(word)) {
        score += 3;
      }
    }

    // Same category bonus
    if (candidate.category.slug.toLowerCase() === article.category.slug.toLowerCase()) {
      score += 2;
    }

    // Recency bonus: within 7 days +1
    const ageDays = (Date.now() - new Date(candidate.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) {
      score += 1;
    }

    return { candidate, score };
  });

  scored.sort((a, b) => b.score - a.score || new Date(b.candidate.publishedAt).getTime() - new Date(a.candidate.publishedAt).getTime());

  return deduplicateArticles(scored.map((s) => s.candidate)).slice(0, count);
}

/**
 * Topic & Tag aggregation helpers
 */
export function slugifyTag(tag: string): string {
  return slugify(tag, { lower: true, strict: true }) || tag.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export async function getTagCounts(): Promise<Map<string, { name: string; count: number; articles: Article[] }>> {
  const all = await getAllPublishedArticles();
  const tagMap = new Map<string, { name: string; count: number; articles: Article[] }>();

  for (const article of all) {
    if (article.noindex) continue;
    for (const tag of article.tags) {
      const trimmed = tag.trim();
      if (!trimmed) continue;
      const slug = slugifyTag(trimmed);
      const existing = tagMap.get(slug);
      if (existing) {
        existing.count += 1;
        existing.articles.push(article);
      } else {
        tagMap.set(slug, { name: trimmed, count: 1, articles: [article] });
      }
    }
  }

  return tagMap;
}

export async function getAllEligibleTopicSlugs(minCount = 5): Promise<string[]> {
  const tagMap = await getTagCounts();
  const eligible: string[] = [];
  for (const [slug, data] of tagMap.entries()) {
    if (data.count >= minCount) {
      eligible.push(slug);
    }
  }
  return eligible;
}

export async function getTopicBySlug(
  slug: string
): Promise<{ slug: string; name: string; count: number; articles: Article[] } | null> {
  const tagMap = await getTagCounts();
  const topic = tagMap.get(slug.toLowerCase());
  if (!topic) return null;
  return {
    slug: slug.toLowerCase(),
    name: topic.name,
    count: topic.count,
    articles: deduplicateArticles(topic.articles),
  };
}

/**
 * Resolve a category by slug from database, unified categories, or mock catalog.
 */
export async function getCategoryBySlug(
  slug: string
): Promise<(typeof mockCategories)[number] | undefined> {
  const normalizedSlug = slug.toLowerCase();
  try {
    const dbCategory = await prisma.category.findUnique({
      where: { slug: normalizedSlug },
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

  const unified = CATEGORY_BY_SLUG.get(normalizedSlug);
  if (unified) {
    return {
      id: unified.id,
      name: unified.name,
      slug: unified.slug,
      description: unified.description,
      seoTitle: unified.seoTitle,
      seoDescription: unified.seoDescription,
    };
  }

  return mockCategories.find((c) => c.slug.toLowerCase() === normalizedSlug);
}

/**
 * List all category slugs: database first, then unified catalog, then mock categories.
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const slugs = new Set<string>();

  try {
    const dbCategories = await prisma.category.findMany({ select: { slug: true } });
    for (const c of dbCategories) slugs.add(c.slug.toLowerCase());
  } catch (err) {
    console.error('Error listing categories:', err);
  }

  for (const c of SITE_CATEGORIES) slugs.add(c.slug.toLowerCase());

  if (!IS_PRODUCTION) {
    for (const c of mockCategories) slugs.add(c.slug.toLowerCase());
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
      include: { category: true, newsItem: true, cluster: true },
      orderBy: { publishedAt: 'desc' },
    });

    if (breakingDraft) {
      const resolvedDate =
        breakingDraft.newsItem?.publishedAt ||
        breakingDraft.cluster?.firstSeenAt ||
        breakingDraft.publishedAt;

      return {
        id: breakingDraft.id,
        headline: breakingDraft.title,
        url: `/${breakingDraft.category?.slug || 'news'}/${breakingDraft.slug}`,
        time: resolvedDate
          ? new Date(resolvedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
