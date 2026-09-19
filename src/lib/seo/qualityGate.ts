/**
 * Content Quality Gate & Indexability Evaluator
 * Ensures thin rewrites (< 150 unique words, missing lede, or unapproved sources)
 * receive noindex, follow and are excluded from Google News / standard sitemaps.
 */

import { isSourceIndexable } from '../../config/sources';
import { Source } from '../types';

export const MIN_UNIQUE_WORDS_FOR_INDEXING = parseInt(
  process.env.MIN_UNIQUE_WORDS_INDEX || '150',
  10
);

export interface QualityEvaluation {
  indexable: boolean;
  uniqueWordCount: number;
  totalWordCount: number;
  reason?: string;
  sourceCount: number;
}

export function computeUniqueWordCount(content: string): number {
  if (!content) return 0;
  // Remove markdown symbols and extra punctuation
  const clean = content
    .replace(/[#*`_>\[\]\(\)]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');

  const words = clean.split(/\s+/).filter((w) => w.length > 2);
  const unique = new Set(words);
  return unique.size;
}

export function evaluateArticleQuality(article: {
  title?: string | null;
  excerpt?: string | null;
  content?: string | null;
  sources?: string | Source[] | null;
}): QualityEvaluation {
  const content = article.content || '';
  const title = article.title || '';
  const excerpt = article.excerpt || '';

  const totalWords = content.split(/\s+/).filter(Boolean).length;
  const uniqueWordCount = computeUniqueWordCount(content);

  let sourcesList: Source[] = [];
  try {
    if (typeof article.sources === 'string') {
      sourcesList = JSON.parse(article.sources);
    } else if (Array.isArray(article.sources)) {
      sourcesList = article.sources;
    }
  } catch {
    sourcesList = [];
  }

  const sourceCount = sourcesList.length;
  const primarySource = sourcesList[0]?.name;

  // 1. Check source whitelist
  if (primarySource && !isSourceIndexable(primarySource)) {
    return {
      indexable: false,
      uniqueWordCount,
      totalWordCount: totalWords,
      sourceCount,
      reason: `Source "${primarySource}" is not whitelisted for indexing.`,
    };
  }

  // 2. Minimum unique word count gate (< 150 unique words)
  if (uniqueWordCount < MIN_UNIQUE_WORDS_FOR_INDEXING) {
    return {
      indexable: false,
      uniqueWordCount,
      totalWordCount: totalWords,
      sourceCount,
      reason: `Unique word count (${uniqueWordCount}) is below quality threshold (${MIN_UNIQUE_WORDS_FOR_INDEXING}).`,
    };
  }

  // 3. Factual Lede check (must have meaningful opening context)
  if (!excerpt.trim() || excerpt.trim().length < 30) {
    return {
      indexable: false,
      uniqueWordCount,
      totalWordCount: totalWords,
      sourceCount,
      reason: 'Article lacks an informative factual lede excerpt.',
    };
  }

  // 4. Headline check
  if (!title.trim() || title.trim().length < 15) {
    return {
      indexable: false,
      uniqueWordCount,
      totalWordCount: totalWords,
      sourceCount,
      reason: 'Headline is too short or missing.',
    };
  }

  return {
    indexable: true,
    uniqueWordCount,
    totalWordCount: totalWords,
    sourceCount,
  };
}
