'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit-card.credit-card', ({ strapi }) => ({
  async externalSearch(ctx) {
    const query = String(ctx.query.q || '').trim();
    const service = strapi.service('api::credit-card.credit-card');
    const results = await service.searchExternalCards(query);
    ctx.body = { data: results };
  },

  /**
   * GET /api/credit-cards/bulk?slugs=slug-a,slug-b&locale=zh-HK
   *
   * Returns CMS data for all matching credit card entries in one query.
   * `slugsCsv` is a plain text CSV field, so we fetch all entries for the locale
   * and filter server-side to avoid N+1 per-slug queries.
   *
   * Response: { data: [{ slugsCsv, name, cardFaceImage, ... }] }
   */
  async bulkByCsv(ctx) {
    const rawSlugs = String(ctx.query.slugs || '').trim();
    const locale = String(ctx.query.locale || 'en').trim();

    if (!rawSlugs) {
      ctx.body = { data: [] };
      return;
    }

    const requestedSlugs = rawSlugs
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (requestedSlugs.length === 0) {
      ctx.body = { data: [] };
      return;
    }

    // Fetch all published credit card entries for the requested locale.
    // We filter server-side because slugsCsv is a plain text field (not a relation),
    // so Strapi's built-in $in filter cannot be used.
    // Use documents() API (Strapi 5) — entityService.findMany() with locale is broken in Strapi 5
    const localeToTry = [locale, 'en', 'zh-HK', undefined].filter(
      (l, i, arr) => arr.indexOf(l) === i,
    );

    let entries = [];
    for (const loc of localeToTry) {
      try {
        const opts = {
          populate: ['cardFaceImage', 'keyMetrics', 'staticContents'],
          status: 'published',
          limit: 500,
          start: 0,
          ...(loc ? { locale: loc } : {}),
        };
        const result = await strapi.documents('api::credit-card.credit-card').findMany(opts);
        if (Array.isArray(result) && result.length > 0) {
          entries = result;
          break;
        }
      } catch (_err) {
        // Try next locale
      }
    }

    // Filter entries whose slugsCsv contains any of the requested slugs.
    // Each CMS entry may cover multiple slugs (comma-separated).
    const slugSet = new Set(requestedSlugs);

    const matched = entries.filter((entry) => {
      const csv = String(entry.slugsCsv || '').trim();
      if (!csv) return false;
      const entrySlugs = csv
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      return entrySlugs.some((s) => slugSet.has(s));
    });

    ctx.body = { data: matched };
  },
}));
