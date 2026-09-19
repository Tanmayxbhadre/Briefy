// ============================================================
// Briefy — Utility Functions
// ============================================================

import { SITE_URL } from './site';

/**
 * Calculate estimated reading time from content string.
 * Average reading speed: ~238 wpm
 */
export function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 238);
  return Math.max(1, minutes);
}

/**
 * Format a date string to a readable format.
 * e.g. "August 31, 2026"
 */
export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date string to a short readable format.
 * e.g. "Aug 31, 2026"
 */
export function formatDateShort(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a time string.
 * e.g. "10:42 AM"
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Return a human-friendly relative time.
 * e.g. "2 hours ago", "just now", "3 days ago"
 */
export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDateShort(dateInput);
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Truncate a string on word boundaries with an ellipsis.
 * Prevents mid-word cuts (e.g. "ac...", "we...").
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  const sliced = clean.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');

  // Cut at last space if it covers at least 50% of maxLength
  const cut = lastSpace > maxLength * 0.5 ? sliced.slice(0, lastSpace) : sliced;
  // Clean trailing punctuation
  const trimmed = cut.replace(/[\s,;:.!?-]+$/, '');
  return `${trimmed}…`;
}

/**
 * Deduplicate items (articles) by canonical slug and id.
 */
export function deduplicateArticles<T extends { slug: string; id?: string }>(articles: T[]): T[] {
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();
  const result: T[] = [];

  for (const article of articles) {
    if (!article || !article.slug) continue;
    const canonicalSlug = article.slug.trim().toLowerCase();
    const id = article.id;

    if (seenSlugs.has(canonicalSlug)) continue;
    if (id && seenIds.has(id)) continue;

    seenSlugs.add(canonicalSlug);
    if (id) seenIds.add(id);
    result.push(article);
  }

  return result;
}

/**
 * Get a canonical URL for the site.
 */
export function getCanonicalUrl(path: string = ''): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return path ? `${SITE_URL}${normalizedPath}` : SITE_URL;
}

/**
 * Format reading time for display.
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
