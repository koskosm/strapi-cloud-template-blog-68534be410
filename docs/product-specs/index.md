# Product Specifications Index — Backend (ppd-strapi-cms)

This directory contains one file per Strapi content type or backend feature area. Each file is the authoritative spec for what that content type does, its fields, and its API behavior.

---

## Catalogue

| Spec | Description |
|------|-------------|
| [credit-card.md](credit-card.md) | CreditCard collection — card data, metrics, slugs, i18n |
| [shop-offer.md](shop-offer.md) | ShopOffer and Merchant collections — promotions, targeting |
| [blog.md](blog.md) | BlogPost, BlogCategory, BlogTag, Author collections |
| [homepage-config.md](homepage-config.md) | HomePage single type, HeroCarousel collection |
| [static-content.md](static-content.md) | StaticPage, Global, About, Contact single types |
| [ad.md](ad.md) | Ad collection — placement targeting rules |
| [card-stats.md](card-stats.md) | CardStatDaily collection — analytics for Most Viewed and Popular panels |

---

## How to Use

- **New content type**: create `<name>.md` from the template below; add an entry to the catalogue above
- **Schema change**: update the relevant file in place; add a changelog entry
- **Deprecating**: change `Status: live` to `Status: deprecated`; note why

---

## File Template

```markdown
# [Content Type Name]

Brief description and purpose.

---

## Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|

## API Endpoints

- `GET /api/<content-type>?populate=*&locale=zh-HK`

## Acceptance Criteria

- [ ] [observable outcome]

## Notes

[Non-obvious business rules, edge cases.]

## Changelog

| Date | Change | Issue |
|------|--------|-------|
```
