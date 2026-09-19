/**
 * Editorial Author Configuration (E-E-A-T)
 * Maps verified real journalistic bylines to bio, credentials, and social profiles.
 * If an author is unlisted, the system strictly falls back to the Organization publisher
 * (preventing fabricated author personas or fictitious bios).
 */

export interface AuthorProfile {
  name: string;
  slug: string;
  role: string;
  bio: string;
  avatarUrl?: string;
  twitter?: string;
  linkedin?: string;
  sameAs?: string[];
}

export const KNOWN_AUTHORS: Record<string, AuthorProfile> = {
  // TODO: Add real author bylines here as editorial team grows
  'tanmay-bhadre': {
    name: 'Tanmay Bhadre',
    slug: 'tanmay-bhadre',
    role: 'Editor-in-Chief',
    bio: 'Oversees editorial integrity, investigative news verification, and automated reporting systems at Briefy.live.',
    sameAs: ['https://twitter.com/tanmaybhadre'],
  },
};

/**
 * Resolves author profile for JSON-LD and page rendering.
 * Returns null if author is a generic desk or not in KNOWN_AUTHORS.
 */
export function getAuthorProfile(nameOrSlug?: string | null): AuthorProfile | null {
  if (!nameOrSlug) return null;
  const key = nameOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return KNOWN_AUTHORS[key] || null;
}
