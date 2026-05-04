# Card Stats (Analytics)

Internal analytics powering the homepage Most Viewed section and the search bar Popular panel. Not exposed in the Strapi admin nav.

---

## CardStatDaily

Collection. Stores per-day, per-slug event counts. Hidden from the admin panel — written only via custom endpoints.

### Fields

| Field | Type | Locale | Required | Notes |
|-------|------|--------|----------|-------|
| `date` | string | no | yes | Day bucket in `YYYY-MM-DD` format |
| `slug` | string | no | yes | Credit card slug (locale-agnostic) |
| `type` | enum | no | yes | `detail_view` — card detail page view; `search_top` — search submission result |
| `count` | integer | no | yes | Cumulative count for this (type, date, slug) bucket |

Composite unique index on `(type, date, slug)`. Secondary index on `(type, date)` for rollup queries.

**Draft/Publish:** no
**i18n:** not enabled

---

## Custom Endpoints

All three endpoints are public (no auth token required). Write endpoints are rate-limited to 5 requests per minute per IP.

### Record a card detail view

```
POST /api/card-stats/detail-view
Body: { slug: string, sessionId: string }
```

Increments the `detail_view` count for today's bucket. Capped at **5 events per (sessionId, slug, day)** to prevent inflation from repeated page loads.

### Record a search top-result event

```
POST /api/card-stats/search-top
Body: { slug: string, sessionId: string }
```

Increments the `search_top` count for today's bucket. Fired by the frontend only when the user submits a non-empty keyword.

### Get top cards by activity

```
GET /api/card-stats/top?type=<detail_view|search_top>&days=7&limit=<n>
Response: [{ slug: string, count: number }]  (ordered desc)
```

Returns the top `n` slugs by summed count over the last `days` days. Returns `[]` when no data exists — callers must handle this gracefully. Opportunistically deletes rows older than 30 days during each call (no cron required).

---

## Consumer Behaviour

| Consumer | Event type | Where used |
|----------|-----------|------------|
| Card detail page (`/cards/:id`) | `detail_view` | Fires on page entry; result feeds homepage Most Viewed section |
| Search bar (global) | `search_top` | Fires on keyword submit; result feeds Popular panel (empty-input state) |
| Homepage Most Viewed section | `GET /top?type=detail_view&days=7` | Shows top 10; hidden when response is `[]` |
| Search bar Popular panel | `GET /top?type=search_top&days=7&limit=4` | Shows top 4; hidden when response is `[]` |

---

## Changelog

| Date | Change | Issue |
|------|--------|-------|
| 2026-04 | CardStatDaily collection and custom endpoints added | PPD-89 |
