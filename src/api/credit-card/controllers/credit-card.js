'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit-card.credit-card', ({ strapi }) => ({
  async externalSearch(ctx) {
    const query = String(ctx.query.q || '').trim();
    const service = strapi.service('api::credit-card.credit-card');
    const results = await service.searchExternalCards(query);
    ctx.body = { data: results };
  },

  async ckeditorLicense(ctx) {
    const licenseKey =
      strapi.config.get('custom.ckeditorLicenseKey') ||
      process.env.CKEDITOR_LICENSE_KEY ||
      process.env.STRAPI_ADMIN_CKEDITOR_LICENSE_KEY ||
      '';
    ctx.set('Cache-Control', 'no-store');
    ctx.body = { licenseKey };
  },
}));
