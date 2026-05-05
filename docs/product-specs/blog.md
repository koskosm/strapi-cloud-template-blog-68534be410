# Blog

Blog content types — BlogPost (articles), BlogCategory, BlogTag, and Author.

---

## BlogPost

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `title` | string | yes | yes | Article display title |
| `slug` | uid (from title) | no | yes | URL-safe identifier |
| `excerpt` | text (max 300) | yes | no | Short summary for listing cards |
| `content` | CKEditor | yes | yes | Full article body — rendered as sanitized HTML in frontend |
| `featuredImage` | media | no | yes | Hero image for article page and listing card |
| `category` | relation (BlogCategory) | — | no | Many-to-one; one category per post |
| `tags` | relation (BlogTag) | — | no | Many-to-many |
| `author` | relation (users-permissions.user) | — | no | Strapi user as author |
| `relatedCards` | string (autocomplete) | no | no | Comma-separated credit card slugs for related card widgets |
| `relatedOffers` | relation (ShopOffer) | — | no | Many-to-many; linked shop offers |
| `seoTitle` | string | yes | no | Override for `<title>` tag |
| `seoDescription` | text (max 160) | yes | no | Override for meta description |
| `viewCount` | integer | no | no | Read-only view counter; default 0 |
| `readingTime` | integer | no | no | Estimated reading time in minutes; default 5 |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/blog-posts?populate=*&locale=zh-HK&filters[publishedAt][$notNull]=true
GET /api/blog-posts/:documentId?populate=*&locale=zh-HK
GET /api/blog-posts?populate=*&locale=zh-HK&filters[category][slug][$eq]=:categorySlug
GET /api/blog-posts?populate=*&locale=zh-HK&filters[tags][slug][$eq]=:tagSlug
```

---

## BlogCategory

Lookup collection for grouping blog posts by topic.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `name` | string | yes | yes | Category display name |
| `slug` | uid (from name) | no | yes | URL-safe identifier |
| `description` | text | yes | no | Brief category description |
| `posts` | relation (BlogPost, reverse) | — | — | Auto-populated; read-only in admin |

**Draft/Publish:** no (always live)
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/blog-categories?populate=*&locale=zh-HK
GET /api/blog-categories/:documentId?populate=*&locale=zh-HK
```

---

## BlogTag

Lookup collection for keyword-level tagging of blog posts.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `name` | string | yes | yes | Tag display name |
| `slug` | uid (from name) | no | yes | URL-safe identifier |
| `posts` | relation (BlogPost, reverse) | — | — | Auto-populated; read-only in admin |

**Draft/Publish:** no (always live)
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/blog-tags?populate=*&locale=zh-HK
GET /api/blog-tags/:documentId?populate=*&locale=zh-HK
```

---

## Author

Lightweight author profile. Not i18n-enabled; name/email are locale-agnostic.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `name` | string | no | no | Author display name |
| `avatar` | media | no | no | Author profile image |
| `email` | string | no | no | Author email (not exposed publicly) |

**Draft/Publish:** no (always live)
**i18n:** not enabled

### API Endpoints

```
GET /api/authors?populate=*
GET /api/authors/:documentId?populate=*
```

---

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2026-04 | Initial content types created | — |
