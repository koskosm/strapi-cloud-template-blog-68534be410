# Strapi CMS Schema Files

This directory contains Strapi content-type schemas for the PayKing application.

## Version Compatibility

- ✅ **Strapi v4**: Fully compatible, ready to use as-is
- ✅ **Strapi v5**: 95% compatible, minor optimizations recommended

See `V5_UPDATED_SCHEMAS.md` for v5-specific details.

## Setup Instructions

1. **Install Strapi** (if not already installed):
   ```bash
   npx create-strapi-app@latest cms --quickstart
   ```

2. **Copy schema files** to your Strapi project:
   ```
   cms/
   └── src/
       └── api/
           ├── home-page/
           │   └── content-types/
           │       └── home-page/
           │           └── schema.json
           ├── hero-carousel/
           │   └── content-types/
           │       └── hero-carousel/
           │           └── schema.json
           ├── shop-offer/
           │   └── content-types/
           │       └── shop-offer/
           │           └── schema.json
           ├── blog-post/
           │   └── content-types/
           │       └── blog-post/
           │           └── schema.json
           ├── blog-category/
           │   └── content-types/
           │       └── blog-category/
           │           └── schema.json
           ├── blog-tag/
           │   └── content-types/
           │       └── blog-tag/
           │           └── schema.json
           └── static-page/
               └── content-types/
                   └── static-page/
                       └── schema.json
   ```

3. **Enable i18n plugin** in your Strapi admin:
   - Go to Settings → Internationalization
   - Add locales: English (en) and Traditional Chinese - Hong Kong (zh-HK)

4. **Restart Strapi** to apply the schemas:
   ```bash
   npm run develop
   ```

## Content Types Overview

### Single Type

#### Home Page (`home-page`)
- **Purpose**: Configure home page content and featured items
- **Localized**: Yes
- **Fields**:
  - SEO (title, description)
  - Hero carousels (relation)
  - Featured cards (relation)
  - Featured offers (relation)
  - Featured blog posts (relation)
  - Section titles (customizable)

### Collection Types

#### Hero Carousel (`hero-carousel`)
- **Purpose**: Marketing hero banners for homepage carousel
- **Localized**: Yes (content), No (images)
- **Fields**:
  - Title, subtitle, description
  - Desktop & mobile images
  - CTA text & link
  - Order, active status
  - Start/end dates

#### Shop Offer (`shop-offer`)
- **Purpose**: Shopping offers and merchant promotions
- **Localized**: Yes
- **Fields**:
  - Name, slug, logo
  - Discount, detail, description
  - Terms and conditions
  - Eligible cards (relation)
  - Category, dates
  - Featured & active status

#### Blog Post (`blog-post`)
- **Purpose**: Blog articles and content
- **Localized**: Yes
- **Fields**:
  - Title, slug, excerpt, content
  - Featured image
  - Category, tags (relations)
  - Author (user relation)
  - Related cards & offers
  - SEO fields
  - Featured status, view count, reading time

#### Blog Category (`blog-category`)
- **Purpose**: Organize blog posts
- **Localized**: Yes
- **Fields**:
  - Name, slug, description
  - Posts (relation)

#### Blog Tag (`blog-tag`)
- **Purpose**: Tag blog posts
- **Localized**: Yes
- **Fields**:
  - Name, slug
  - Posts (relation)

#### Static Page (`static-page`)
- **Purpose**: About, Terms, Privacy Policy, and other static pages
- **Localized**: Yes
- **Fields**:
  - Title, slug, content (rich text)
  - SEO fields
  - Page type (enum)
  - Footer visibility & order
  - Last updated date

## API Endpoints (Example)

Once set up, your Strapi API will expose:

```
GET  /api/home-page?populate=*
GET  /api/hero-carousels
GET  /api/shop-offers
GET  /api/blog-posts
GET  /api/blog-categories
GET  /api/blog-tags
GET  /api/static-pages
```

## Localization

All content types support i18n. To fetch localized content:

```
GET /api/blog-posts?locale=en
GET /api/blog-posts?locale=zh-HK
```

## Relations

- **Home Page** → Hero Carousels (one-to-many)
- **Home Page** → Credit Cards (one-to-many, featured)
- **Home Page** → Shop Offers (one-to-many, featured)
- **Home Page** → Blog Posts (one-to-many, featured)
- **Shop Offer** ↔ Credit Cards (many-to-many)
- **Blog Post** → Blog Category (many-to-one)
- **Blog Post** ↔ Blog Tags (many-to-many)
- **Blog Post** ↔ Credit Cards (many-to-many)
- **Blog Post** ↔ Shop Offers (many-to-many)

## Permissions

Remember to configure API permissions in Strapi admin:
- Settings → Roles → Public
- Enable `find` and `findOne` for public content

## Next Steps

1. Create a separate Credit Card content type for card details and scores
2. Set up media library for images
3. Configure API tokens for secure access
4. Set up webhooks for cache invalidation
5. Create API integration in your frontend to fetch CMS data
