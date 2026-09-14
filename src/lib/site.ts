/**
 * Central site configuration.
 *
 * Single source of truth for the canonical URL and brand name so every
 * metadata block, sitemap, feed, and JSON-LD stays consistent.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://briefy.live"
).replace(/\/+$/, "");

export const SITE_NAME = "Briefy.live";

/**
 * Production mode gate.
 *
 * Mock articles in src/lib/mock-data.ts are FICTIONAL placeholder stories.
 * Serving them alongside real published articles (or as a fallback when the
 * database errors) pollutes sitemaps and feeds with non-factual content —
 * a serious Google News / E-E-A-T / spam-policy risk.
 *
 * They remain available in development (`npm run dev`) for UI work.
 */
export const IS_PRODUCTION =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_MOCK_CONTENT === "false";

/**
 * The canonical production URL as an absolute URL string, for XML feeds and
 * JSON-LD (which must be strings, not URL instances).
 */
export function siteUrl(path = "/"): string {
  if (!path.startsWith("/")) {
    return `${SITE_URL}/${path}`;
  }
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
