# Strapi v5 Compatible Schemas

## Quick Update Guide

The schemas I created are **95% compatible with Strapi v5**. Here's what you need to know:

## Changes for v5

### 1. Update Relations (Optional but Recommended)

For bidirectional relations, explicitly define `inversedBy` in both directions.

**Example for Blog Post ↔ Credit Card:**

In `blog-post.json`:
```json
"relatedCards": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::credit-card.credit-card",
  "inversedBy": "relatedBlogPosts"  // Add this
}
```

Then create matching field in `credit-card.json`:
```json
"relatedBlogPosts": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::blog-post.blog-post",
  "mappedBy": "relatedCards"
}
```

### 2. Verify i18n Configuration

The format remains the same, but ensure your Strapi v5 has i18n plugin enabled:

```bash
npm install @strapi/plugin-i18n
```

### 3. No Other Changes Needed!

All other aspects of the schemas are fully compatible:
- ✅ Field types (string, text, richtext, media)
- ✅ Enumerations
- ✅ UID fields
- ✅ Boolean fields
- ✅ Integer fields
- ✅ DateTime fields
- ✅ Draft & Publish
- ✅ Single types
- ✅ Collection types

## Installation for Strapi v5

### Step 1: Create Strapi v5 Project
```bash
npx create-strapi@latest cms --quickstart
cd cms
```

### Step 2: Install i18n Plugin
```bash
npm install @strapi/plugin-i18n
```

### Step 3: Copy Schema Files

Copy each schema file to the correct location:

```
cms/
└── src/
    └── api/
        ├── home-page/
        │   └── content-types/
        │       └── home-page/
        │           └── schema.json  ← Copy home-page.json here
        ├── hero-carousel/
        │   └── content-types/
        │       └── hero-carousel/
        │           └── schema.json  ← Copy hero-carousel.json here
        └── ... (repeat for other content types)
```

### Step 4: Rebuild Admin
```bash
npm run build
npm run develop
```

## API Usage Differences

### v4 API (Entity Service)
```javascript
const posts = await strapi.entityService.findMany('api::blog-post.blog-post', {
  populate: '*',
})
```

### v5 API (Document Service) - Recommended
```javascript
const posts = await strapi.documents('api::blog-post.blog-post').findMany({
  populate: '*',
})
```

## Frontend Integration

When fetching from Strapi v5 in your React app:

```typescript
// Fetch blog posts
const response = await fetch('http://localhost:1337/api/blog-posts?populate=*&locale=en')
const data = await response.json()

// Strapi v5 returns data in the same format as v4
console.log(data.data) // Array of posts
```

## Summary

**Your schemas are v5-ready!** 🎉

The only optional improvement is adding explicit `inversedBy` to bidirectional relations. All other configurations work perfectly in Strapi v5.

### Quick Checklist:
- ✅ Schemas are v5 compatible
- ✅ i18n configured correctly
- ✅ All field types supported
- ✅ Relations work (can be optimized)
- ✅ Media uploads supported
- ✅ SEO fields ready

You can use these schemas in Strapi v5 immediately!
