# Ad

Ad placements with card-slug targeting, filter-parameter targeting, and search-tag targeting. Controls which promotional card appears in the card listing at top/middle/bottom positions.

---

## Ad

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `name` | string | yes | yes | Internal label for this ad entry |
| `cardSlug` | string (autocomplete) | no | no | Credit card slug(s) to promote; comma-separated if multiple |
| `filterParameters` | JSON | no | no | Structured filter object matching card listing filter keys (e.g. `{"category":"cashback","channel":"online"}`) |
| `searchTags` | repeatable component (ads.search-tag) | — | no | Search words with match type; see Search Tag below |
| `cardListPositionTop` | boolean | no | no | Show ad at top of card listing; default false |
| `cardListPositionMiddle` | boolean | no | no | Show ad in middle of card listing; default false |
| `cardListPositionBottom` | boolean | no | no | Show ad at bottom of card listing; default false |

**Draft/Publish:** enabled
**i18n:** enabled (zh-HK + en) — `name` and `searchTags.searchWord` are localised; all position/targeting fields are shared

### Search Tag Component (`ads.search-tag`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `searchWord` | string | yes | Keyword to match against user search input |
| `matchType` | enum | yes | `global` (broad match) or `specific` (exact phrase match) |

---

## Targeting Logic

**Current state:** Ad targeting evaluation lives in the frontend (`paypayduck-web/src/lib/card-listing-ads.ts`), not in the CMS. The CMS delivers the full ad list and the frontend applies targeting rules client-side.

This is tracked as a medium-severity tech debt — see `TECH_DEBTS.md`.

### How targeting works (frontend logic):

1. Fetch all active ads from the CMS (`/api/ads?populate=*&locale=:locale`).
2. For each ad, check if the current card listing state matches:
   - **cardSlug**: if the user is viewing a filtered set that includes the promoted card.
   - **filterParameters**: if the user's active filters match the ad's filter object.
   - **searchTags**: if the user's search query matches any `searchWord` at the given `matchType`.
3. Inject matching ads into the card list at the declared position(s) (`top`, `middle`, `bottom`).

---

## API Endpoints

```
GET /api/ads?populate=*&locale=zh-HK&filters[publishedAt][$notNull]=true
GET /api/ads/:documentId?populate=*&locale=zh-HK
```

---

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2026-04 | Initial content type created | — |
