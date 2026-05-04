# Technical Debt Registry — Backend (ppd-strapi-cms)

## Active Debts

| Debt | Area | Severity | Tracking |
|------|------|----------|----------|
| No automated API tests | All | high | no-issue — planned for next sprint |
| Ad targeting rule evaluation lives in the frontend (`card-listing-ads.ts`), not the CMS | Ad targeting | medium | no-issue — ideally the CMS evaluates which ads to inject per request; current approach couples targeting logic to the frontend |
| SQLite in dev may mask cloud-DB-specific query issues | Infrastructure | low | no-issue — use a test Postgres connection to verify before major releases |
| Auto-generated Strapi TypeScript types for card statistics content types are uncommitted | Credit Cards | low | no-issue — run `npm run strapi ts:generate-types` after schema changes |
| No rate limiting on public REST endpoints | Security / Infrastructure | medium | no-issue — Strapi's public API has no rate limiting; mitigated by CDN layer in production |

## Resolved Debts

| Debt | Area | Resolved | How |
|------|------|----------|-----|
| Strapi API token exposed in frontend bundle | Security | 2026-05 | Token removed from `VITE_*` vars; Express proxy added server-side (PPD-104) |
| N+1 queries on credit card bulk endpoint | CreditCard API | 2026-05 | Bulk endpoint with proper populate optimized (PPD-103) |
| Multi-locale fallback in bulk CMS endpoint broke too early | CreditCard API / i18n | 2026-05 | Locale fallback logic corrected |

## Recording a New Debt

Add a row to Active Debts with:
- **Debt**: what the problem is and why it matters
- **Area**: which content type, API area, or layer it affects
- **Severity**: high / medium / low
- **Tracking**: Linear issue ID or `no-issue` with a brief explanation
