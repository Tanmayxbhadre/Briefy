import { revalidatePath, revalidateTag } from 'next/cache';
import { submitToIndexNow } from '../seo/indexNow';
import { getAllCategorySlugs } from '../articles';
import { SITE_URL } from '../site';

interface RevalidateOptions {
  categorySlug?: string | null;
  slug?: string | null;
}

/**
 * Centralized cache revalidation service for Briefy news publishing pipeline.
 * Ensures immediate synchronization across Homepage, all Category Feeds, RSS,
 * and Sitemaps, plus instant IndexNow submission for Bing/Yandex.
 *
 * Categories are read from the database (via getAllCategorySlugs) so newly
 * created categories are always revalidated — previously this list was
 * hardcoded and new categories were never refreshed.
 */
export async function revalidateNewsPublication(options: RevalidateOptions = {}) {
  try {
    // 1. Revalidate Core Public Feeds & Homepage
    revalidatePath('/');
    revalidatePath('/daily-news');
    revalidatePath('/search');
    revalidatePath('/rss.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/sitemap-news.xml');

    // 2. Revalidate ALL Category Pages (DB-driven, includes newly created ones)
    const categorySlugs = await getAllCategorySlugs();
    for (const catSlug of categorySlugs) {
      revalidatePath(`/${catSlug}`);
    }

    if (options.categorySlug && !categorySlugs.includes(options.categorySlug)) {
      revalidatePath(`/${options.categorySlug}`);
    }

    // 3. Revalidate Specific Article Route
    if (options.categorySlug && options.slug) {
      revalidatePath(`/${options.categorySlug}/${options.slug}`);
    }

    // 4. Invalidate tagged Next.js cache segments. The two-argument form is
    // the current API (the single-argument form is deprecated in Next 16);
    // these tags are only assigned if 'use cache'/fetch tags exist.
    const tags = ['news', 'homepage', 'articles', 'categories', 'breaking'];
    for (const tag of tags) {
      try {
        revalidateTag(tag, 'max');
      } catch {
        // Tag not assigned to any cached data — safe to ignore.
      }
    }

    console.log(
      `[CacheRevalidation] Successfully revalidated feeds for category=${options.categorySlug || 'all'}, slug=${options.slug || 'all'}`
    );

    // 5. Asynchronously trigger search engine indexing (IndexNow). Google
    // discovers updates via sitemaps; its ping endpoint was retired in 2023.
    const siteUrl = SITE_URL;
    const urlsToIndex = [`${siteUrl}/`];

    if (options.categorySlug) {
      urlsToIndex.push(`${siteUrl}/${options.categorySlug}`);
    }
    if (options.categorySlug && options.slug) {
      urlsToIndex.push(`${siteUrl}/${options.categorySlug}/${options.slug}`);
    }

    // Run in background without blocking response
    submitToIndexNow(urlsToIndex).catch((err) => {
      console.warn('[CacheRevalidation] Background IndexNow submission error:', err);
    });
  } catch (error) {
    console.warn('[CacheRevalidation] Warning during cache revalidation:', error);
  }
}
