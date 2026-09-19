# Comprehensive Technical SEO Overhaul — Before & After Documentation

This document summarizes the full technical SEO remediation performed across all phases for `briefy.live`.

---

## Summary of Phases & Key Changes

### Phase 0: Discovery & Baseline
- **Before**: Inconsistent canonical protocols, apex vs www conflicts, hardcoded mock filler, missing E-E-A-T schemas.
- **After**: Full audit and baseline report written to `docs/seo-baseline.md`. Identified all App Router routes, database schemas, and AI prompts.

### Phase 1: Canonical Host & Redirects
- **Before**: Canonical tags, OG URLs, and sitemaps pointed to `https://briefy.live` (apex) while pages served on `https://www.briefy.live`.
- **After**:
  - Defined single authoritative `SITE_URL = 'https://www.briefy.live'` in `src/lib/site.ts`.
  - Configured permanent single-hop 301 redirects in `next.config.ts` from `briefy.live` -> `www.briefy.live` with `trailingSlash: false`.
  - Updated all internal links, canonical tags, share links, sitemaps, RSS links, and JSON-LD `@id` references to `https://www.briefy.live`.

### Phase 2: Content Quality Pipeline & Anti-Filler
- **Before**:
  - Articles contained repetitive boilerplate filler phrases ("Multiple independent outlets confirmed core milestones", "Strategic implications expected to impact primary stakeholders").
  - Sourcing falsely claimed "Reporting verified across 1 sources" / "Multi-source verified".
  - Near-duplicate stories and off-topic affiliate content cluttered sitemaps.
- **After**:
  - Purged all filler phrases from AI generation prompts and mock fallbacks (`src/lib/ai/prompts/articleDraftPrompt.ts`, `src/lib/ai/providers/mock.ts`).
  - Created `src/config/sources.ts` with source-level indexing permissions and whitelisting.
  - Updated `src/components/article/MultiSourceAttribution.tsx` to display truthful sourcing ("Source: {Publisher}" for 1 source with direct outbound link; no false cross-verification wording).
  - Implemented `src/lib/seo/qualityGate.ts` enforcing unique word counts (min 150 unique words); thin single-source rewrites automatically assign `noindex: true` and are excluded from Google News and XML sitemaps.
  - Documented duplicate clusters in `docs/duplicate-clusters.md`.

### Phase 3: Categorization & URL Hygiene
- **Before**: Defaulted to broad or inaccurate buckets (e.g. international political events in /india, wedding gossip in /startups).
- **After**:
  - Implemented weighted multi-word keyword classifier in `src/lib/news/classifier.ts`.
  - Created `docs/categorization.md` outlining strict category boundaries.
  - Created `scripts/audit-categories.ts` and generated `docs/category-audit.csv` for editorial review without breaking existing URLs.

### Phase 4: Metadata Optimization
- **Before**:
  - Generic boilerplate meta descriptions: `"Read Briefy.live's comprehensive analysis on..."`.
  - Meta `keywords` tag stuffed on every page with generic strings.
  - Unsubstantiated claims ("India's most trusted source").
- **After**:
  - Derived unique 120–155 character article descriptions directly from factual ledes (`src/lib/seo/metadata.ts`).
  - Removed `keywords` meta tags entirely across all layouts.
  - Enforced 65-character title ceiling with smart brand suffix handling.
  - Enhanced category pages with 60–90 word unique descriptions and crisp titles in `src/lib/categories.ts`.
  - Added automated test suite `tests/seo-metadata.test.ts`.

### Phase 5: Structured Data (JSON-LD)
- **Before**: Minimal, non-compliant schemas. No author entity resolution.
- **After**:
  - Upgraded Organization schema to `NewsMediaOrganization` with links to `/editorial-policy`, `/corrections-policy`, `/masthead`, and official social profiles.
  - Configured `src/config/authors.ts` mapping verified journalists to `Person` schemas, with strict fallback to `NewsMediaOrganization` (no fabricated personas).
  - Implemented `NewsArticle` schema with `isBasedOn`/`citation` referencing original source URLs, ISO 8601 timestamps, and `SpeakableSpecification`.
  - Added `BreadcrumbList` and `CollectionPage` + `ItemList` schemas across category and topic pages.

### Phase 6: OG Images & Visual Assets
- **Before**: Article OG images referenced 240px third-party thumbnails while declaring 1200x675. Image placeholders rendered alt text like `"Briefy.liveWorld"`.
- **After**:
  - Created Edge-rendered dynamic OG generator at `/api/og` producing crisp 1200x630 branded cards.
  - Added `resolveOgImageUrl` in `src/lib/seo/metadata.ts` to upgrade BBC/Unsplash thumbnail URLs to 1200x630.
  - Cleaned placeholder alt text generation in `src/components/shared/ArticleImage.tsx`.

### Phase 7: Crawl Control, Sitemaps, Search & Topic Hubs
- **Before**: Tag chips linked directly to `/search?q=...` creating thin duplicate search pages. Sitemaps included stale items and noindex content.
- **After**:
  - Updated `src/app/robots.ts` to Disallow `/search` and `/api/` while keeping CSS/JS crawlable and referencing canonical sitemaps.
  - Configured `/search` route with `robots: { index: false, follow: true }` and self-canonical.
  - Created `/topic/[slug]` server-rendered topic archive hub route with CollectionPage JSON-LD; tags link to `/topic/[slug]` only when topic has ≥ 5 articles (otherwise render as plain chips).
  - Cleaned `src/app/sitemap.ts` to include trust pages, categories, and eligible topics while filtering out `noindex` articles.
  - Enhanced `src/app/sitemap-news.xml/route.ts` to strictly enforce ≤48h freshness, max 1000 items, and quality-gate validation.
  - Implemented crawlable `?page=N` category pagination with self-referencing canonicals in `src/app/[category]/page.tsx`.

### Phase 8: Internal Linking, On-Page & E-E-A-T Trust
- **Before**: "Related Stories" only fetched newest items in the section. Missing masthead and corrections policy.
- **After**:
  - Rewrote `getRelatedArticles` with weighted relevance scoring (shared tags, title keywords, category, recency).
  - Created `/corrections-policy`, `/masthead`, and `/author/[slug]` trust pages.
  - Added links to all trust and governance pages in `src/components/layout/Footer.tsx`.
  - Enforced uppercase "AI" section label and clean heading hierarchy across templates.

### Phase 9: Monitoring & Test Suites
- **Before**: No automated SEO validation scripts.
- **After**:
  - Created `scripts/seo-check.ts` crawling sitemaps, asserting status codes, self-canonicals, H1s, and metadata uniqueness.
  - Added `lighthouserc.json` mobile CWV budget config.
  - Created `docs/search-console-checklist.md` and `docs/perf-before-after.md`.
