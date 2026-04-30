# PayPayDuck CMS — Features

## Overview

This document describes the content management features available in the Strapi admin panel for `ppd-strapi-cms`. Each section maps to a Strapi content type.

---

## 1. Credit Card Management

**Content Type:** `CreditCard` (Collection, draft/publish, i18n)

**Key fields:**
- `name` — localized display name
- `slugsCsv` — comma-separated card slugs (custom autocomplete field, e.g. `hsbc-red,scb-smart`)
- `description` — localized text description
- `cardFaceImage` — card face image upload
- `topMetrics1/2/3 Label + Value` — 3 configurable headline metric slots (e.g. "Cashback" / "2%")
- `keyMetrics` — repeatable component: icon, main text, label
- `welcomeOfferLink` — external URL for welcome offer

**Editor actions:** Create, edit, draft, publish, translate (zh-HK / en), delete.

---

## 2. Shop Offer Management

**Content Type:** `ShopOffer` (Collection, draft/publish, i18n)

**Key fields:**
- `name`, `slug`, `logo`
- `discount` — headline discount string (e.g. "10% cashback")
- `detail`, `description`, `termsAndConditions` — CKEditor rich text fields
- `merchant` — relation to Merchant
- `category` — enum (dining, travel, shopping, groceries, entertainment, etc.)
- `channel` — enum (online, in-store, both)
- `creditCardSlug` — linked card slug (autocomplete)
- `startDate`, `endDate` — validity window
- `isActive` — manual active toggle (in addition to date window)
- `viewCount` — integer (read-only tracking)

**Editor actions:** Create, edit, draft, publish, translate, delete.

---

## 3. Merchant Management

**Content Type:** `Merchant` (Collection, no draft/publish, i18n)

**Key fields:**
- `name`, `slug`, `logo` (image), `website`, `description`
- `offers` — reverse relation to ShopOffer (read-only in admin)

**Editor actions:** Create, edit, translate, delete. Always live (no publish step).

---

## 4. Blog Post Management

**Content Type:** `BlogPost` (Collection, draft/publish, i18n)

**Key fields:**
- `title`, `slug`
- `content` — CKEditor rich text (main article body)
- `category` → BlogCategory relation
- `tags` → BlogTag relation (many)
- `author` → Author relation
- `relatedBlogPosts` → self-relation (many)
- `relatedCards` — comma-separated credit card slugs (autocomplete)
- SEO/meta fields (title, description, OG image)

**Editor actions:** Create, edit, draft, publish, translate, delete.

---

## 5. Blog Category Management

**Content Type:** `BlogCategory` (Collection, i18n)

Simple lookup: `name` + `slug`. Editors create categories to organise blog posts.

---

## 6. Blog Tag Management

**Content Type:** `BlogTag` (Collection, i18n)

Simple lookup: `name` + `slug`. Editors add tags for finer-grained post discovery.

---

## 7. Author Management

**Content Type:** `Author` (Collection)

Fields: `name`, `bio`, `avatar` (image). Used as a relation on BlogPost.

---

## 8. Hero Carousel Management

**Content Type:** `HeroCarousel` (Collection, draft/publish, i18n)

Homepage rotating banners. Fields: `image`, `headline`, `subtext`, `linkUrl`, ordering.

**Editor actions:** Create, draft, publish, translate, reorder, delete.

---

## 9. Static Page Management

**Content Type:** `StaticPage` (Collection, draft/publish, i18n)

CMS-managed pages for About Us, Privacy Policy, Terms of Service, and any custom static pages.
Fields: `slug`, `title`, `content` (CKEditor), SEO meta (title, description).

**Editor actions:** Create, draft, publish, translate, delete.

---

## 10. Ad Placement Management

**Content Type:** `Ad` (Collection, draft/publish, i18n)

Controls which credit cards appear as sponsored placements in the card list and search results.

**Key fields:**
- `name` — internal label (e.g. "HSBC Red — top of list")
- `cardSlug` — target credit card slug (autocomplete)
- `filterParameters` — JSON object for filter-based targeting
- `searchTags` — repeatable component: keyword + match type (global / specific)
- `cardListPositionTop`, `cardListPositionMiddle`, `cardListPositionBottom` — boolean flags

---

## 11. Global Settings

**Content Type:** `Global` (Single type, i18n)

Site-wide settings: site name, favicon URL, default SEO metadata, social links.

---

## 12. Homepage Configuration

**Content Type:** `HomePage` (Single type)

Configures which credit card slugs appear in the "Featured" section on the homepage. (Note: the `mostViewedCardSlugs` field still exists on this singleton but is no longer consumed by the public site as of PPD-89; the Most Viewed section is now driven by the Card Stats analytics endpoint.)

---

## 13. Card Stats (Analytics)

**Content Type:** `CardStatDaily` (Collection, hidden from admin nav, no i18n)

Internal analytics store powering the homepage's Most Viewed section and the search bar's Popular panel.

**Fields:**
- `date` — day bucket (`YYYY-MM-DD`)
- `slug` — credit card slug (locale-agnostic)
- `type` — `detail_view` | `search_top`
- `count` — integer

Composite unique index on `(type, date, slug)`; secondary index on `(type, date)`.

**Custom public endpoints (no auth):**
- `POST /api/card-stats/detail-view` — body `{ slug, sessionId }`. Records a card detail page view; capped at 5 per `(sessionId, slug, day)`.
- `POST /api/card-stats/search-top` — body `{ slug, sessionId }`. Records a "search top result" event (fired by the frontend only when the user submits a non-empty keyword).
- `GET /api/card-stats/top?type=<detail_view|search_top>&days=7&limit=<n>` — returns the top `<n>` slugs by summed count over the last `<days>` days, ordered desc. Returns `[]` when no data. Opportunistically deletes rows older than 30 days before computing the rollup (no cron / scheduler).

Per-IP rate limit on the write endpoints: max 5 requests/min per IP.

---

## 14. Contact Page

**Content Type:** `Contact` (Single type, i18n)

Fields: CKEditor content block, `email`, `phone`, `officeHours`.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-30 | PPD-89: Add `CardStatDaily` collection and custom analytics endpoints (`POST detail-view`, `POST search-top`, `GET top`) for rolling 7-day Most Viewed and Popular card data. HomePage `mostViewedCardSlugs` field deprecated for public site. |
| 2026-04-27 | Initial features document created via project-init |
