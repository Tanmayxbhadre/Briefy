# Editorial Categorization & URL Hierarchy Guidelines (Phase 3)

**Date**: 2026-09-19  
**Branch**: `seo-overhaul`  
**Site**: Briefy.live  

---

## 1. Unified Category Hierarchy

All content on Briefy.live is organized into 11 canonical top-level sections. Each section has strict semantic boundaries to prevent cross-domain pollution:

| Section Slug | Section Name | Scope & Inclusion Criteria | Exclusions & Disambiguation |
|---|---|---|---|
| `/india` | India | Indian national politics, Parliament (Lok Sabha/Rajya Sabha), Supreme Court, state assembly developments, domestic governance, and public affairs. | Foreign diplomatic relations between other non-India nations (belongs in `/world`). |
| `/world` | World | Geopolitics, international diplomacy, war/conflict, foreign elections, United Nations, global treaties, and bilateral relations. | Indian domestic issues without primary international bearing. |
| `/technology` | Technology | Big tech platforms, hardware, consumer electronics, cybersecurity, operating systems, internet policy. | Pure AI/LLM research (belongs in `/ai`); venture rounds (belongs in `/startups`). |
| `/ai` | AI | Foundation models, LLMs, generative AI tools, AI safety research, neural architectures, AI ethics & compute clusters. | Non-AI consumer gadgets (belongs in `/technology`). |
| `/business` | Business | Corporate mergers, executive changes, retail, global trade, industrial shifts, supply chains. | Stock indices/crypto/personal finance (belongs in `/finance`); early-stage VC (belongs in `/startups`). |
| `/finance` | Finance | Stock markets, Sensex/Nifty, Wall Street, interest rates, central bank monetary policy, cryptocurrencies, banking, personal investments. | General corporate strategy without market/monetary focus. |
| `/startups` | Startups | Venture capital funding rounds (Seed, Series A-E), angel investing, accelerators, unicorn valuations, founder profiles. | Political diplomacy or established enterprise M&A. |
| `/science` | Science | Astronomy, space exploration (NASA/ISRO/ESA), astrophysics, quantum research, clean energy physics, biological discoveries, climate science. | Consumer electronics or commercial software. |
| `/sports` | Sports | Cricket (IPL/ICC), football (Premier League/FIFA/Champions League), tennis (Grand Slams), Formula 1, Olympics, combat sports. | Non-sporting cultural news. |
| `/gaming` | Gaming | Console hardware (PS5/Xbox/Switch), game studios, title releases, esports tournaments, game engine technology. | Non-gaming tech software. |
| `/entertainment` | Entertainment | Cinema, box office records, streaming platforms (Netflix/Prime/Disney+), film festivals, Hollywood/Bollywood industry news, music. | Tech platform corporate policy. |

---

## 2. Category Audit Script & Review Process

We provide `scripts/audit-categories.ts` to scan published stories and identify potential category mismatches.

### Execution Command:
```bash
npx tsx scripts/audit-categories.ts
```

This generates `docs/category-audit.csv` with:
- Article ID & Slug
- Current Assigned Category
- Recommended Classification
- Headline & Evidence

**Policy on URL Migrations**: No existing published URL will be modified or migrated without explicit editorial confirmation. Approved migrations will receive permanent 301 redirects and automatic sitemap updates.
