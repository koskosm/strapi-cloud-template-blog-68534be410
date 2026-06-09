'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

/** Locales registered for the shop-offer collection (i18n: zh-HK default + en). */
const SUGGESTION_LOCALES = ['zh-HK', 'en'];

/** Generous bound so a single query returns the full active set (catalog ~1,087 today). */
const SUGGESTION_QUERY_LIMIT = 2000;

/** Default page size for the card-scoped offers endpoint when `page_size` is omitted (PPD-171). */
const CARD_OFFERS_DEFAULT_PAGE_SIZE = 24;

/** Parse a `creditCardSlug` CSV into trimmed, lowercased, non-empty slug segments. */
function parseSlugSegments(csv) {
  return String(csv || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Card-scoped, group-ordered, paginated page builder (PPD-171, pure).
 *
 * Mirrors the frontend `shopOfferMatchesCardSlug` / `isOfferExclusiveToCard` / `orderOffersForCard`
 * rules so client and server classification stay identical:
 *  - EXACT slug-segment match: split `creditCardSlug` on `,`, trim + lowercase, compare equality —
 *    rejects partial-slug false matches (`mox-credit-x` must NOT match `mox-credit`).
 *  - Classify into recommended (`isRecommended === true`) → exclusive (CSV has exactly ONE segment
 *    equal to the slug) → non-exclusive (multi-card linked to this card). A recommended+exclusive
 *    offer lands in the recommended group.
 *  - Sort each group by `publishedAt ?? createdAt` DESC; tie-break `id` ascending (string compare),
 *    so ordering is stable across page boundaries.
 *  - Concatenate groups → full ordered set, then slice the requested page.
 *
 * @param {Array<{id?: unknown, creditCardSlug?: string, isRecommended?: boolean, publishedAt?: string, createdAt?: string}>} rows
 * @param {{slug: string, page: number, pageSize: number}} opts
 * @returns {{ data: Array<object>, meta: { pagination: { page: number, pageSize: number, total: number, pageCount: number } } }}
 */
function buildCardScopedOffersPage(rows, { slug, page, pageSize }) {
  const key = String(slug || '').trim().toLowerCase();
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : CARD_OFFERS_DEFAULT_PAGE_SIZE;
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;

  const matching = (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!key) return false;
    return parseSlugSegments(row?.creditCardSlug).includes(key);
  });

  const recommended = [];
  const exclusive = [];
  const nonExclusive = [];
  for (const row of matching) {
    const segments = parseSlugSegments(row?.creditCardSlug);
    if (row?.isRecommended === true) recommended.push(row);
    else if (segments.length === 1 && segments[0] === key) exclusive.push(row);
    else nonExclusive.push(row);
  }

  const dateMs = (row) => {
    const raw = String(row?.publishedAt || '').trim() || String(row?.createdAt || '').trim();
    if (!raw) return 0;
    const t = Date.parse(raw);
    return Number.isNaN(t) ? 0 : t;
  };
  const sortGroup = (group) =>
    [...group].sort((a, b) => {
      const diff = dateMs(b) - dateMs(a);
      if (diff !== 0) return diff;
      return String(a?.id).localeCompare(String(b?.id));
    });

  const ordered = [...sortGroup(recommended), ...sortGroup(exclusive), ...sortGroup(nonExclusive)];
  const total = ordered.length;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const start = (safePage - 1) * safePageSize;
  const data = ordered.slice(start, start + safePageSize);

  return {
    data,
    meta: { pagination: { page: safePage, pageSize: safePageSize, total, pageCount } },
  };
}

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

  /**
   * GET /api/shop-offers/for-card?slug=<card>&page=1&page_size=6&locale=zh-HK
   *
   * Card-scoped, group-ordered, paginated offers (PPD-171). Returns the offers linked to ONE
   * credit-card slug, grouped (recommended → exclusive → non-exclusive) and ordered
   * (`publishedAt ?? createdAt` desc, tie-break `id` asc) across the WHOLE matching set, THEN
   * paginated — so a card's exclusive/recommended offer can never be truncated out of page 1
   * even when the card has 100+ offers.
   *
   * Mirrors `withCardPreviews`' cross-locale `strapi.db.query` fetch (Strapi 5 REST `locale`
   * returns 0 rows for localized collection types): iterate `[locale, 'en', undefined]`, break on
   * the first non-empty pass (full offer rows for that locale — NOT a per-offer union like
   * `suggestions`). The CSV exact-segment match + classification live in the pure
   * `buildCardScopedOffersPage` helper so partial-slug false matches stay testable.
   *
   * Response: { data: [...offers], meta: { pagination: { page, pageSize, total, pageCount } } }
   */
  async forCard(ctx) {
    const rawLocale = String(ctx.query.locale || 'en').trim();
    const locale = rawLocale === 'zh' ? 'zh-HK' : rawLocale;
    const slug = String(ctx.query.slug || '').trim();
    const page = Number.parseInt(String(ctx.query.page ?? ''), 10) || 1;
    const pageSizeRaw = Number.parseInt(String(ctx.query.page_size ?? ''), 10);
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? pageSizeRaw : CARD_OFFERS_DEFAULT_PAGE_SIZE;

    if (!slug) {
      ctx.body = { data: [], meta: { pagination: { page, pageSize, total: 0, pageCount: 1 } } };
      return;
    }

    // Fetch the full active+published candidate set across locales, mirroring withCardPreviews:
    // break on the first non-empty locale pass (one locale's full rows).
    //
    // Exclude EXPIRED offers server-side, BEFORE pagination, so both the returned page and
    // `pagination.total` count only genuinely-active offers (PPD-171 QA). Active = no endDate OR
    // `endDate >= today` — `today` is the server LOCAL calendar date (YYYY-MM-DD), so an offer
    // ending exactly today is still active. This matches the browse path's `appendActiveFilter`
    // (offers-server-query.ts) and the client `isShopOfferExpired` (`endDate < today` → expired).
    const today = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })();
    const localeOrder = [locale, 'en', undefined].filter((l, i, arr) => arr.indexOf(l) === i);
    let rows = [];
    for (const loc of localeOrder) {
      try {
        const where = {
          publishedAt: { $notNull: true },
          isActive: { $ne: false },
          $or: [{ endDate: { $null: true } }, { endDate: { $gte: today } }],
        };
        if (loc) where.locale = loc;
        const result = await strapi.db.query('api::shop-offer.shop-offer').findMany({
          where,
          populate: { logo: true, merchant: { populate: { logo: true } }, categories: true },
          orderBy: { publishedAt: 'desc' },
          limit: SUGGESTION_QUERY_LIMIT,
          offset: 0,
        });
        if (Array.isArray(result) && result.length > 0) {
          rows = result;
          break;
        }
      } catch (_err) {
        // Try the next locale pass.
      }
    }

    ctx.body = buildCardScopedOffersPage(rows, { slug, page, pageSize });
  },
}));

// Exported for behaviour-level verification (CMS has no JS test runner).
module.exports.buildSuggestionsFromLocaleRows = buildSuggestionsFromLocaleRows;
module.exports.buildCardScopedOffersPage = buildCardScopedOffersPage;
