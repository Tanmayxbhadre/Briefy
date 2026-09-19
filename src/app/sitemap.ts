import { MetadataRoute } from 'next';
import { getAllPublishedArticles, getAllCategorySlugs, getAllEligibleTopicSlugs } from '@/lib/articles';
import { SITE_URL } from '@/lib/site';

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

  // Static trust & governance pages
  const staticPages = [
    '',
    '/daily-news',
    '/about',
    '/editorial-policy',
    '/corrections-policy',
    '/masthead',
    '/contact',
    '/privacy',
    '/terms',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: articles[0]
      ? new Date(articles[0].updatedAt || articles[0].publishedAt)
      : new Date('2026-01-01'),
    changeFrequency: path === '' || path === '/daily-news' ? 'hourly' : 'monthly',
    priority: path === '' ? 1.0 : path === '/daily-news' ? 0.9 : 0.5,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...topicEntries,
    ...articleEntries,
  ];
}
