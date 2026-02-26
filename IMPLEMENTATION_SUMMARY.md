# Schema Implementation Summary

## ✅ Successfully Implemented

All schemas from the `ppd-cms-schemas` folder have been successfully implemented into your Strapi v5 project!

### Content Types Created

#### Collection Types
1. **Merchant** (`merchant`) – *New*
   - Location: `/src/api/merchant/`
   - Localized: name, description
   - Relations: One-to-many with shop offers (offers)

2. **Blog Category** (`blog-category`)
   - Location: `/src/api/blog-category/`
   - Localized fields: name, description
   - Relations: One-to-many with blog posts

3. **Blog Tag** (`blog-tag`)
   - Location: `/src/api/blog-tag/`
   - Localized fields: name
   - Relations: Many-to-many with blog posts

4. **Blog Post** (`blog-post`)
   - Location: `/src/api/blog-post/`
   - Localized fields: title, excerpt, content, SEO fields
   - Relations: Category, tags, author, shop offers
   - Features: Draft & publish, featured flag, view count, reading time

5. **Hero Carousel** (`hero-carousel`)
   - Location: `/src/api/hero-carousel/`
   - Localized fields: title, subtitle, description, CTA text
   - Media: Desktop and mobile images
   - Features: Order, active status, start/end dates

6. **Shop Offer** (`shop-offer`) – *Updated* (merchant)
   - Location: `/src/api/shop-offer/`
   - Localized fields: name, discount, detail, description, terms
   - Relations: Merchant (many-to-one)
   - Features: Category enum, featured flag, active status, dates

7. **Static Page** (`static-page`)
   - Location: `/src/api/static-page/`
   - Localized fields: title, content, SEO fields
   - Features: Page type enum, footer visibility, order

#### Single Type
8. **Home Page** (`home-page`)
   - Location: `/src/api/home-page/`
   - Localized fields: SEO fields, section titles
   - Relations: Hero carousels, offers, blog posts

## 📋 Next Steps

### 1. Install Dependencies (if needed)
If you haven't already installed the project dependencies:
```bash
npm install
```

### 2. Enable i18n Plugin
The i18n plugin is built-in with Strapi v5, but you need to configure locales:

1. Start your Strapi server:
```bash
npm run develop
```

2. Log in to the Strapi admin panel (usually at `http://localhost:1337/admin`)

3. Go to **Settings → Internationalization**

4. Add your locales:
   - English (en) - should be default
   - Traditional Chinese - Hong Kong (zh-HK)

### 3. Configure API Permissions
Set up public access to your content:

1. Go to **Settings → Roles → Public**
2. Enable the following permissions for each content type:
   - `find` (to list items)
   - `findOne` (to get individual items)
3. For the home-page single type, enable `find`

### 4. Add Credit Card when ready (Optional)
Credit card is **deliberately omitted** for now so deployment works without it. When you want to add it, follow **ADDING_CREDIT_CARD.md** to create the content type and restore relations on blog-post, shop-offer, and home-page.

### 5. Build and Start Strapi
After setting up everything:
```bash
npm run build
npm run develop
```

## 🔌 API Endpoints

Once configured, your API will expose:

```
# Single Type
GET  /api/home-page?populate=*

# Collection Types
GET  /api/hero-carousels?populate=*
GET  /api/shop-offers?populate=*
GET  /api/blog-posts?populate=*
GET  /api/blog-categories?populate=*
GET  /api/blog-tags?populate=*
GET  /api/static-pages?populate=*
GET  /api/merchants?populate=*

# With Localization
GET  /api/blog-posts?locale=en
GET  /api/blog-posts?locale=zh-HK
```

## 🔄 Relations Overview

- **Home Page** → Hero Carousels, Shop Offers, Blog Posts
- **Merchant** → Shop Offers (one-to-many)
- **Shop Offer** → Merchant (many-to-one)
- **Blog Post** → Blog Category (many-to-one), ↔ Blog Tags (many-to-many), ↔ Shop Offers (many-to-many), → Author (users-permissions.user)

## ✅ Credit card deliberately omitted

Credit card content type and its relations (`relatedCards`, `eligibleCards`, `featuredCards`) are **not** in the codebase so deployment can succeed. When you want to add them, use **ADDING_CREDIT_CARD.md** for step-by-step instructions.

### Strapi v5 Compatibility
All schemas are fully compatible with Strapi v5! The i18n plugin is built-in and doesn't require separate installation.

### Database Migrations
When you first start Strapi after adding these schemas, it will automatically create the necessary database tables.

## 📚 Resources

- Strapi v5 Documentation: https://docs.strapi.io/
- i18n Plugin Guide: https://docs.strapi.io/dev-docs/plugins/i18n
- Content Type Builder: https://docs.strapi.io/user-docs/content-type-builder

## 🎉 You're Ready!

All the schemas have been successfully implemented. Start your Strapi server and begin creating content!
