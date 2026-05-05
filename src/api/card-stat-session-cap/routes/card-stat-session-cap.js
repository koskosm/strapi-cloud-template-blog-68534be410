'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

// Disable all public CRUD routes
module.exports = createCoreRouter('api::card-stat-session-cap.card-stat-session-cap', {
  config: {
    find: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    findOne: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    create: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    update: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
    delete: { auth: { scope: ['admin::isAuthenticatedAdmin'] } },
  },
});
