'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

/** Locales registered for the shop-offer collection (i18n: zh-HK default + en). */
const SUGGESTION_LOCALES = ['zh-HK', 'en'];

/** Generous bound so a single query returns the full active set (catalog ~1,087 today). */
const SUGGESTION_QUERY_LIMIT = 2000;

/**
 * Pure cross-locale aggregation for the suggestions endpoint.
 *
 * Groups offer rows (potentially one per locale) by their shared non-localized `slug`
 * and produces the minimal autocomplete shape:
 *   { slug, name, allLocaleNames }
 *
 * - `name` is the display name in the requested locale; if the requested locale has no
 *   row for a slug, it falls back to a name from another locale so the offer still appears.
 * - `allLocaleNames` is the de-duplicated union of that offer's names across every locale,
 *   used by the client for cross-locale autocomplete matching.
 * - Entries with an empty slug or no usable name are excluded.
 *
 * @param {Array<{slug?: string, name?: string, locale?: string}>} rows
 * @param {string} requestedLocale - normalized locale (e.g. 'zh-HK' | 'en')
 * @returns {Array<{slug: string, name: string, allLocaleNames: string[]}>}
 */
function buildSuggestionsFromLocaleRows(rows, requestedLocale) {
  const namesBySlug = new Map(); // slug -> ordered Set of trimmed names (union)
  const displayNameBySlug = new Map(); // slug -> requested-locale name
  const fallbackNameBySlug = new Map(); // slug -> first available name (any locale)
  const slugOrder = []; // preserve first-seen ordering

  for (const row of Array.isArray(rows) ? rows : []) {
    const slug = String(row?.slug || '').trim();
    const name = String(row?.name || '').trim();
    if (!slug || !name) continue;

    if (!namesBySlug.has(slug)) {
      namesBySlug.set(slug, new Set());
      slugOrder.push(slug);
    }
    namesBySlug.get(slug).add(name);

    if (!fallbackNameBySlug.has(slug)) fallbackNameBySlug.set(slug, name);
    if (row?.locale === requestedLocale && !displayNameBySlug.has(slug)) {
      displayNameBySlug.set(slug, name);
    }
  }

  const result = [];
  for (const slug of slugOrder) {
    const name = displayNameBySlug.get(slug) ?? fallbackNameBySlug.get(slug);
    if (!name) continue;
    result.push({
      slug,
      name,
      allLocaleNames: [...namesBySlug.get(slug)],
    });
  }
  return result;
}

module.exports = createCoreController('api::shop-offer.shop-offer', ({ strapi }) => ({
  /**
   * GET /api/shop-offers/with-card-previews?locale=zh-HK
   *
   * Returns all active shop offers, each enriched with a `cardPreview` object
   * containing the linked credit card's CMS name and cardFaceImage URL.
   *
   * This eliminates the N+1 pattern where the frontend fetches one CMS entry
   * per offer's creditCardSlug.
   *
   * Response: { data: [{ ...offer, cardPreview: { name, cardImage } | null }] }
   */
  async withCardPreviews(ctx) {
    const rawLocale = String(ctx.query.locale || 'en').trim();
    const locale = rawLocale === 'zh' ? 'zh-HK' : rawLocale;

    // 1. Fetch all active shop offers with merchant/logo populate
    // Use db.query() — documents() and entityService both silently return 0 for localized
    // collection types in this Strapi 5 version; db.query() hits the DB directly.
    const localeOrderOffers = [locale, 'en', undefined].filter((l, i, arr) => arr.indexOf(l) === i);
    let offers = [];
    for (const loc of localeOrderOffers) {
      try {
        const where = { publishedAt: { $notNull: true }, isActive: { $ne: false } };
        if (loc) where.locale = loc;
        const result = await strapi.db.query('api::shop-offer.shop-offer').findMany({
          where,
          populate: { logo: true, merchant: { populate: { logo: true } }, eligibleCards: true, categories: true },
          orderBy: { publishedAt: 'desc' },
          limit: 500,
          offset: 0,
        });
        if (Array.isArray(result) && result.length > 0) {
          offers = result;
          break;
        }
      } catch (_err) {
        // Try next locale
      }
    }

    if (!Array.isArray(offers) || offers.length === 0) {
      ctx.body = { data: [] };
      return;
    }

    // 2. Collect unique card slugs from all offers
    const offerSlugsSet = new Set();
    for (const offer of offers) {
      const slug = String(offer.creditCardSlug || '').trim().toLowerCase();
      if (slug) offerSlugsSet.add(slug);
    }

    // 3. Fetch all credit card CMS entries and build a slug → preview map
    const cardPreviewMap = new Map();
    if (offerSlugsSet.size > 0) {
      const localeOrder = [locale, 'en', 'zh-HK', undefined].filter(
        (l, i, arr) => arr.indexOf(l) === i,
      );

      let cardEntries = [];
      for (const loc of localeOrder) {
        try {
          const where = { publishedAt: { $notNull: true } };
          if (loc) where.locale = loc;
          const result = await strapi.db.query('api::credit-card.credit-card').findMany({
            where,
            populate: { cardFaceImage: true },
            limit: 500,
            offset: 0,
          });
          if (Array.isArray(result) && result.length > 0) {
            cardEntries = result;
            break;
          }
        } catch (_err) {
          // Try next locale
        }
      }

      for (const entry of cardEntries) {
        const csv = String(entry.slugsCsv || '').trim();
        if (!csv) continue;
        const entrySlugs = csv
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        for (const slug of entrySlugs) {
          if (offerSlugsSet.has(slug) && !cardPreviewMap.has(slug)) {
            const imageObj = entry.cardFaceImage;
            const imageUrl = imageObj?.url || imageObj?.data?.url || null;
            cardPreviewMap.set(slug, {
              name: String(entry.name || '').trim() || null,
              cardImage: imageUrl,
            });
          }
        }
      }
    }

    // 4. Attach cardPreview to each offer
    const enriched = offers.map((offer) => {
      const slug = String(offer.creditCardSlug || '').trim().toLowerCase();
      const cardPreview = slug ? (cardPreviewMap.get(slug) ?? null) : null;
      return { ...offer, cardPreview };
    });

    ctx.body = { data: enriched };
  },

  /**
   * GET /api/shop-offers/suggestions?locale=zh-HK
   *
   * Lightweight autocomplete feed for the /offers search-suggestions dropdown.
   *
   * Returns only the minimal shape per active offer:
   *   { slug, name, allLocaleNames }
   * with NO logo / merchant / description / T&C / cardPreview. The cross-locale name union
   * is computed server-side so the client never pages the full catalog per locale.
   *
   * Mirrors `withCardPreviews`' use of `strapi.db.query()` because the Strapi 5 REST `locale`
   * param silently returns 0 rows for localized collection types. Unlike `withCardPreviews`
   * (which only needs one locale's rows and breaks on the first non-empty result), this MUST
   * read EVERY locale and union the names — otherwise cross-locale matching is lost.
   *
   * Response: { data: [{ slug, name, allLocaleNames }] }
   */
  async suggestions(ctx) {
    const rawLocale = String(ctx.query.locale || 'en').trim();
    const locale = rawLocale === 'zh' ? 'zh-HK' : rawLocale;

    // Read every registered locale (plus a locale-free safety pass), accumulating rows.
    // De-dupe the pass list like withCardPreviews does.
    const localePasses = [...SUGGESTION_LOCALES, undefined].filter(
      (l, i, arr) => arr.indexOf(l) === i,
    );

    const rows = [];
    for (const loc of localePasses) {
      try {
        const where = { publishedAt: { $notNull: true }, isActive: { $ne: false } };
        if (loc) where.locale = loc;
        const result = await strapi.db.query('api::shop-offer.shop-offer').findMany({
          where,
          select: ['slug', 'name', 'locale', 'isActive', 'publishedAt'],
          limit: SUGGESTION_QUERY_LIMIT,
          offset: 0,
        });
        if (Array.isArray(result)) {
          for (const r of result) rows.push(r);
        }
      } catch (_err) {
        // Skip this locale pass; continue accumulating from the others.
      }
    }

    ctx.body = { data: buildSuggestionsFromLocaleRows(rows, locale) };
  },
}));

// Exported for behaviour-level verification (CMS has no JS test runner).
module.exports.buildSuggestionsFromLocaleRows = buildSuggestionsFromLocaleRows;
