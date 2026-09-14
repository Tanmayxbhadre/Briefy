const STOP_WORDS = new Set([
  'about', 'after', 'against', 'also', 'and', 'are', 'been', 'before', 'being',
  'between', 'from', 'have', 'into', 'more', 'most', 'new', 'news', 'over',
  'said', 'that', 'the', 'their', 'this', 'through', 'with', 'will', 'what',
  'when', 'where', 'which', 'while', 'whose',
]);

export type SearchIntent = 'INFORMATIONAL' | 'NEWS' | 'NAVIGATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL';

export interface KeywordResearchResult {
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  searchIntent: SearchIntent;
}

function normalizePhrase(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function meaningfulWords(value: string): string[] {
  return normalizePhrase(value)
    .split(' ')
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

export function researchArticleKeywords(input: {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  categorySlug?: string | null;
}): KeywordResearchResult {
  const titleWords = meaningfulWords(input.title);
  const body = `${input.excerpt || ''} ${input.content || ''}`;
  const bodyWords = meaningfulWords(body);
  const frequencies = new Map<string, number>();

  for (const word of bodyWords) {
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  }

  const primaryKeyword = normalizePhrase(
    titleWords.slice(0, 5).join(' ') || input.categorySlug || 'news'
  );
  const titleKeywordSet = new Set(titleWords);
  const secondaryKeywords = Array.from(frequencies.entries())
    .filter(([word]) => !titleKeywordSet.has(word))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word]) => word);
  const longTailKeywords = [
    `${primaryKeyword} update`,
    `what to know about ${primaryKeyword}`,
  ].filter((keyword) => keyword.length <= 80);

  const searchIntent: SearchIntent =
    /\b(today|latest|announced|reports?|election|crisis|summit|launch(?:ed)?|update)\b/i.test(
      `${input.title} ${input.excerpt || ''}`
    )
      ? 'NEWS'
      : 'INFORMATIONAL';

  return {
    primaryKeyword,
    secondaryKeywords,
    longTailKeywords,
    searchIntent,
  };
}
