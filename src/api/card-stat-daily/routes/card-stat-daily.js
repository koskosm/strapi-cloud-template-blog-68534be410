'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

// Disable all public CRUD routes — this collection is only accessed via the
// custom card-stats controller.
module.exports = createCoreRouter('api::card-stat-daily.card-stat-daily', {
  config: {
    find: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    findOne: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    create: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    update: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    delete: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
  },
});
