# Card-scoped, group-ordered, paginated offers endpoint

**Issue:** PPD-171
**Type:** Execution Plan (new server-side endpoint)
**Date:** 2026-06-09

> Backend half of PPD-171. The frontend spec is
> `paypayduck-web/docs/plans/2026-06-09-ppd-171-card-scoped-offers-api.md`.
> This plan defines the API contract; the Tech-Lead/Developer own the exact query and field names.

## Goal

Add a card-scoped Strapi endpoint that returns offers for a single credit card, grouped and ordered
**across the whole matching set** (recommended → exclusive → non-exclusive, each group by published
date desc) and then paginated — so a card's exclusive/recommended offer can never be truncated out of
the first page even when the card has 100+ offers. It replaces the client-side single-window scoping
that both the card-detail page and `/offers?card=<slug>` rely on today.

## Context

The card-detail page and the card-filtered offers list both fetch via
`fetchShopOffersForCardSlugFromStrapi` (`paypayduck-web/src/lib/strapi.ts:1834`), which fetches a single
`pageSize=100` page pre-sorted `publishedAt:desc` with **no pagination loop**, then groups/orders
client-side. For a card with 100+ offers (恒生 MMPower, `hase-mmpower-credit`) an exclusive offer
published outside the newest-100 window is never fetched, so it is silently dropped before ordering even
runs. The same single-window fetch backs `/offers?card=<slug>` (CARD mode), which hard-codes
`hasMore=false` — there is no pagination there at all.

The shop-offer custom router already establishes the reusable pattern: handlers `withCardPreviews` and
`suggestions` (PPD-172, `ppd-strapi-cms/src/api/shop-offer/controllers/shop-offer.js`) use
`strapi.db.query('api::shop-offer.shop-offer').findMany({ where, populate, orderBy, limit, offset })`,
normalize `zh` → `zh-HK`, filter `publishedAt $notNull` + `isActive $ne false`, and iterate locales
server-side because the Strapi 5 REST `locale` param silently returns 0 rows for localized collection
types. The new endpoint mirrors this.

## Approach

- Add a GET route on the existing custom router
  (`src/api/shop-offer/routes/custom-shop-offer.js`), e.g. `/shop-offers/for-card`, `auth: false`,
  handled by a new controller action in `src/api/shop-offer/controllers/shop-offer.js`. Leave
  `withCardPreviews` and `suggestions` untouched.
- The handler:
  1. Reads `?slug=` (the card slug), `?page=` and `?page_size=`, and `?locale=` (resolve `zh` → `zh-HK`,
     same normalization as `withCardPreviews` / `suggestions`). Default `page_size` = **24** when
     omitted; `page` defaults to 1.
  2. Fetches the **full** active+published set of offers whose `creditCardSlug` CSV contains the card
     slug, using `strapi.db.query()` with locale iteration (mirroring the existing handlers). Active =
     `publishedAt != null` AND `isActive != false`. Because `creditCardSlug` is a CSV substring, the
     candidate set MUST be reduced to **exact slug-segment** matches server-side (split the CSV on
     commas, trim/lowercase, compare equality) — reject partial-slug false matches like `mox-credit-x`
     for `mox-credit`.
  3. Computes grouping + ordering over the **whole** matching set, then slices the requested page:
     - Group: **recommended** (`isRecommended === true`) → **exclusive** (CSV has exactly ONE slug and
       it equals the requested slug) → **non-exclusive** (everything else linked to this card, i.e.
       multi-card offers). A recommended+exclusive offer goes in the recommended group.
     - Within each group: sort by published date **descending**, key = `publishedAt ?? createdAt`.
     - Tie-break (equal/missing dates): **`id` ascending**, so ordering is stable across page
       boundaries.
  4. Returns the requested page of offers carrying the fields the consumers render (id, name, logo,
     discount, detail, `isRecommended`, the **full** `creditCardSlug` CSV, `publishedAt`/`createdAt`,
     merchant/category fields as the existing card-scoped offers carry) plus pagination metadata.
- Response contract:
  ```
  GET /api/shop-offers/for-card?slug=hase-mmpower-credit&page=1&page_size=6&locale=zh-HK
  → { data: [ { ...offer }, ... ], meta: { pagination: { page, pageSize, total, pageCount } } }
  ```
  - `data` is the page of offers in the authoritative group order described above.
  - pagination metadata lets the client derive `hasMore` (`page < pageCount`) and `total`.
  - localized fields are in the requested locale, with the same locale-fallback as
    `withCardPreviews`/`suggestions` (the offer still appears if the requested locale has no
    translation).

## Decision Log

- (record decisions made during implementation here)
- **Default `page_size`:** 24 (user-confirmed). The issue references reusing the frontend
  `OFFERS_BROWSE_PAGE_SIZE`, but that constant is currently `50` in
  `paypayduck-web/src/lib/offers-server-query.ts`. The backend default for THIS endpoint is 24; do not
  inherit 50. Card detail always passes `page_size=6`. (Flag any reconciliation of the frontend
  constant in the frontend spec, not here.)

## Tests

> The CMS has no JS test runner configured today; verify the endpoint with a behaviour-level check
> (a script or `curl`-based assertion the Developer runs and confirms red→green), plus the frontend QA
> walkthrough in the frontend spec. Prefer extracting the pure grouping/ordering/pagination logic into
> an exported helper (as `buildSuggestionsFromLocaleRows` was) so it can be asserted directly.

### Behavioral requirements (for test author)

- `GET /api/shop-offers/for-card?slug=<card>&page=1&page_size=6` returns `{ data, meta.pagination }`
  with at most 6 offers in group order recommended → exclusive → non-exclusive.
- For a card with 100+ offers including one exclusive offer whose `publishedAt` is older than the
  newest 100 offers, that exclusive offer appears in the first page (within the first 6 when
  `page_size=6`) — it is NOT truncated by a fetch window.
- Within each group, offers are ordered by `publishedAt ?? createdAt` descending; equal/missing dates
  fall back to `id` ascending; ordering is stable across page boundaries (no offer on two pages, none
  skipped) when paging with the same `page_size`.
- A multi-card CSV offer that includes the requested slug as one segment is included but classified
  **non-exclusive** (never exclusive).
- Requesting `slug=mox-credit` does NOT return offers scoped only to `mox-credit-x` (no partial-slug
  false matches).
- `page` beyond the last page → empty `data`; `meta.pagination` signals end (`page > pageCount`).
- `page_size` omitted → 24 per page; `page_size=6` → 6 per page.
- `?locale=zh` treated as `zh-HK`; localized name/discount/detail returned in the requested locale with
  the same fallback as `withCardPreviews`/`suggestions`.
- Only active (`isActive != false`) + published (`publishedAt != null`) offers appear.

### Test checklist
- [ ] Tests written from behavioral requirements only
- [ ] Tests executed and confirmed failing (red)
- [ ] Implementation started only after red tests confirmed
- [ ] All tests passing after implementation (green)

## Done criteria

- New route + controller action live on the shop-offer custom router; `withCardPreviews` and
  `suggestions` unchanged.
- A single `GET /api/shop-offers/for-card?slug=...&page=...&page_size=...&locale=...` returns the
  card-scoped, group-ordered, paginated page + pagination metadata, ordering computed across the whole
  matching set with exact slug-segment matching (no partial-slug false matches).
- Frontend card-detail and `/offers?card=` consumers can drop the client-side single-window scope and
  consume this endpoint (card detail `page_size=6`; `/offers?card=` incrementing `page` for infinite
  scroll).
- `cd ppd-strapi-cms && npm run build` succeeds; `npm audit --audit-level=high` clean.
