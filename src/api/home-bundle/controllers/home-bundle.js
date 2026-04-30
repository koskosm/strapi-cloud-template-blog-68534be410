'use strict';

/**
 * home-bundle controller
 *
 * GET /api/home-bundle?locale=zh-HK
 *
 * Returns everything the homepage needs in one response:
 *   - heroCarousels
 *   - homePage config (titles, seo, featured/mostViewed slugs)
 *   - featuredCards  — CMS data resolved from featuredCardSlugs
 *   - mostViewedCards — CMS data resolved from mostViewedCardSlugs
 *
 * Eliminates the homepage waterfall: home-page config → extract slugs → N card CMS calls.
 */

module.exports = {
  async getBundle(ctx) {
    const locale = String(ctx.query.locale || 'en').trim();
    const strapi = ctx.strapi || globalThis.strapi;

    // ── 1. Fetch home-page single type ──────────────────────────────────────
    // Strapi 5: use documents().findFirst() for single types.
    // Try requested locale then fall back to 'en' then no locale.
    const homePageLocaleOrder = [locale, 'en', undefined].filter(
      (l, i, arr) => arr.indexOf(l) === i,
    );

    const homePagePopulate = {
      featuredOffers: {
        populate: {
          logo: true,
          merchant: { populate: { logo: true } },
          categories: true,
        },
      },
      featuredBlogPosts: {
        populate: {
          featuredImage: true,
          category: true,
          author: true,
        },
      },
      heroCarousels: {
        populate: {
          desktopImage: true,
          mobileImage: true,
        },
      },
    };

    let homePageData = null;
    for (const loc of homePageLocaleOrder) {
      try {
        const result = await strapi
          .documents('api::home-page.home-page')
          .findFirst({
            populate: homePagePopulate,
            ...(loc ? { locale: loc } : {}),
            status: 'published',
          });
        if (result) {
          homePageData = result;
          break;
        }
      } catch (_err) {
        // Try next locale
      }
    }

    // Extract slugs from home-page data (featuredCardSlugs / mostViewedCardSlugs are localized:false)
    const parseSlugsCsv = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
      return String(val)
        .split(/[,\n，]/)
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const featuredCardSlugs = parseSlugsCsv(homePageData?.featuredCardSlugs);
    const mostViewedCardSlugs = parseSlugsCsv(homePageData?.mostViewedCardSlugs);
    const allNeededSlugs = [...new Set([...featuredCardSlugs, ...mostViewedCardSlugs])];

    // ── 2. Bulk-fetch credit card CMS entries for the needed slugs ──────────
    // Use documents() API (Strapi 5) — entityService.findMany() with locale is broken in Strapi 5
    let cardCmsEntries = [];
    if (allNeededSlugs.length > 0) {
      const cardLocaleOrder = [locale, 'en', 'zh-HK', undefined].filter(
        (l, i, arr) => arr.indexOf(l) === i,
      );
      for (const loc of cardLocaleOrder) {
        try {
          const opts = {
            populate: ['cardFaceImage', 'keyMetrics'],
            status: 'published',
            limit: 500,
            start: 0,
            ...(loc ? { locale: loc } : {}),
          };
          const result = await strapi.documents('api::credit-card.credit-card').findMany(opts);
          if (Array.isArray(result) && result.length > 0) {
            cardCmsEntries = result;
            break;
          }
        } catch (_err) {
          // Try next locale
        }
      }
    }

    // Build slug → CMS entry map (first match wins per slug)
    const slugSet = new Set(allNeededSlugs.map((s) => s.toLowerCase()));
    const cardBySlug = new Map();
    for (const entry of cardCmsEntries) {
      const csv = String(entry.slugsCsv || '').trim();
      if (!csv) continue;
      const entrySlugs = csv
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      for (const slug of entrySlugs) {
        if (slugSet.has(slug) && !cardBySlug.has(slug)) {
          cardBySlug.set(slug, entry);
        }
      }
    }

    const resolveCardList = (slugs) =>
      slugs
        .map((slug) => {
          const entry = cardBySlug.get(slug.toLowerCase());
          if (!entry) return null;
          const imageObj = entry.cardFaceImage;
          const imageUrl = imageObj?.url || imageObj?.data?.url || null;
          return {
            slug: slug.toLowerCase(),
            name: String(entry.name || '').trim() || null,
            cardImage: imageUrl,
          };
        })
        .filter(Boolean);

    const featuredCards = resolveCardList(featuredCardSlugs);
    const mostViewedCards = resolveCardList(mostViewedCardSlugs);

    // ── 3. Assemble response ────────────────────────────────────────────────
    ctx.body = {
      data: {
        homePage: homePageData,
        featuredCardSlugs,
        mostViewedCardSlugs,
        featuredCards,
        mostViewedCards,
      },
    };
  },
};
