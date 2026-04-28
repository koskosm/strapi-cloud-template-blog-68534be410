# PayPayDuck CMS — Backend Concept

## Project Objective

The PayPayDuck CMS is a Strapi 5 headless CMS that manages all content for the PayPayDuck credit card comparison platform. It exposes a REST API consumed by the React frontend (`paypayduck-web`). Editors use the Strapi admin panel to publish credit cards, shop offers, blog posts, and static pages in both Traditional Chinese (zh-HK) and English.

## Entities

| Entity | Kind | Description |
|--------|------|-------------|
| **CreditCard** | Collection | Credit cards — name, slugs (custom autocomplete field), card image, 3 configurable top metric slots, key benefits (repeatable component), welcome offer link |
| **ShopOffer** | Collection | Shopping promotions — name, discount, merchant relation, credit card slug, category/channel enums, start/end dates, active flag, view count |
| **Merchant** | Collection | Stores/brands — name, logo, website, description, reverse relation to ShopOffers |
| **BlogPost** | Collection | Articles — title, CKEditor body, category/tags/author relations, related card slugs |
| **BlogCategory** | Collection | Blog topic groupings — name, slug |
| **BlogTag** | Collection | Keyword tags — name, slug |
| **Author** | Collection | Content authors — name, bio, avatar |
| **HeroCarousel** | Collection | Homepage hero banner slides — image, headline, link, ordering |
| **StaticPage** | Collection | CMS-managed static pages (About, Terms, Privacy) — slug, CKEditor content, SEO fields |
| **Ad** | Collection | Ad placement rules — targeted card slug, filter parameters (JSON), search tags (repeatable component), list position boolean flags (top/middle/bottom) |
| **Global** | Single | Site-wide settings — site name, favicon URL, default SEO metadata |
| **About** | Single | About page content |
| **Contact** | Single | Contact page — CKEditor content, email, phone, office hours |
| **HomePage** | Single | Homepage configuration — featured card slugs, most-viewed card slugs |

## User Roles

| Role | Description |
|------|-------------|
| **Content Editor** | Logs into Strapi admin panel to create, edit, and publish content across all collection types. |
| **Admin** | Full Strapi admin access — manages users, roles, permissions, plugins, and content type configuration. |
| **Public API** | The frontend (`paypayduck-web`) reads content via the REST API using a read-only API token. Write access is never granted to the public API. |

## Product Approach

- **Headless CMS:** Strapi exposes REST endpoints only. The frontend is fully decoupled — no server-side rendering in the CMS.
- **i18n throughout:** All major content types have Strapi i18n enabled. Default locale is `zh-HK`; secondary is `en`. Editors translate content per locale in the admin panel.
- **Draft & Publish workflow:** CreditCard, ShopOffer, BlogPost, HeroCarousel, Ad, and StaticPage use draft/publish. Editors can stage content before it goes live.
- **Rich text via CKEditor:** Long-form fields (blog body, static page content, offer descriptions, terms & conditions) use the CKEditor Strapi plugin. Output is HTML.
- **Custom field — credit-card-slugs:** A global custom field provides slug autocomplete across content types (ShopOffer, Ad, HomePage featured cards). Ensures referential consistency without a formal relation.
- **SQLite locally, cloud DB in production:** Development uses SQLite (better-sqlite3). Production runs on Strapi Cloud with a managed database.

## Changelog

| Date | Change |
|------|--------|
| 2026-04-27 | Initial concept document created via project-init |
