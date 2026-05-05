# Deployment — ppd-strapi-cms

Strapi 5 CMS, hosted on Fly.io as `looklookduck-cms` (org: `paypayduck`, region: `sin`).
Database: PostgreSQL (Fly managed). Object storage: Tigris (S3-compatible).

## Deploy

```bash
cd ppd-strapi-cms
fly deploy
```

That's it. All config comes from Fly secrets (set once, used at runtime).

## Why no build args here

The Strapi server reads env vars at **runtime** (`process.env.*` in `config/env/production/*.js` and elsewhere). So Fly secrets work as expected — they're injected into the container at startup.

This is the opposite of `paypayduck-web`, which is a static SPA with build-time env vars. See `paypayduck-web/DEPLOY.md` for that distinction.

## Required Fly secrets

Verify with `fly secrets list --app looklookduck-cms`. Must include:

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | Postgres connection string |
| `APP_KEYS` | Strapi session keys (4 comma-separated, base64) |
| `API_TOKEN_SALT` | Salts API token hashes |
| `ADMIN_JWT_SECRET` | Signs admin JWTs |
| `JWT_SECRET` | Signs end-user JWTs |
| `TRANSFER_TOKEN_SALT` | Salts data-transfer tokens |
| `AWS_ACCESS_KEY_ID` | Tigris S3 credentials |
| `AWS_SECRET_ACCESS_KEY` | Tigris S3 credentials |
| `AWS_REGION` | Tigris region (`auto`) |
| `AWS_ENDPOINT_URL_S3` | `https://fly.storage.tigris.dev` |
| `BUCKET_NAME` | Tigris bucket name |
| `CARD_API_BASE_URL` | Credit card recommendation API URL |
| `CARD_API_KEY` | Credit card recommendation API key |

To rotate or set:

```bash
fly secrets set --app looklookduck-cms KEY=value
```

## Rollback

```bash
fly releases --image --app looklookduck-cms
fly deploy --image registry.fly.io/looklookduck-cms:deployment-<id>
```

## Custom endpoints (Strapi 5 gotcha)

Custom controllers must use `strapi.db.query()` for localized collection types — both `strapi.entityService.findMany()` and `strapi.documents().findMany()` silently return zero results in this Strapi 5 version. See:

- `src/api/home-bundle/controllers/home-bundle.js`
- `src/api/credit-card/controllers/credit-card.js`
- `src/api/shop-offer/controllers/shop-offer.js`

If a custom endpoint suddenly returns empty `data: []` after a Strapi upgrade, this is the first thing to check.

## Smoke test after deploy

```bash
# Should return 53+ Chinese shop offers
curl -s "https://looklookduck-cms.fly.dev/api/shop-offers/with-card-previews?locale=zh-HK" | jq '.data | length'

# Should return Chinese card names
curl -s "https://looklookduck-cms.fly.dev/api/credit-cards/bulk?slugs=<some-slug>&locale=zh-HK" | jq '.data[0].name'
```

## Common pitfalls

- **Plugin name mismatch**: `config/env/production/plugins.js` must use `ckeditor5` (matches the installed package `@_sh/strapi-plugin-ckeditor`), not `ckeditor`. Wrong name → server crash on startup.
- **Failed migrations on first boot**: check `fly logs --app looklookduck-cms` immediately after deploy.
- **Storage 403s**: Tigris bucket policy must allow public reads for media URLs to work in the frontend.
