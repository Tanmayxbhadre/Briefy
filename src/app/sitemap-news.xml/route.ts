import { getAllPublishedArticles } from '@/lib/articles';
import { SITE_URL, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const allArticles = await getAllPublishedArticles();

  // Google News guidelines strictly require articles published within the
  // last 48 hours. When nothing is fresh we return an EMPTY urlset — never
  // pad with stale articles (the previous fallback of inserting the 10 most
  // recent stale items violated the spec and diluted the feed's freshness
  // signal).
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const newsArticles = allArticles
    .filter((a) => {
      if (a.noindex) return false;
      const pubDate = new Date(a.publishedAt);
      return pubDate >= cutoff;
    })
    .slice(0, 1000);

  const xmlItems = newsArticles
    .map((article) => {
      const url = `${SITE_URL}/${article.category.slug}/${article.slug}`;
      const pubDateIso = new Date(article.publishedAt).toISOString();
      const title = escapeXml(article.title);

      return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${SITE_NAME}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDateIso}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlItems}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
