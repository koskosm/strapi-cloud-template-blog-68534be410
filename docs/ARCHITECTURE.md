# Backend Architecture — ppd-strapi-cms

## System Overview

`ppd-strapi-cms` is a Strapi 5 headless CMS serving content for the PayPayDuck credit card comparison platform. It provides REST APIs consumed by `paypayduck-web`. Content is managed in Traditional Chinese (zh-HK) and English via the Strapi i18n plugin.

## Content Types

| Content Type | Kind | Description |
|-------------|------|-------------|
| CreditCard | Collection | Cards with rankings, metrics, welcome offers |
| ShopOffer | Collection | Shopping promotions linked to merchants |
| Merchant | Collection | Stores/brands with logo and website |
| BlogPost | Collection | Articles with categories, tags, authors |
| BlogCategory | Collection | Blog post topic groupings |
| BlogTag | Collection | Blog post keyword tags |
| Author | Collection | Content authors |
| HeroCarousel | Collection | Homepage hero banner slides |
| StaticPage | Collection | About, Terms, Privacy pages |
| Ad | Collection | Ad placements with card/filter targeting rules |
| Global | Single | Global settings (favicon, site config) |
| About | Single | About page content |
| Contact | Single | Contact page (email, phone, office hours) |
| HomePage | Single | Homepage featured / most-viewed card config |

## API Design

- Default REST API endpoints: `/api/<content-type>?populate=*&locale=<locale>`
- Bulk endpoints available for credit cards (performance optimization)
- Proxy: `paypayduck-web` routes `/strapi-proxy/*` to Strapi in development to avoid CORS

## Internationalisation

- Default locale: `zh-HK`
- Secondary locale: `en`
- i18n enabled on all major content types
- Frontend falls back to `en` if `zh-HK` entry is missing for a given field

## Key Technical Decisions

| Decision | Choice | Rationale | Date |
|----------|--------|-----------|------|
| Database (dev) | SQLite (better-sqlite3) | Simple local dev; no Docker required | — |
| Rich Text | CKEditor (strapi-plugin-ckeditor) | Better UX for editors than default Strapi blocks | — |
| Token security | Server-side proxy | API token must not be exposed in browser bundle | 2026-05 |

## User Roles

| Role | Description |
|------|-------------|
| **Content Editor** | Logs into Strapi admin panel to create, edit, and publish content across all collection types. |
| **Admin** | Full Strapi admin access — manages users, roles, permissions, plugins, and content type configuration. |
| **Public API** | The frontend (`paypayduck-web`) reads content via the REST API using a read-only API token. Write access is never granted to the public API. |

## External Dependencies

| Service | Purpose | Notes |
|---------|---------|-------|
| paypayduck-web | Consumer of all content | Calls Strapi REST API |
| Fly.io | Production hosting | See `DEPLOY.md` for deployment config |
