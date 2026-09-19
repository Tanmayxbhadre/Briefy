import { SITE_CATEGORIES } from '../src/lib/categories';
import { categoryMetadata, homeMetadata, articleMetadata } from '../src/lib/seo/metadata';
import { mockArticles } from '../src/lib/mock-data';
import { brandedTitle } from '../src/lib/site';

describe('SEO Metadata Constraints & Quality Rules', () => {
  const BANNED_BOILERPLATE = [
    /read briefy\.live's comprehensive analysis/i,
    /india's most trusted source/i,
    /strategic implications expected to impact primary stakeholders/i,
    /multiple independent outlets confirmed core milestones/i,
    /operational rollouts scheduled over the coming quarter/i,
  ];

  test('Homepage title and description adhere to character length and keyword requirements', () => {
    const title = typeof homeMetadata.title === 'object' && 'absolute' in homeMetadata.title
      ? (homeMetadata.title.absolute as string)
      : String(homeMetadata.title || '');

    const description = String(homeMetadata.description || '');

    expect(title.length).toBeLessThanOrEqual(65);
    expect(title).toContain('Briefy.live');
    expect(description.length).toBeGreaterThanOrEqual(100);
    expect(description.length).toBeLessThanOrEqual(160);

    for (const banned of BANNED_BOILERPLATE) {
      expect(banned.test(description)).toBe(false);
      expect(banned.test(title)).toBe(false);
    }
  });

  test('All category metadata entries have unique, length-compliant titles and descriptions without boilerplate', () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const cat of SITE_CATEGORIES) {
      const meta = categoryMetadata(cat, true);
      const title = typeof meta.title === 'object' && 'absolute' in meta.title
        ? (meta.title.absolute as string)
        : String(meta.title || '');

      const description = String(meta.description || '');

      // Title assertions
      expect(title.length).toBeLessThanOrEqual(65);
      expect(titles.has(title)).toBe(false);
      titles.add(title);

      // Description assertions
      expect(description.length).toBeGreaterThanOrEqual(100);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(descriptions.has(description)).toBe(false);
      descriptions.add(description);

      // Banned phrases check
      for (const banned of BANNED_BOILERPLATE) {
        expect(banned.test(title)).toBe(false);
        expect(banned.test(description)).toBe(false);
      }
    }
  });

  test('Article metadata generator strips boilerplate and caps titles within 65 characters', () => {
    for (const article of mockArticles) {
      const meta = articleMetadata(article);
      const title = typeof meta.title === 'object' && 'absolute' in meta.title
        ? (meta.title.absolute as string)
        : String(meta.title || '');

      const description = String(meta.description || '');

      expect(title.length).toBeLessThanOrEqual(65);
      expect(description.length).toBeLessThanOrEqual(160);

      for (const banned of BANNED_BOILERPLATE) {
        expect(banned.test(description)).toBe(false);
      }
    }
  });

  test('brandedTitle utility accurately trims and suffixes brand while obeying 65 char ceiling', () => {
    const shortHeadline = 'RBI Holds Benchmark Repo Rate';
    expect(brandedTitle(shortHeadline)).toBe('RBI Holds Benchmark Repo Rate | Briefy.live');
    expect(brandedTitle(shortHeadline).length).toBeLessThanOrEqual(65);

    const longHeadline = 'Government Announces Nationwide High-Speed Optical Fiber Infrastructure Overhaul Across 500 Districts';
    const branded = brandedTitle(longHeadline);
    expect(branded.length).toBeLessThanOrEqual(65);
  });
});
