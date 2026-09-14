import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /api/ blanket rule covers JSON endpoints (/api/news/version,
        // /api/indexnow, /api/analytics/track) that previously crawled as
        // indexable JSON. /admin, /api/admin and /api/cron stay blocked.
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['Googlebot', 'Bingbot', 'Googlebot-News'],
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/sitemap-news.xml`],
    host: SITE_URL,
  };
}
