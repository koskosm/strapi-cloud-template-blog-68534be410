'use strict';

/**
 * welcome-offer service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::welcome-offer.welcome-offer');
