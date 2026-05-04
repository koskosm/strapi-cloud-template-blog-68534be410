# ShopOffer & Merchant

ShopOffer is the primary promotion collection. Merchant is a lookup collection linked to ShopOffer.

---

## ShopOffer

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `name` | string | yes | yes | Offer display name |
| `slug` | string | no | yes | URL-safe identifier |
| `logo` | media | no | no | Offer-specific logo (falls back to merchant logo) |
| `discount` | string | yes | yes | Headline discount string e.g. "10% cashback" |
| `detail` | CKEditor | yes | no | Short offer detail |
| `description` | CKEditor | yes | no | Full offer description |
| `termsAndConditions` | CKEditor | yes | no | T&C rich text — rendered as sanitized HTML in frontend |
| `merchant` | relation (Merchant) | no | no | Linked merchant |
| `category` | enum | no | yes | dining / travel / shopping / groceries / entertainment / etc. |
| `channel` | enum | no | yes | online / in-store / both |
| `creditCardSlug` | string (autocomplete) | no | no | Linked credit card slug |
| `startDate` | datetime | no | no | Offer validity start |
| `endDate` | datetime | no | no | Offer validity end |
| `isActive` | boolean | no | yes | Manual active toggle |
| `viewCount` | integer | no | no | Read-only view counter |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/shop-offers?populate=*&locale=zh-HK&filters[isActive][$eq]=true
GET /api/shop-offers/:documentId?populate=*&locale=zh-HK
```

---

## Merchant

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `name` | string | yes | yes | Merchant display name |
| `slug` | string | no | yes | URL-safe identifier |
| `logo` | media | no | no | Merchant logo image |
| `website` | string (URL) | no | no | External merchant URL |
| `description` | text | yes | no | Brief merchant description |
| `offers` | relation (ShopOffer, reverse) | — | — | Auto-populated; read-only in admin |

**Draft/Publish:** no (always live)
**i18n:** enabled (zh-HK + en)

### API Endpoints

```
GET /api/merchants?populate=*&locale=zh-HK
GET /api/merchants/:documentId?populate=*&locale=zh-HK
```

---

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2026-04 | Initial content types created | — |
