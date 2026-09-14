/**
 * IndexNow & Search Engine Indexing Notification Service
 * Supported by Bing, Microsoft, Yandex, Naver, and Seznam.
 * Allows near-instant discovery of newly published articles.
 *
 * Note: Google's sitemap ping endpoint (google.com/ping?sitemap=) was
 * deprecated and retired in 2023 — it has been removed. Google discovers
 * sitemaps via robots.txt and Search Console; IndexNow covers Bing/Yandex.
 */

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'briefylive-indexnow-key-2026';

export async function submitToIndexNow(urls: string[]): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://briefy.live';

  if (!urls.length) return false;

  try {
    const host = new URL(siteUrl).hostname;
    // The key file MUST be reachable at https://<host>/{KEY}.txt — this route
    // is implemented at src/app/[key]/route.ts (any *.txt under the root).
    const keyLocation = `${siteUrl}/${INDEXNOW_KEY}.txt`;

    const payload = {
      host,
      key: INDEXNOW_KEY,
      keyLocation,
      urlList: urls.map((u) => (u.startsWith('http') ? u : `${siteUrl}${u}`)),
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urls.length} URLs to IndexNow.`);
      return true;
    } else {
      console.warn(`[IndexNow] Submission returned status ${res.status}: ${await res.text().catch(() => '')}`);
      return false;
    }
  } catch (err) {
    console.warn('[IndexNow] Notification skipped or network error:', err);
    return false;
  }
}
