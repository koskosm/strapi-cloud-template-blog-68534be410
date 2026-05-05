# Quality Scorecard — Backend (ppd-strapi-cms)

## Quality Check Commands

Run these from the repo root or from within `ppd-strapi-cms/`:

```bash
cd ppd-strapi-cms
npm audit --audit-level=high   # Security audit
npm run build                  # Strapi admin + server build
npm run develop                # Dev server on port 1337 (with hot reload)
npm run start                  # Production server start
```

## Grading Scale

| Grade | Meaning |
|-------|---------|
| A | Well-tested, documented, no known debt |
| B | Adequate coverage, minor gaps documented |
| C | Gaps exist, tracked in TECH_DEBTS.md |
| D | Significant gaps, active remediation planned |
| F | Critical gaps or blocking issues |

## Domain Quality

| Domain | Tests | Docs | Debt | Overall | Last Reviewed |
|--------|-------|------|------|---------|---------------|
| CreditCard API | D | B | B | C | 2026-05-04 |
| ShopOffer API | D | B | B | C | 2026-05-04 |
| BlogPost API | D | B | B | C | 2026-05-04 |
| Merchant API | D | C | B | C | 2026-05-04 |
| Ad (targeting rules) | D | B | C | D | 2026-05-04 |
| i18n / Locale | D | B | B | C | 2026-05-04 |

## Layer Quality

| Layer | Unit Tests | Integration | E2E | Docs | Overall |
|-------|-----------|-------------|-----|------|---------|
| Strapi REST API | — | — | Manual | B | C |
| Content Type schemas | — | — | — | B | C |
| Lifecycle hooks / custom logic | — | — | — | C | D |

> **Note:** Automated tests do not exist. Quality relies on Strapi's built-in type system, manual API spot-checks, and integration testing via the frontend (paypayduck-web).

## Gap Tracking

| Gap | Domain / Layer | Severity | Tracking |
|-----|---------------|----------|----------|
| No automated tests | All | high | TECH_DEBTS.md |
| Ad targeting logic lives in frontend (`card-listing-ads.ts`) not in CMS | Ad targeting | medium | TECH_DEBTS.md |
| SQLite in dev may mask prod-only query issues | Infrastructure | low | TECH_DEBTS.md |

## Historical Grades

| Date | Domain / Layer | Previous | New | Reason |
|------|---------------|----------|-----|--------|
| 2026-05-04 | All | (ungraded) | C/D | First grading after harness install |

## Review Cadence

Update after each content type schema change, when TECH_DEBTS.md is updated, and at least once per release cycle.
