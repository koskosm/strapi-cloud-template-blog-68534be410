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
    const offerParams = {
      populate: ['logo', 'merchant', 'merchant.logo', 'eligibleCards'],
      pagination: { pageSize: 500, page: 1 },
      filters: { isActive: { $ne: false }, publishedAt: { $notNull: true } },
    };
    if (locale) {
      offerParams.locale = locale;
    }

    let offers = [];
    try {
      offers = await strapi.entityService.findMany('api::shop-offer.shop-offer', offerParams);
    } catch (_err) {
      // Locale may not exist — fall back to default
      try {
        const fallbackParams = { ...offerParams };
        delete fallbackParams.locale;
        offers = await strapi.entityService.findMany('api::shop-offer.shop-offer', fallbackParams);
      } catch (fallbackErr) {
        strapi.log.warn('[shop-offer] withCardPreviews: failed to fetch offers', fallbackErr);
        ctx.body = { data: [] };
        return;
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
      const localeOrder = [locale, 'en', 'zh', 'zh-HK', undefined].filter(
        (l, i, arr) => arr.indexOf(l) === i,
      );

      let cardEntries = [];
      for (const loc of localeOrder) {
        try {
          const cardParams = {
            populate: ['cardFaceImage'],
            pagination: { pageSize: 500, page: 1 },
            filters: { publishedAt: { $notNull: true } },
          };
          if (loc) cardParams.locale = loc;
          const result = await strapi.entityService.findMany('api::credit-card.credit-card', cardParams);
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
