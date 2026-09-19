# Google Search Console & Bing Webmaster Tools Launch Checklist

## 1. Domain Property Verification
- [ ] **Google Search Console**: Verify `briefy.live` as a **Domain property** (via DNS TXT record `google-site-verification=...`).
- [ ] **Bing Webmaster Tools**: Import from GSC or verify via DNS / meta tag.
- [ ] Ensure DNS records point `briefy.live` and `www.briefy.live` to the hosting ingress where the 301 redirect to `https://www.briefy.live` is enforced.

## 2. Sitemap Submission
- [ ] Submit Sitemap Index: `https://www.briefy.live/sitemap.xml`
- [ ] Submit Google News Sitemap: `https://www.briefy.live/sitemap-news.xml`
- [ ] Verify both sitemaps return HTTP 200 with 0 parsing errors in GSC Sitemaps tab.

## 3. URL Inspection Baseline
- [ ] Inspect Homepage: `https://www.briefy.live/`
  - Assert User-declared canonical = `https://www.briefy.live/`
  - Assert Google-selected canonical = `https://www.briefy.live/`
- [ ] Inspect Category Page: `https://www.briefy.live/technology`
- [ ] Inspect Published News Article: `https://www.briefy.live/india/...`
  - Test Live URL -> View Rich Results -> Confirm `NewsArticle`, `BreadcrumbList`, and `NewsMediaOrganization` are detected without errors.

## 4. Indexing & Coverage Monitoring
Check GSC Page Indexing reports weekly for the following buckets:
- **Duplicate without user-selected canonical**: Should be 0 (every page now declares self-referencing canonical on `https://www.briefy.live`).
- **Duplicate, Google chose different canonical**: Should be 0 (apex `https://briefy.live` 301 redirects immediately to `https://www.briefy.live`).
- **Crawled – currently not indexed**: Check for low-word-count or thin single-source rewrites. Any low-quality items are now systematically gated with `noindex, follow` to protect site-wide crawl budget and domain authority.
- **Discovered – currently not indexed**: Monitor feed crawl velocity. IndexNow pings Bing/Yandex on every publish.

## 5. Google Publisher Center Application
- [ ] Apply to Google Publisher Center only after Phase 2 content quality gates and Phase 8 E-E-A-T trust pages (`/editorial-policy`, `/corrections-policy`, `/masthead`, `/contact`) are live with verified journalist bylines in `src/config/authors.ts`.
- [ ] Submit News RSS feed: `https://www.briefy.live/rss.xml`
- [ ] Submit Publication Logo: 512x512 PNG square (`https://www.briefy.live/favicon.png`) and 600x60 wide logo.
