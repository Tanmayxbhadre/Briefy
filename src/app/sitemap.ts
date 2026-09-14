import { MetadataRoute } from 'next';
import { getAllPublishedArticles, getAllCategorySlugs } from '@/lib/articles';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllPublishedArticles();

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/${a.category.slug}/${a.slug}`,
    lastModified: new Date(a.updatedAt || a.publishedAt),
    changeFrequency: 'daily',
    priority: a.featured ? 0.9 : 0.7,
  }));

  // Categories come from the database (plus dev-only mock catalog), so
  // admin-created categories are always discoverable. lastModified is derived
  // from each category's newest article rather than `new Date()` — a moving
  // timestamp on every crawl is a meaningless freshness signal.
  const categorySlugs = await getAllCategorySlugs();
  const categoryEntries: MetadataRoute.Sitemap = await Promise.all(
    categorySlugs.map(async (slug) => {
      const catArticles = articles.filter((a) => a.category.slug === slug);
      const newest = catArticles[0];
      return {
        url: `${SITE_URL}/${slug}`,
        lastModified: newest
          ? new Date(newest.updatedAt || newest.publishedAt)
          : new Date('2026-01-01'),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      };
    })
  );

  return [
    {
      url: SITE_URL,
      lastModified: articles[0]
        ? new Date(articles[0].updatedAt || articles[0].publishedAt)
        : new Date('2026-01-01'),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/daily-news`,
      lastModified: articles[0]
        ? new Date(articles[0].updatedAt || articles[0].publishedAt)
        : new Date('2026-01-01'),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...categoryEntries,
    ...articleEntries,
  ];
}
