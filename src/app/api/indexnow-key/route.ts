import { INDEXNOW_KEY } from '@/lib/seo/indexNow';

export const dynamic = 'force-dynamic';

/**
 * IndexNow key file handler.
 *
 * IndexNow requires the key hosted at https://<host>/{KEY}.txt. A beforeFiles
 * rewrite in next.config.ts sends /<anything>.txt here, so the key is always
 * reachable at exactly that URL and can be rotated via the INDEXNOW_KEY env
 * var without a code change. Requests for any other .txt key 404.
 *
 * (Previously the key was served at /thebrief-indexnow-key-2026.txt while
 * submissions pointed at /{KEY}.txt — a mismatch that made every submission
 * fail validation.)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedKey = (searchParams.get('key') || '').replace(/\.txt$/, '');

  if (requestedKey !== INDEXNOW_KEY) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(INDEXNOW_KEY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
