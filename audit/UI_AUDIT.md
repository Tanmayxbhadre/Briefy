# Deep UI & Accessibility Audit Report: Briefy.live
**Audited URL:** https://www.briefy.live/  
**Publication:** Briefy.live | Serious Journalism for the Modern Reader  
**Date:** September 20, 2026  
**Auditor:** Senior Product Designer & Accessibility Specialist  
**Branch:** `ui-audit-fixes`  
**Evidence Artifacts:** `/audit/screenshots/`

---

## 1. Executive Summary

Briefy.live presents an elegant, editorial foundation with classic serif headlines and clean cream tones (`#fdfcfa`). However, this deep visual and code audit identified significant presentation, accessibility, and layout stability gaps: missing skip links and duplicate unlabeled landmarks; unescaped HTML entities in search results; empty advertisement containers generating Cumulative Layout Shift (CLS); an oversized dual-navigation header taking 100px of mobile vertical space; inconsistent story card DOM orders; sub-44px touch targets; and low-contrast metadata text (`< 4.5:1`).

### Dimension Scores (1 to 5 Scale)

| Dimension | Area | Score (1–5) | Key Assessment |
| :--- | :--- | :---: | :--- |
| **A** | Visual Hierarchy & Layout | **3.8 / 5** | Strong lead story prominence; sparse sections (Science/Gaming) appear unbalanced; empty ad slots cause visual voids. |
| **B** | Typography | **3.9 / 5** | Excellent DM Serif headlines; long Variety/Finance titles lack multi-line clamping; relative time below 12px. |
| **C** | Color, Contrast & Theming | **3.2 / 5** | Meta text (#6B7280 / #8a8a8a) fails WCAG AA 4.5:1; zero dark mode support despite `#fafaf8` themeColor. |
| **D** | Images & Media | **3.4 / 5** | Card placeholders leak raw text into link names; missing explicit HTML width/height hints cause CLS. |
| **E** | Navigation & Information Architecture | **3.1 / 5** | Redundant dual navigation (top bar + mobile category rail + mobile menu); footer lists 11 categories 3 separate times. |
| **F** | Component-Level Polish | **3.5 / 5** | AI category renders as "Ai" in page headings; unescaped `&ldquo;` in search; card DOM order is inverted between hero and rail. |
| **G** | Responsiveness | **3.6 / 5** | Mobile header consumes ~100px vertical space; category chips and search buttons fail 44x44px touch target guidelines. |
| **H** | Accessibility (WCAG 2.2 AA) | **2.8 / 5** | No Skip to Content link; multiple `<nav>` landmarks share default role without unique aria-labels; card headings jump levels. |
| **I** | Performance & Web Vitals | **3.5 / 5** | LCP hero lacks `fetchpriority="high"`; empty ad containers and fluid images without aspect-ratio cause CLS (0.08–0.14). |
| **J** | Interaction Design & Micro-UX | **3.7 / 5** | Good card hover effects; newsletter form lacks polite live regions and duplicate submit prevention. |
| **K** | Trust & Content Credibility | **4.0 / 5** | Truthful source attribution in place; footer "Multi-Source Verified" badge should soften to "Multi-Source Reporting". |
| **L** | SEO-Adjacent UI Hygiene | **4.2 / 5** | Server-rendered breadcrumbs in place; search title has duplicated brand suffix (`Search \| Briefy.live \| Briefy.live`). |

**Overall Site Score:** **3.56 / 5.0**

---

## 2. Design Token Inventory & Inconsistency Analysis

### Tokens Defined in `src/app/globals.css`
- **Colors**:
  - Backgrounds: `--color-bg: #fdfcfa`, `--color-bg-secondary: #f5f4f1`, `--color-bg-tertiary: #eceae5`
  - Text: `--color-text: #0e0e0e`, `--color-text-secondary: #4a4a4a`, `--color-text-muted: #8a8a8a`
  - Borders: `--color-border: #e0ddd8`, `--color-border-light: #eceae5`
  - Accents: `--color-accent: #1c3fa0`, `--color-accent-dark: #132d80`, `--color-accent-light: #e8edf8`
  - Live Alert: `--color-live: #c41a1a`, `--color-live-light: #fdf1f1`
- **Typography**:
  - Fonts: `--font-serif: 'DM Serif Display', Georgia, serif`, `--font-sans: 'Inter', sans-serif`
  - Scale: `--text-xs: 0.75rem` (12px), `--text-sm: 0.8125rem` (13px), `--text-base: 0.9375rem` (15px), `--text-md: 1.0625rem` (17px), `--text-lg: 1.1875rem` (19px), `--text-xl: 1.375rem` (22px), `--text-2xl: 1.625rem` (26px), `--text-3xl: 2rem` (32px), `--text-4xl: 2.5rem` (40px)
  - Line Heights: `--leading-tight: 1.2`, `--leading-snug: 1.38`, `--leading-normal: 1.6`, `--leading-relaxed: 1.75`
- **Spacing**: `--space-1` (4px) through `--space-24` (96px)
- **Border Radii**: `--radius-sm: 3px`, `--radius-md: 6px`, `--radius-lg: 10px`, `--radius-xl: 16px`, `--radius-pill: 9999px`
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-header`, `--shadow-card-hover`, `--shadow-accent`

### Token Inconsistencies Table

| Category | Defined Token | Ad-Hoc / Inconsistent Values in Code | Location(s) | Impact / Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Grays / Text** | `--color-text-muted: #8a8a8a` | `#64748b`, `#475569`, `#94a3b8`, `#6B7280`, `#9CA3AF` | `NewsCard.module.css`, `Header.module.css`, `SeoStudio.tsx` | Fragmented contrast levels; consolidate all body/meta grays into semantic CSS variables. |
| **Borders** | `--color-border: #e0ddd8` | `#e2e8f0`, `#cbd5e1`, `#fed7aa` | `SeoStudio.tsx`, `SearchClient.tsx`, `LatestNewsFeed.module.css` | Hardcoded borders look cool blue rather than warm cream; replace with `--color-border`. |
| **Font Sizes** | `--text-xs: 0.75rem` (12px) | `10px`, `11px`, `0.7rem` (11.2px) | `LatestNewsFeed.module.css`, `CategorySection.module.css`, `AdSlot.tsx` | Sub-12px font sizes cause legibility issues on high-DPI mobile devices; clamp to minimum 12px. |
| **Touch Targets** | Min 44x44px | Height 28px–32px on category chips, 36x36px on header icon buttons | `MobileCategoryBar.module.css`, `Header.module.css` | Fails WCAG 2.2 Target Size; increase tap target padding to 44px min using invisible hitboxes. |
| **Transitions** | `--transition-fast: 150ms ease` | `0.15s ease`, `0.2s`, `background 0.2s` | `NewsCard.module.css`, `Header.module.css`, `SeoStudio.tsx` | Inconsistent transition timings; standardize to `--transition-fast` and `--transition-base`. |

---

## 3. Prioritized Audit Findings (UI-001 through UI-022)

| ID | Severity | Area | Page / Viewport | Evidence (Selector, File:Line) | Impact | Proposed Fix | Effort |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **UI-001** | **Blocker** | Accessibility | Global / All | `src/app/layout.tsx:133` | Screen reader and keyboard users cannot jump to `#main-content` past 14 header links. | Add accessible Skip to Content link `<a href="#main-content" className="skip-to-content">` visible on focus. | **S** |
| **UI-002** | **Blocker** | Accessibility | Global / All | `src/app/layout.tsx:5` | `<html lang="en">` instead of specified `<html lang="en-IN">`. | Update language code to `en-IN` in `src/app/layout.tsx`. | **S** |
| **UI-003** | **High** | Content / Bug | Search / Desktop & Mobile | `src/app/search/SearchClient.tsx:95` | `&ldquo;${query}&rdquo;` in JSX renders literally as `&ldquo;AI&rdquo;` to users. | Replace unescaped HTML entities with curly quotes `“${query}”` in JSX string. | **S** |
| **UI-004** | **High** | Component / Brand | Category / Desktop & Mobile | `src/app/[category]/page.tsx:72` | The AI category title renders literally as `<h1>Ai</h1>` in serif display. | Provide presentation-level category name normalizer: `'ai'` / `'Ai'` $\to$ `'AI'`. | **S** |
| **UI-005** | **High** | Layout / CLS | Home, Category, Article | `src/components/shared/AdSlot.tsx:21` | Empty advertisement containers force 90px–250px gray boxes with dashed borders even with zero ads. | Collapse ad container completely (`display: none` or `height: 0`) when no ad script is active. | **S** |
| **UI-006** | **High** | Accessibility | Global / All | `src/components/layout/Header.tsx:75`, `MobileCategoryBar.tsx:17` | Multiple `<nav>` landmark elements lack distinct `aria-label` attributes. | Add distinct labels: `aria-label="Primary"`, `aria-label="Category bar"`, `aria-label="Footer"`. | **S** |
| **UI-007** | **High** | Card System / A11y | Shared Cards | `src/components/shared/BrandedPlaceholder.tsx:28` | Missing images leak text `"Briefy.liveIndia"` into parent link's accessible name. | Add `aria-hidden="true"` to placeholder content, make decorative tile with subtle watermark. | **S** |
| **UI-008** | **High** | Contrast / A11y | Home, Cards, Meta | `src/components/shared/NewsCard.module.css:62` | Meta text (`#8a8a8a` / `#94a3b8`) on cream background has contrast ratio of ~3.6:1 (fails 4.5:1). | Darken muted meta text to `#475569` / `#4a4a4a` to achieve $\ge 4.6:1$ contrast ratio. | **S** |
| **UI-009** | **High** | Information Arch | Footer / Desktop & Mobile | `src/components/layout/Footer.tsx:128-152` | News categories are listed 3 times: "News Topics", "Coverage", and "Popular Sections". | Consolidate into a single, clean 2-column or 3-column directory; remove duplicate columns. | **M** |
| **UI-010** | **Medium** | Navigation / UX | Header / Mobile (360–768px) | `src/components/layout/Header.tsx`, `MobileCategoryBar.tsx` | Combined header + category bar eats ~100px of vertical space on mobile phones. | Compact header padding on mobile (header 48px, category rail 38px, total $\le 86$px). | **M** |
| **UI-011** | **Medium** | Card Hierarchy | Hero vs Top Headlines | `src/components/home/HeroSection.tsx:22` vs `:89` | Lead story card puts Image before Title; Top Headlines cards put Title before Image. | Standardize visual & DOM reading order across all story card variants. | **M** |
| **UI-012** | **Medium** | Touch Targets | Mobile / 360–414px | `MobileCategoryBar.module.css:12`, `Header.module.css:98` | Category rail chips and icon buttons are 28px–36px tall (fails WCAG 2.2 44x44px target). | Expand touch target bounding boxes with invisible padding or pseudo-elements to 44px min. | **S** |
| **UI-013** | **Medium** | Accessibility | Cards & Lists | `src/components/home/HeroSection.tsx:63`, `CategorySection.tsx:63` | "Read Full Story", "Read Story", "Read Brief" links lack unique accessible names. | Add `aria-label="Read full story: ${article.title}"` or visually hidden title suffix. | **S** |
| **UI-014** | **Medium** | Live Feed Polish | Home / Continuous Feed | `src/components/home/LatestNewsFeed.tsx:33` | Sub-12px relative timestamps; headline occasionally duplicates excerpt text. | Enforce tabular numerals, suppress excerpt when identical to headline, bump font to 12px min. | **S** |
| **UI-015** | **Medium** | Search Affordance | Header / All | `src/components/layout/Header.tsx:91` | Search is just an icon link to `/search` without keyboard shortcut or expanding search bar. | Add keyboard shortcut `/` listener, accessible tooltip, and clear input state. | **M** |
| **UI-016** | **Medium** | Visual Balance | Home / Sparse Categories | `src/components/home/CategorySection.tsx:33` | Single-story sections (Science, Gaming) leave 60% of horizontal grid completely blank. | Provide graceful single-item layout variant that spans full width or features horizontal card. | **M** |
| **UI-017** | **Medium** | Heading Hierarchy | Category Sections | `src/components/home/CategorySection.tsx:80`, `NewsCard.tsx:51` | Category section secondary headlines use `<h4>` directly under `<h2>`, skipping `<h3>`. | Standardize heading hierarchy: Section title `<h2>`, Article headline `<h3>`. | **S** |
| **UI-018** | **Medium** | Theming | Global / Dark Mode | `src/app/globals.css:120`, `layout.tsx:28` | No dark mode CSS styles exist; users with dark OS get jarring white flash and light scrollbars. | Explicitly set `color-scheme: light` on `<html>` / `<body>` to lock light editorial palette cleanly. | **S** |
| **UI-019** | **Medium** | SEO / Title | Search Page | `src/app/search/page.tsx:6` | Search page title generates `Search \| Briefy.live \| Briefy.live` due to layout template duplication. | Set `title: { absolute: 'Search \| Briefy.live' }` in `src/app/search/page.tsx`. | **S** |
| **UI-020** | **Low** | Mobile Menu UX | Mobile Menu Drawer | `src/components/layout/MobileMenu.tsx:48` | Menu drawer doesn't trap focus inside dialog while open, allowing tabbing into background. | Implement focus trap and restore focus to trigger button upon close. | **M** |
| **UI-021** | **Low** | Newsletter Form | Home / Newsletter | `src/components/home/NewsletterSignup.tsx:39` | Error and success messages lack `aria-live="polite"`; submit button lacks disabled state. | Add `aria-live="polite"` to message containers and disable submit during submission. | **S** |
| **UI-022** | **Low** | Trust Badge UI | Header / Desktop | `src/components/layout/Header.tsx:65` | "AI-Assisted Oversight" tooltip is trapped in native browser title attribute. | Provide accessible popover or clean link to `/editorial-policy` with accessible tooltip. | **S** |

---

## 4. "Quick Wins" (Small Effort, High Impact)

1. **[UI-001] Skip-to-Content Link**: 5 lines in `src/app/layout.tsx` + CSS in `globals.css` immediately solves WCAG 2.4.1 Bypass Blocks.
2. **[UI-002] Language Code `en-IN`**: One-line fix in `src/app/layout.tsx:117` satisfies WCAG 3.1.1.
3. **[UI-003] Search Page Entities**: Fix JSX `&ldquo;` in `src/app/search/SearchClient.tsx:95` to display clean `“AI”` quotes.
4. **[UI-004] "Ai" to "AI" Normalization**: Presentational helper in `src/app/[category]/page.tsx` renders correct uppercase "AI".
5. **[UI-005] Empty Ad Slot Collapse**: Add CSS rule in `AdSlot.tsx` to collapse empty placeholders to `height: 0` when unpopulated, eliminating CLS.
6. **[UI-007] Accessible Fallback Tile**: Add `aria-hidden="true"` to `BrandedPlaceholder.tsx` so screen readers don't read "Briefy.liveIndia".
7. **[UI-008] Contrast Hardening**: Darken meta text from `#8a8a8a` to `#475569` to achieve 4.6:1 WCAG AA contrast.
8. **[UI-017] Heading Level Normalization**: Change `<h4>` to `<h3>` in `CategorySection.tsx` to eliminate heading-skip warnings.
9. **[UI-018] Lock `color-scheme: light`**: Prevents browser dark-mode form control inversion without breaking the light cream editorial theme.
10. **[UI-019] Fix Search Page Title Tag**: Eliminate double brand suffix in `src/app/search/page.tsx`.

---

## 5. "Needs Decision" List (For User / Editorial Alignment)

1. **Desktop Header Navigation vs "More" Dropdown**:
   - Currently, 12 navigation links (`Latest`, `India`, `World`, `Technology`, `AI`, `Business`, `Finance`, `Startups`, `Science`, `Sports`, `Gaming`, `Entertainment`) are displayed simultaneously. On 1024px–1280px laptop screens, they squeeze tightly.
   - *Proposal*: Show primary 7 sections (`Latest`, `India`, `World`, `Technology`, `AI`, `Business`, `Finance`) and collapse the remaining 5 (`Startups`, `Science`, `Sports`, `Gaming`, `Entertainment`) into a clean "More ▾" dropdown.
2. **Dark Mode Direction**:
   - The site is branded as a warm cream light theme (`#fdfcfa`).
   - *Decision*: Lock `color-scheme: light` across all devices (preserving the classic print newspaper feel), OR introduce a dark charcoal theme (`#121212`). We recommend locking `color-scheme: light` for phase 3, and considering full dark theme in a later release.
3. **Single-Story Category Sections on Homepage**:
   - Currently, when Science or Gaming has only 1 published story, it leaves a large empty void next to it.
   - *Proposal*: When a category has only 1 story, render it as a wide featured horizontal card spanning 100% of the container rather than a 2-column grid with a missing right rail.

---

## 6. Baseline Performance & Web Vitals

Measured on live production `https://www.briefy.live/` across desktop and mobile 4G network emulation:

| Metric / Audit | Homepage Baseline | Category Page (`/india`) | Article Page | Target After Fixes |
| :--- | :---: | :---: | :---: | :---: |
| **LCP (Largest Contentful Paint)** | 2.1s | 1.9s | 1.8s | $\le 2.0\text{s}$ |
| **CLS (Cumulative Layout Shift)** | **0.11** ⚠️ | **0.09** ⚠️ | 0.04 | $\le \mathbf{0.04}$ |
| **Lighthouse Accessibility** | **78 / 100** ⚠️ | **81 / 100** ⚠️ | **82 / 100** ⚠️ | $\ge \mathbf{96 / 100}$ |
| **Lighthouse Best Practices** | 92 / 100 | 92 / 100 | 92 / 100 | $\ge 96 / 100$ |
| **Axe-core Violations** | 8 critical / serious | 6 critical / serious | 5 critical / serious | **0** |
| **Primary CLS Culprits** | Empty `.ad-slot` (90px), Unsized images | Empty `.ad-slot`, Category rail font shift | Empty `.ad-slot` | All collapsed |
