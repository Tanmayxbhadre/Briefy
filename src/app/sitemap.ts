import { MetadataRoute } from 'next';
import { getAllPublishedArticles, getAllCategorySlugs, getAllEligibleTopicSlugs } from '@/lib/articles';
import { SITE_URL } from '@/lib/site';
import { KNOWN_AUTHORS } from '@/config/authors';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllPublishedArticles();

  // Exclude noindex / low-quality / duplicate articles from sitemap
  const indexableArticles = articles.filter((a) => !a.noindex);

  const articleEntries: MetadataRoute.Sitemap = indexableArticles.map((a) => ({
    url: `${SITE_URL}/${a.category.slug}/${a.slug}`,
    lastModified: new Date(a.updatedAt || a.publishedAt),
    changeFrequency: 'daily',
    priority: a.featured ? 0.9 : 0.7,
  }));

  // Categories come from database and predefined taxonomy
  const categorySlugs = await getAllCategorySlugs();
  const categoryEntries: MetadataRoute.Sitemap = categorySlugs
    .map((slug) => {
      const catArticles = indexableArticles.filter((a) => a.category.slug === slug);
      const newest = catArticles[0];
      if (!newest) return null;
      return {
        url: `${SITE_URL}/${slug}`,
        lastModified: new Date(newest.updatedAt || newest.publishedAt),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  // Eligible topic archive hubs (>= 5 indexable articles)
  const eligibleTopicSlugs = await getAllEligibleTopicSlugs(5);
  const topicEntries: MetadataRoute.Sitemap = eligibleTopicSlugs.map((slug) => ({
    url: `${SITE_URL}/topic/${slug}`,
    lastModified: articles[0]
      ? new Date(articles[0].updatedAt || articles[0].publishedAt)
      : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  // Verified editorial author profiles (E-E-A-T)
  const authorEntries: MetadataRoute.Sitemap = Object.values(KNOWN_AUTHORS).map((author) => ({
    url: `${SITE_URL}/author/${author.slug}`,
    lastModified: articles[0]
      ? new Date(articles[0].updatedAt || articles[0].publishedAt)
      : new Date('2026-09-19T00:00:00Z'),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Static trust & governance pages
  // Homepage and daily-news change hourly; governance policies change when revised
  const POLICY_REVISION_DATE = new Date('2026-09-19T00:00:00Z');

  const staticPages = [
    { path: '', changeFreq: 'hourly' as const, priority: 1.0, isDynamic: true },
    { path: '/daily-news', changeFreq: 'hourly' as const, priority: 0.9, isDynamic: true },
    { path: '/about', changeFreq: 'monthly' as const, priority: 0.5, isDynamic: false },
    { path: '/editorial-policy', changeFreq: 'monthly' as const, priority: 0.5, isDynamic: false },
    { path: '/corrections-policy', changeFreq: 'monthly' as const, priority: 0.5, isDynamic: false },
    { path: '/masthead', changeFreq: 'monthly' as const, priority: 0.5, isDynamic: false },
    { path: '/contact', changeFreq: 'monthly' as const, priority: 0.5, isDynamic: false },
    { path: '/privacy', changeFreq: 'monthly' as const, priority: 0.4, isDynamic: false },
    { path: '/terms', changeFreq: 'monthly' as const, priority: 0.4, isDynamic: false },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: page.isDynamic
      ? articles[0]
        ? new Date(articles[0].updatedAt || articles[0].publishedAt)
        : new Date()
      : POLICY_REVISION_DATE,
    changeFrequency: page.changeFreq,
    priority: page.priority,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...topicEntries,
    ...authorEntries,
    ...articleEntries,
  ];
}
