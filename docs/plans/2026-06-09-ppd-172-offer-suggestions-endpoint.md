# Offer Suggestions Endpoint (lightweight cross-locale autocomplete feed)

**Issue:** PPD-172
**Type:** Execution Plan (new server-side endpoint)
**Date:** 2026-06-09

> Backend half of PPD-172. The frontend spec is
> `paypayduck-web/docs/plans/2026-06-09-ppd-172-shop-offer-fetch-optimization.md`.
> This plan defines the API contract; the Tech-Lead/Developer own the exact query and field names.

## Goal

Add a lightweight Strapi endpoint that returns only the autocomplete fields (slug + localized offer
names across locales) for active shop offers, computed server-side in a single cross-locale query,
so the `/offers` search-suggestions dropdown no longer pages the whole catalog in every locale from
the client.

## Context

`useShopOffers()` on the frontend sweeps the entire `shop-offers` collection page-by-page across
multiple locales (locale-free + `zh-HK` + `en` overlay + a separate 3-locale name sweep) to feed the
`/offers` search-suggestions dropdown, producing ~374 requests / ~14.5 MB on `/offers`. The
suggestions feature needs only a small set of `{ slug, name, allLocaleNames }` per active offer.
The existing `with-card-previews` endpoint already establishes the pattern: a custom route on the
shop-offer router, auth disabled, using `strapi.db.query()` because the Strapi 5 REST `locale` param
silently returns 0 rows for localized collection types.

## Approach

- Add a GET route on the existing custom router
  (`src/api/shop-offer/routes/custom-shop-offer.js`), e.g. `/shop-offers/suggestions`, `auth: false`,
  handled by a new controller action in `src/api/shop-offer/controllers/shop-offer.js`.
- The handler:
  1. Reads `?locale=` (resolve `zh` → `zh-HK`, default `en` — same normalization as
     `withCardPreviews`).
  2. Queries active, published offers via `strapi.db.query('api::shop-offer.shop-offer')`,
     selecting **only** the fields needed for autocomplete: a stable id, `slug`, `name`, plus the
     `name` of the same offer (by `slug`/`documentId`) in the other locale(s) so cross-locale name
     matching is preserved. Active = `publishedAt != null` AND `isActive != false`. Aggregate the
     cross-locale names in **one query path** (group by slug/documentId across locale rows) — do
     **not** require the client to make per-locale requests.
  3. Returns a bounded shape; no logos, no merchant relation, no descriptions, no T&C, no
     `cardPreview`.
- Response contract:
  ```
  GET /api/shop-offers/suggestions?locale=zh-HK
  → { data: [ { slug: string, name: string, allLocaleNames: string[] }, ... ] }
  ```
  - `name` is the display name in the requested locale (fall back to another locale's name if the
    requested locale has no translation, so every active offer still appears).
  - `allLocaleNames` is the de-duplicated union of that offer's names across every registered locale,
    used by the client for cross-locale autocomplete matching.
  - Only active offers are included.
- Keep `with-card-previews` untouched.

## Decision Log

- (record decisions made during implementation here)

## Tests

> The CMS has no JS test runner configured today; verify the endpoint with a behaviour-level check
> (a script or `curl`-based assertion the Developer runs and confirms red→green), plus the
> frontend QA walkthrough in the frontend spec.

### Behavioral requirements (for test author)

- `GET /api/shop-offers/suggestions?locale=zh-HK` returns `{ data: [...] }` where each entry has
  `slug`, `name`, and `allLocaleNames` and **nothing else** (no logo/merchant/description/T&C/
  cardPreview).
- Only active offers appear: an offer with `isActive=false` or unpublished is absent.
- For an offer that has both a zh-HK and an en title, `allLocaleNames` contains **both** titles
  regardless of the requested `locale`.
- With `?locale=zh-HK`, `name` is the zh-HK title; with `?locale=en`, `name` is the en title; if a
  requested-locale translation is missing, `name` falls back to an available locale (the offer still
  appears).
- `?locale=zh` is treated as `zh-HK`.
- The endpoint answers in a single request (no client paging required) and returns the full active
  set within one bounded query.

### Test checklist

- [ ] Tests written from behavioral requirements only
- [ ] Tests executed and confirmed failing (red)
- [ ] Implementation started only after red tests confirmed
- [ ] All tests passing after implementation (green)

## Done criteria

- New route + controller action live; `with-card-previews` unchanged.
- A single `GET /api/shop-offers/suggestions?locale=...` returns the minimal cross-locale
  `{ slug, name, allLocaleNames }` set for active offers.
- The frontend `/offers` suggestions consumer can drop `useShopOffers()` and feed off this endpoint
  with cross-locale matching preserved.
- `cd ppd-strapi-cms && npm run build` succeeds; `npm audit --audit-level=high` clean.
