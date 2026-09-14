import { NextResponse } from 'next/server';
import { searchPublishedArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';

/**
 * Server-side article search. Backs the /search page (a client component,
 * which cannot query the database directly) so results reflect real
 * published articles instead of the mock catalog.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }
  if (q.length > 200) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  const results = await searchPublishedArticles(q);

  return NextResponse.json(
    {
      query: q,
      count: results.length,
      results: results.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        description: a.description,
        category: { name: a.category.name, slug: a.category.slug },
        author: { name: a.author.name },
        publishedAt: a.publishedAt,
        readingTime: a.readingTime,
        image: a.featuredImage,
        url: `/${a.category.slug}/${a.slug}`,
      })),
    },
    {
      headers: {
        // Search queries are unique per user — never cache.
        'Cache-Control': 'no-store',
      },
    }
  );
}
