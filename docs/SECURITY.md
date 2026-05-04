# Security Baseline — Backend (ppd-strapi-cms)

## Key Security Rules

- **Strapi API token must never be in the frontend bundle.** Token must only be used server-side or via a server proxy.
- **Fly secrets for production.** Never commit `.env` files with production secrets. Production config uses Fly.io runtime secrets — see `DEPLOY.md`.
- **Run `npm audit --audit-level=high`** before every PR merge.
- **Strapi admin panel** must be protected and not publicly accessible in production.

## Token Handling

| Environment | Token Location |
|-------------|---------------|
| Development | `.env` file (gitignored) |
| Production | Fly.io runtime secrets |

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| API token exposure | Token kept server-side; frontend uses Vite proxy in dev |
| Dependency vulnerabilities | `npm audit --audit-level=high` in quality checks |
| Unauthorized CMS access | Strapi role-based access control; admin protected |

## Incident Response

1. Rotate the compromised token immediately in Fly.io secrets
2. Redeploy the CMS: `fly deploy` (see `DEPLOY.md`)
3. Audit API logs for unauthorized access
4. Document the incident in Linear
