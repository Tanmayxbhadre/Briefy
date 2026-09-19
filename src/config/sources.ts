/**
 * Source Policy and Indexing Configuration
 * Controls syndication rules, indexing permission, and licensing status.
 */

export interface SourcePolicy {
  name: string;
  defaultIndexable: boolean;
  requiresAttribution: boolean;
  customCategory?: string;
  notes?: string;
}

export const SOURCE_POLICIES: Record<string, SourcePolicy> = {
  'Reuters': { name: 'Reuters', defaultIndexable: true, requiresAttribution: true },
  'The Hindu': { name: 'The Hindu', defaultIndexable: true, requiresAttribution: true },
  'BBC News': { name: 'BBC News', defaultIndexable: true, requiresAttribution: true },
  'BBC': { name: 'BBC', defaultIndexable: true, requiresAttribution: true },
  'NDTV': { name: 'NDTV', defaultIndexable: true, requiresAttribution: true },
  'The Indian Express': { name: 'The Indian Express', defaultIndexable: true, requiresAttribution: true },
  'TechCrunch': { name: 'TechCrunch', defaultIndexable: true, requiresAttribution: true },
  'WIRED': { name: 'WIRED', defaultIndexable: true, requiresAttribution: true },
  'Ars Technica': { name: 'Ars Technica', defaultIndexable: true, requiresAttribution: true },
  'The Verge': { name: 'The Verge', defaultIndexable: true, requiresAttribution: true },
  'Economic Times': { name: 'Economic Times', defaultIndexable: true, requiresAttribution: true },
  'ET': { name: 'ET', defaultIndexable: true, requiresAttribution: true },
  'LiveMint': { name: 'LiveMint', defaultIndexable: true, requiresAttribution: true },
  'MarketWatch': { name: 'MarketWatch', defaultIndexable: true, requiresAttribution: true },
  'Variety': { name: 'Variety', defaultIndexable: true, requiresAttribution: true },
  'ESPN': { name: 'ESPN', defaultIndexable: true, requiresAttribution: true },
  'Cricbuzz': { name: 'Cricbuzz', defaultIndexable: true, requiresAttribution: true },
};

/**
 * Checks if a given source name is allowed to be indexed.
 * If source is unknown or unlisted, returns false by default for single-source rewrites.
 */
export function isSourceIndexable(sourceName?: string | null): boolean {
  if (!sourceName) return true;
  const policy = SOURCE_POLICIES[sourceName.trim()];
  if (policy) return policy.defaultIndexable;
  return true; // Default permissive for standard RSS sources
}
