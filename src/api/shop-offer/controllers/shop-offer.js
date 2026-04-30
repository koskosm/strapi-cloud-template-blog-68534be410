'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

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
    const locale = String(ctx.query.locale || 'en').trim();

    // 1. Fetch all active shop offers with merchant/logo populate
    // Use documents() API (Strapi 5) — entityService.findMany() with locale is broken in Strapi 5
    const offerQueryOpts = {
      populate: ['logo', 'merchant', 'merchant.logo', 'eligibleCards', 'categories'],
      status: 'published',
      filters: { isActive: { $ne: false } },
      limit: 500,
      start: 0,
    };

    let offers = [];
    const localeOrderOffers = [locale, 'en', undefined].filter((l, i, arr) => arr.indexOf(l) === i);
    for (const loc of localeOrderOffers) {
      try {
        const opts = { ...offerQueryOpts, ...(loc ? { locale: loc } : {}) };
        const result = await strapi.documents('api::shop-offer.shop-offer').findMany(opts);
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
          const opts = {
            populate: ['cardFaceImage'],
            status: 'published',
            limit: 500,
            start: 0,
            ...(loc ? { locale: loc } : {}),
          };
          const result = await strapi.documents('api::credit-card.credit-card').findMany(opts);
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
}));
