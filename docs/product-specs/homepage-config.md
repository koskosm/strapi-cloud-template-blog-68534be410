# Homepage Config

Homepage content configuration — HomePage single type and HeroCarousel collection.

---

## HomePage

Single type. Controls which cards, offers, and posts appear in each homepage section, plus section display titles.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `seoTitle` | string | yes | no | Override for homepage `<title>` tag |
| `seoDescription` | text | yes | no | Override for homepage meta description |
| `heroCarousels` | relation (HeroCarousel) | — | no | One-to-many; ordered by HeroCarousel `order` field |
| `featuredCardSlugs` | string (autocomplete) | no | no | Comma-separated credit card slugs for "Hot Picks" section |
| `mostViewedCardSlugs` | string (autocomplete) | no | no | **Deprecated (PPD-89)** — field still exists on the schema but is no longer consumed by the frontend; Most Viewed section is now driven by the CardStatDaily analytics endpoint |
| `featuredOffers` | relation (ShopOffer) | — | no | One-to-many; shown in "Limited Shop Offers" section |
| `featuredBlogPosts` | relation (BlogPost) | — | no | One-to-many; shown in "Latest Posts" section |
| `hotPicksTitle` | string | yes | no | Section heading; default "Our Hot Picks" |
| `hotPicksDescription` | text | yes | no | Optional subheading for hot picks section |
| `mostViewedTitle` | string | yes | no | Section heading; default "Most Viewed Cards" |
| `limitedOffersTitle` | string | yes | no | Section heading; default "Limited Shop Offers" |
| `latestPostsTitle` | string | yes | no | Section heading; default "Latest Posts" |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/home-page?populate[heroCarousels][filters][isActive][$eq]=true&populate[featuredOffers][populate]=*&populate[featuredBlogPosts][populate]=*&locale=zh-HK
```

Note: The frontend uses a `home-bundle` endpoint (see `paypayduck-web/src/lib/strapi/`) that fetches homepage data in a single optimised request.

---

## HeroCarousel

Collection of homepage hero banner slides. Each slide has desktop + mobile images, optional CTA, and date-gating.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `title` | string | yes | yes | Banner headline |
| `subtitle` | string | yes | no | Supporting headline |
| `description` | text | yes | no | Banner body text |
| `desktopImage` | media | no | yes | Full-width image shown on desktop |
| `mobileImage` | media | no | no | Cropped image shown on mobile; falls back to `desktopImage` if absent |
| `ctaText` | string | yes | no | Call-to-action button label |
| `ctaLink` | string | no | no | URL for CTA button (internal path or external URL) |
| `order` | integer | no | yes | Sort order ascending; default 0 |
| `isActive` | boolean | no | yes | Manual active toggle; default true |
| `startDate` | datetime | no | no | Slide visibility start |
| `endDate` | datetime | no | no | Slide visibility end |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/hero-carousels?populate=*&locale=zh-HK&filters[isActive][$eq]=true&sort=order:asc
GET /api/hero-carousels/:documentId?populate=*&locale=zh-HK
```

---

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2026-04 | Initial content types created | — |
| 2026-04 | PPD-84: homepage data issue fixed (featured offers and latest posts returning empty) | PPD-84 |
