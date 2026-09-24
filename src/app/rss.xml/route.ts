import { NextResponse } from 'next/server';
import { getAllPublishedArticles } from '@/lib/articles';
import { SITE_URL, SITE_NAME } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  const articles = await getAllPublishedArticles();

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const indexableArticles = articles.filter((a) => !a.noindex);

  const itemsXml = indexableArticles
    .slice(0, 30)
    .map((article) => {
      const url = `${SITE_URL}/${article.category.slug}/${article.slug}`;
      const pubDate = new Date(article.publishedAt).toUTCString();
      const imageUrl = article.featuredImage ? escapeXml(article.featuredImage) : null;

      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.description)}</description>
      <category>${escapeXml(article.category.name)}</category>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${escapeXml(article.author.name)}</dc:creator>
      <pubDate>${pubDate}</pubDate>${imageUrl ? `\n      <enclosure url="${imageUrl}" type="image/jpeg" length="0" />\n      <media:content url="${imageUrl}" medium="image" />` : ''}
    </item>`;
    })
    .join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_NAME} — Latest News &amp; In-Depth Analysis</title>
    <link>${SITE_URL}</link>
    <description>Clear, verified news and essential analysis across India, World affairs, Technology, AI breakthroughs, Business, and Science.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
