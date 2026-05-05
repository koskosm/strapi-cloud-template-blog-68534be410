# Testing — Backend (ppd-strapi-cms)

See [PLANS.md](PLANS.md) and [AGENTS.md](../../AGENTS.md) for TDD and the `plan → implement → verify` workflow.

## Testing Mode

**`behaviour-first`**

Tests are written from behavioral requirements only. Tests must fail (red) before any production code is written.

## Current State

**Automated tests do not exist in this repo.** Quality is currently maintained via:

1. Strapi's built-in schema validation — content type fields are enforced by Strapi at save time
2. `npm audit --audit-level=high` — dependency security scanning
3. Manual API spot-checks via the Strapi admin panel and `curl`/browser
4. Integration testing via the frontend (paypayduck-web) — if the frontend QA agent catches API issues, they surface here

Adding API tests (e.g. using Strapi's built-in testing utilities or Supertest) is tracked in TECH_DEBTS.md.

## Test Pyramid (target)

| Level | Tool | Coverage Target | Run On |
|-------|------|----------------|--------|
| API integration | Supertest / Strapi test utils | Critical endpoints | Every PR |
| Schema validation | Strapi built-in | All content types | Every Strapi start |

## Coverage Targets (target once tests exist)

| Domain | Target | Current |
|--------|--------|---------|
| CreditCard REST API | 80% | 0% |
| ShopOffer REST API | 80% | 0% |
| Custom lifecycle hooks | 70% | 0% |

## Test Conventions (to establish when tests are added)

- **Framework:** Strapi's official test setup with Supertest (or Jest + Supertest)
- **Test file placement:** `tests/<content-type>/<endpoint>.test.js`
- **Locale coverage:** Test both `zh-HK` and `en` locale endpoints for all i18n content types
- **Populate depth:** Test with `?populate=*` to confirm relations are returned correctly
- **Auth:** Use Strapi's public role for read-only tests; use API token for write tests if needed

## Mocking Strategy

- Do **not** mock the database in integration tests — use an in-memory SQLite or test-specific SQLite file
- Reset database state between test runs using Strapi's lifecycle reset utilities
