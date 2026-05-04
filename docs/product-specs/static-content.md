# Static Content

CMS-managed static content types — StaticPage (collection), Global (single), Contact (single), About (single).

---

## StaticPage

Collection for all static informational pages (About Us, Privacy Policy, Terms of Service, and any catch-all slug pages). Rendered as sanitized HTML in the frontend.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `title` | string | yes | yes | Page display title |
| `slug` | uid (from title) | no | yes | URL-safe identifier used as route path |
| `content` | CKEditor | yes | yes | Page body — rendered as sanitized HTML in frontend |
| `seoTitle` | string | yes | no | Override for `<title>` tag |
| `seoDescription` | text (max 160) | yes | no | Override for meta description |
| `pageType` | enum | no | yes | `about` / `terms` / `privacy` / `contact` / `faq` / `other` |
| `showInFooter` | boolean | no | no | Include in footer navigation; default true |
| `footerOrder` | integer | no | no | Sort order in footer links; default 0 |
| `lastUpdated` | datetime | no | no | Last content update timestamp |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en)

### Known Slugs

| Slug | Route | pageType |
|------|-------|----------|
| `about-us` | `/about-us` | `about` |
| `privacy-policy` | `/privacy`, `/privacy-policy` | `privacy` |
| `terms-of-service` | `/terms`, `/terms-of-service` | `terms` |

### API Endpoints

```
GET /api/static-pages?populate=*&locale=zh-HK
GET /api/static-pages/:documentId?populate=*&locale=zh-HK
GET /api/static-pages?filters[slug][$eq]=:slug&populate=*&locale=zh-HK
```

---

## Global

Single type. Site-wide configuration: name, favicon, default SEO, social URLs. No draft/publish; always live. Not i18n-enabled — values are locale-agnostic.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `siteName` | string | no | yes | Site name used in SEO and meta tags |
| `siteDescription` | text | no | yes | Default meta description fallback |
| `favicon` | media | no | no | Favicon image |
| `defaultSeo` | component (shared.seo) | no | no | Default SEO component |
| `facebookUrl` | string | no | no | Facebook page URL |
| `instagramUrl` | string | no | no | Instagram page URL |

**Draft/Publish:** no (always live)
**i18n:** not enabled

### API Endpoints

```
GET /api/global?populate=*
```

---

## Contact

Single type. Contact page content with CKEditor body and structured contact details. i18n-enabled so office hours and body can vary by locale.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `content` | CKEditor | yes | no | Rich text body for the contact page |
| `email` | string | no | no | Contact email address (shared across locales) |
| `phone` | string | no | no | Contact phone number (shared across locales) |
| `officeHours` | text | yes | no | Office hours description; can vary by locale |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/contact?populate=*&locale=zh-HK
```

---

## About

Single type. Legacy about page with dynamic zone blocks (media, quote, rich-text, slider). No i18n; not actively used — the frontend renders a hardcoded `About.tsx` component at `/about` and uses `StaticPage` slug `about-us` at `/about-us`.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `title` | string | no | no | Page title |
| `blocks` | dynamic zone | no | no | Blocks: `shared.media`, `shared.quote`, `shared.rich-text`, `shared.slider` |

**Draft/Publish:** no (always live)
**i18n:** not enabled

### API Endpoints

```
GET /api/about?populate=*
```

---

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2026-04 | Initial content types created | — |
