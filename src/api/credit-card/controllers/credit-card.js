'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit-card.credit-card', ({ strapi }) => ({
  async externalSearch(ctx) {
    const query = String(ctx.query.q || '').trim();
    const service = strapi.service('api::credit-card.credit-card');
    const results = await service.searchExternalCards(query);
    ctx.body = { data: results };
  },
}));
