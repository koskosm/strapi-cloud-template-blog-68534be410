# CreditCard

Core collection type. All published credit cards are served to the frontend.

---

## Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `name` | string | yes | yes | Display name of the card |
| `slugsCsv` | string (custom) | no | yes | Comma-separated slugs e.g. `hsbc-red,scb-smart`; used for cross-referencing |
| `description` | text | yes | no | Short description shown on detail page |
| `cardFaceImage` | media | yes | no | Card face image; frontend falls back to `en` if zh-HK missing |
| `topMetric1Label` / `topMetric1Value` | string | yes | no | First headline metric slot (e.g. "Cashback" / "2%") |
| `topMetric2Label` / `topMetric2Value` | string | yes | no | Second headline metric slot |
| `topMetric3Label` / `topMetric3Value` | string | yes | no | Third headline metric slot |
| `keyMetrics` | repeatable component | yes | no | List of key benefits (icon + main text + label) |
| `welcomeOfferLink` | string (URL) | no | no | External URL for welcome offer |
| `ranking` | integer | no | no | Sort order for the card listing |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en)

## API Endpoints

```
GET /api/credit-cards?populate=*&locale=zh-HK
GET /api/credit-cards/:documentId?populate=*&locale=zh-HK
```

**Bulk endpoint** (optimized for listing page): used by frontend to load all cards in one request. See frontend `src/lib/strapi/bulk-credit-cards.ts`.

## Acceptance Criteria

- [ ] Published cards appear in the API response; drafts do not
- [ ] `locale=zh-HK` returns zh-HK content; `locale=en` returns English
- [ ] `cardFaceImage` is populated in the response (media object with `url`)
- [ ] `slugsCsv` can be used to cross-reference cards from ShopOffer and Ad entries
- [ ] `ranking` field controls sort order ascending

## Notes

- Many cards do not have a Strapi CMS entry — they come from a separate credit card API (`bank-issuer-api.ts` in the frontend). Strapi data is merged on top.
- The `documentId` field (Strapi 5) is used as the URL parameter in `/cards/:id`, not the numeric `id`.
- Run `npm run strapi ts:generate-types` after schema changes to regenerate TypeScript types.

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2026-05 | Bulk endpoint N+1 query fixed | PPD-103 |
| 2026-04 | Initial content type created | — |
