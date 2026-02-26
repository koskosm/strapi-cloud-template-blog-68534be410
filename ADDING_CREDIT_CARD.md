# Adding Credit Card Content Type

Credit card is **deliberately omitted** from the codebase for now. This guide shows how to add the credit-card content type when you're ready.

## Why Is It Omitted?

The schemas reference `api::credit-card.credit-card` in blog-post, shop-offer, and home-page. To keep deployment working without implementing credit card yet, the content type and those relations were left out. Use this guide to add them when you need credit card support.

## How to Add It Back

### Step 1: Create the Directory Structure

```bash
mkdir -p src/api/credit-card/content-types/credit-card
mkdir -p src/api/credit-card/controllers
mkdir -p src/api/credit-card/routes
mkdir -p src/api/credit-card/services
```

### Step 2: Create the Schema

Create `src/api/credit-card/content-types/credit-card/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "credit_cards",
  "info": {
    "singularName": "credit-card",
    "pluralName": "credit-cards",
    "displayName": "Credit Card",
    "description": "Credit card information and details"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {
    "i18n": {
      "localized": true
    }
  },
  "attributes": {
    "name": {
      "type": "string",
      "required": true,
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      }
    },
    "slug": {
      "type": "uid",
      "targetField": "name",
      "required": true
    },
    "description": {
      "type": "richtext",
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      }
    },
    "cardImage": {
      "type": "media",
      "multiple": false,
      "required": true,
      "allowedTypes": ["images"],
      "pluginOptions": {
        "i18n": {
          "localized": false
        }
      }
    },
    "benefits": {
      "type": "richtext",
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      }
    },
    "annualFee": {
      "type": "decimal"
    },
    "rewardsRate": {
      "type": "string",
      "pluginOptions": {
        "i18n": {
          "localized": true
        }
      }
    },
    "isFeatured": {
      "type": "boolean",
      "default": false
    },
    "viewCount": {
      "type": "integer",
      "default": 0
    }
  }
}
```

### Step 3: Create Controller, Routes, and Services

Create `src/api/credit-card/controllers/credit-card.js`:

```javascript
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit-card.credit-card');
```

Create `src/api/credit-card/routes/credit-card.js`:

```javascript
'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::credit-card.credit-card');
```

Create `src/api/credit-card/services/credit-card.js`:

```javascript
'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::credit-card.credit-card');
```

### Step 4: Add Relations Back to Other Schemas

#### In `blog-post/content-types/blog-post/schema.json`

Add after the `author` attribute:

```json
"relatedCards": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::credit-card.credit-card"
},
```

#### In `shop-offer/content-types/shop-offer/schema.json`

Add after the `termsAndConditions` attribute:

```json
"eligibleCards": {
  "type": "relation",
  "relation": "manyToMany",
  "target": "api::credit-card.credit-card"
},
```

#### In `home-page/content-types/home-page/schema.json`

Add after the `heroCarousels` attribute:

```json
"featuredCards": {
  "type": "relation",
  "relation": "oneToMany",
  "target": "api::credit-card.credit-card"
},
```

### Step 5: Restart Strapi

```bash
npm run build
npm run develop
```

## Result

After completing these steps, you'll have:
- A fully functional Credit Card content type
- Relations between credit cards and blog posts
- Relations between credit cards and shop offers  
- Featured credit cards on the home page

## API Endpoints

Once added, you'll have access to:

```
GET  /api/credit-cards
GET  /api/credit-cards/:id
POST /api/credit-cards
PUT  /api/credit-cards/:id
DELETE /api/credit-cards/:id
```

With localization:

```
GET /api/credit-cards?locale=en
GET /api/credit-cards?locale=zh-HK
```
