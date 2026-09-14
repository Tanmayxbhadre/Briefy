# Briefy.live SEO audit and implementation plan

## Scope and current architecture

Briefy is a Next.js 16 application with the App Router, React 19, TypeScript,
Prisma 5, and PostgreSQL. News ingestion creates `NewsItem` records, editorial
and AI workflows create `ArticleDraft` records, and publication is performed
through protected admin routes. `ArticleDraft` is the canonical source for
published article content and already contains SEO title, meta description,
slug, canonical URL, image alt text, tags, sources, and publication state.

## Existing SEO functionality

- Root and article metadata with canonical, Open Graph, Twitter, publication,
  modification, author, section, and image fields.
- Central site URL configuration in `src/lib/site.ts`.
- Dynamic XML sitemap, Google News sitemap, `robots.txt`, and RSS.
- Organization, WebSite, NewsArticle, and Breadcrumb JSON-LD.
- IndexNow submission and cache revalidation after publication.
- Deterministic SEO optimizer and an admin SEO audit endpoint.
- Publication-time validation, source attribution, AI quality scoring, and
  editorial review states.
- Related-story rendering and category-based navigation.

## Gaps and risks found

1. SEO recommendations were calculated transiently and were not persisted as a
   versioned, queryable editorial record.
2. Keyword extraction and search-intent classification were not available.
3. Draft create, editor update, and AI draft paths did not share one SEO
   processing hook.
4. Search Console, trend, analytics, broken-link, and Core Web Vitals data are
   not connected; dashboards must not invent those metrics.
5. The bulk draft publish endpoint has less validation than the single publish
   endpoint and should be hardened before unattended bulk publication.
6. Sitemap and feeds depend on database availability and need deployment
   monitoring and XML validation.
7. The local `.env` uses a SQLite URL while Prisma is configured for PostgreSQL;
   database-backed tests and builds require a valid PostgreSQL environment.
8. A single canonical host must be selected at deployment. Conflicting Vercel
   and application redirects previously caused a production redirect loop.

## Phase 1 and 2 delivered

- Added the normalized `ArticleSEO` model and PostgreSQL migration. It stores
  keywords, intent, optimized fields, score categories, image text, status, and
  optimization timestamps.
- Added deterministic keyword research with one primary keyword, secondary and
  long-tail suggestions, and conservative informational/news intent
  classification. It does not claim search volume or trend data.
- Added `optimizeAndPersistArticleSeo`, which runs the existing optimizer and
  audit, then upserts the SEO profile.
- Wired the service into manual draft creation, editor updates, and AI draft
  creation. A failed SEO persistence operation is surfaced as an API error.
- Added documented feature flags for future approved trend and Search Console
  integrations.

## Required database changes

Apply the migration with `prisma migrate deploy` in each environment after
confirming `DATABASE_URL` points to PostgreSQL. For a local Homebrew setup,
install PostgreSQL, create a `briefy` role and database, then set
`DATABASE_URL` using the example in `.env.example`. The migration is additive and
uses a one-to-one relation from `ArticleSEO` to `ArticleDraft`; deleting a
draft cascades to its SEO profile.

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s briefy
createdb -O briefy briefy
npx prisma migrate deploy
```

If the role or database already exists, keep the existing credentials and only
update `DATABASE_URL`; do not commit local credentials.

## Recommended implementation order

1. Apply and monitor the additive SEO profile migration (completed in this
   phase).
2. Add reviewable SEO issue and optimization-history records, then expose
   history in the admin editor.
3. Harden bulk publication to run the same critical source, metadata, and
   duplicate checks as single publication.
4. Add internal-link suggestions and topic-cluster persistence with editorial
   approval.
5. Add approved trend and Search Console adapters behind feature flags. Store
   provider, retrieval timestamp, geography, language, and confidence; never
   label estimates as Google volume.
6. Add performance and indexing monitoring with explicit “data unavailable”
   states.
7. Add controlled refresh recommendations and reversible editorial changes.

## Deployment and validation risks

- Run Prisma generation and the migration against PostgreSQL before deploying
  routes that write `ArticleSEO`.
- Keep `SEO_AUTO_OPTIMIZE_DRAFTS` enabled only after migration verification.
- External OAuth/API credentials must remain server-side and be rotated if
  exposed.
- SEO scores are editorial diagnostics, not ranking predictions.
- No automated path should publish content with missing source attribution,
  factual review flags, or critical audit failures.
