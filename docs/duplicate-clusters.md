# Audit of Duplicate & Near-Duplicate Clusters (Phase 2)

**Date**: 2026-09-19  
**Branch**: `seo-overhaul`  
**Site**: Briefy.live  

This document catalogs identified duplicate or near-duplicate wire stories previously syndicated under distinct slugs, along with recommended canonicalization and redirect mappings.

---

## 1. Identified Duplicate Groups

### Group 1: US Russia Sanctions & Tariff Legislation
*Topic*: Legislation regarding sanctions against Russia and global trade tariffs.
- **URL A**: `/world/trump-russia-sanctions-bill-passed`
- **URL B**: `/business/us-senate-approves-russia-sanctions-measure`
- **URL C**: `/world/trump-signs-executive-order-trade-tariffs-sanctions`
- **Primary Canonical**: `/world/trump-russia-sanctions-bill-passed`
- **Action Needed**: 301 redirect URLs B & C to URL A upon editorial confirmation; preserve single primary cluster.

---

### Group 2: AI Frontier Models ("Pace the Frontier")
*Topic*: Announcements regarding next-generation frontier AI models and compute scaling.
- **URL A**: `/ai/openai-google-anthropic-pace-the-frontier`
- **URL B**: `/technology/frontier-ai-models-compute-scaling-race`
- **Primary Canonical**: `/ai/openai-google-anthropic-pace-the-frontier`
- **Action Needed**: 301 redirect URL B to URL A; deduplicate under `/ai`.

---

### Group 3: Gemini Security & Prompt Injection Analysis
*Topic*: Security audits discovering prompt injection vulnerabilities in multimodal Gemini models.
- **URL A**: `/ai/gemini-pro-jailbreak-prompt-injection-vulnerability`
- **URL B**: `/technology/researchers-bypass-gemini-safety-guardrails`
- **Primary Canonical**: `/ai/gemini-pro-jailbreak-prompt-injection-vulnerability`
- **Action Needed**: 301 redirect URL B to URL A; consolidate coverage.

---

### Group 4: Disney CTO Leadership Transition
*Topic*: Corporate executive appointment and technological strategy overhaul at The Walt Disney Company.
- **URL A**: `/entertainment/disney-appoints-new-chief-technology-officer`
- **URL B**: `/business/walt-disney-co-cto-transition-streaming-ai`
- **Primary Canonical**: `/entertainment/disney-appoints-new-chief-technology-officer`
- **Action Needed**: 301 redirect URL B to URL A.

---

## 2. Ingestion Filtering Rules for Affiliate & Promo Deals

The following patterns have been codified in the ingestion and generation workers to automatically block off-topic affiliate and promo articles from appearing in news feeds:
- Coupon codes, promo discounts, and cashback vouchers (`% off`, `coupon code`, `promo code`, `discount voucher`).
- Commercial shopping guides (`best gift ideas`, `early Prime Day deals`, `price drop alert`).
- Single-sponsor promotional event listings.

Any existing historical URLs matching these affiliate criteria will be marked `noindex, follow` and excluded from all sitemap feeds.
