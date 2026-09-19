# Technical SEO Baseline & Architectural Discovery (Phase 0)

**Date**: 2026-09-19  
**Branch**: `seo-overhaul`  
**Site**: Briefy.live  

---

## 1. Architectural Stack & Infrastructure

- **Framework & Router**: Next.js 16.3.3 utilizing **App Router** (`src/app/`).
- **Data Store**: CockroachDB / PostgreSQL accessed via Prisma ORM 5.22.0 (`prisma/schema.prisma`).
- **Ingestion & Automation Pipeline**:
  - Ingestion: `src/lib/news/rssFetcher.ts`, `src/lib/news/collector.ts`, `src/lib/news/jobRunner.ts`.
  - Content Normalization & Categorization: `src/lib/news/normalization.ts`, `src/lib/categories.ts`.
  - Deduplication & Clustering: `src/lib/news/clustering.ts`.
  - AI Draft Generation: `src/lib/ai/articleGenerationWorker.ts`, `src/lib/ai/service.ts`, `src/lib/ai/providers/`.
  - Auto-Publish & Quality Gate: `src/lib/ai/autoPublishWorker.ts`, `src/lib/seo/publishGate.ts`.

---

## 2. Baseline SEO State & Identified Deficiencies

| Surface / Feature | Current Implementation | Issues Identified |
|---|---|---|
| **Canonical Host & Environment** | `src/lib/site.ts` defines `SITE_URL` default as `https://briefy.live` (apex). | Apex vs `www` discrepancy (`www.briefy.live` served internally, apex declared in canonicals and sitemaps). Missing unified 301 host redirect. |
| **Robots.txt** | `src/app/robots.ts` disallows `/admin/`, `/api/`. | Allows all public routes, declares sitemaps, but `/search` is not cleanly disallowing query parameter bloat. |
| **Sitemap (`/sitemap.xml`)** | `src/app/sitemap.ts` returns a single flat list of home, categories, and published articles. | Not structured as a sitemap index; mixes topics, categories, and articles into a single list. Needs split by type and pagination safety. |
| **News Sitemap (`/sitemap-news.xml`)** | `src/app/sitemap-news.xml/route.ts` filters for <= 48h published articles. | Uses apex URL; needs strict quality gating to exclude low-word-count/affiliate rewrites. |
| **RSS Feed (`/rss.xml`)** | `src/app/rss.xml/route.ts` generates RSS 2.0 XML with apex links. | Missing `<link rel="alternate" type="application/rss+xml">` consistency; descriptions need genuine lede derivation. |
| **Homepage Metadata** | `src/app/layout.tsx` & `src/lib/seo/metadata.ts` | Title: `"Briefy.live | Serious Journalism for the Modern Reader"` (Brand-heavy). Description claims `"India's most trusted source"` (unsubstantiated superlative). Global `keywords` meta tag present. |
| **Article Content & Templates** | `ArticleBody.tsx`, `QuickSummary.tsx`, `WhatYouNeedToKnow.tsx`, `Timeline.tsx` | Heavy use of filler boilerplate phrases in AI provider prompts and mock generators (e.g., *"Multiple independent outlets confirmed core milestones"*, *"Strategic implications expected to impact primary stakeholders"*). Sourcing UI claims *"Reporting verified across 1 sources"*. |
| **Tags & Search** | `ArticleBody.tsx` lines 88-95 link tags directly to `/search?q={tag}`. | Search results pages risk indexation or soft-404 crawl waste; tags should link to real `/topic/{slug}` archives when article count threshold (>=5) is met. |
| **JSON-LD (Structured Data)** | `src/components/seo/SchemaOrg.tsx` | Renders `Organization`, `NewsMediaOrganization`, `WebSite`, `NewsArticle`, `BreadcrumbList`. Missing `isBasedOn` / `citation` source attributions; author fallback needs strict `Organization` mode without fake personas; missing `correctionsPolicy` and `publishingPrinciples` references. |
| **Open Graph & Social Images** | `src/lib/seo/metadata.ts` | OG images declared as 1200x675 even when source image is a 240px third-party thumbnail or external hotlink. Missing high-res dynamic/cached OG generation. |

---

## 3. Plan of Record for Immediate Remediation

1. **Phase 1**: Enforce `https://www.briefy.live` as canonical host across `SITE_URL`, canonicals, OG/Twitter tags, share URLs, and sitemaps. Implement Next.js 301 host redirect (apex -> www, https, trailing slash removal).
2. **Phase 2**: Strip all generic filler from generation prompts and rendering templates. Implement quality gating (<150 unique words -> `noindex, follow`). Document duplicate clusters in `docs/duplicate-clusters.md`.
3. **Phase 3**: Audit category classification rules and generate `docs/categorization.md`.
4. **Phase 4**: Implement high-fidelity metadata for Homepage, Categories, and Articles; remove `meta name="keywords"`.
5. **Phase 5**: Update JSON-LD schema with `NewsMediaOrganization`, source citations, and valid breadcrumbs.
6. **Phase 7**: Restructure `/sitemap.xml` as sitemap index; create `/topic/{slug}` hub pages for tags with >=5 articles; `noindex, follow` on `/search`.
7. **Phase 8**: Refactor internal linking (topic-based related stories), implement trust pages (`/corrections-policy`, `/masthead`), and remove unsubstantiated superlatives.
8. **Phase 9**: Add `scripts/seo-check.ts` automated crawler and Lighthouse CI configuration.
