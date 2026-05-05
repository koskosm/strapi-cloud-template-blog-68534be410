'use strict';

const { errors } = require('@strapi/utils');

module.exports = {
  async beforeCreate(event) {
    await normalizeAndValidateSlugs(event);
  },

  async beforeUpdate(event) {
    await normalizeAndValidateSlugs(event);
  },
};

async function normalizeAndValidateSlugs(event) {
  const data = event.params?.data;
  if (!data || !Object.prototype.hasOwnProperty.call(data, 'slugsCsv')) {
    return;
  }

  const service = strapi.service('api::credit-card.credit-card');
  const normalized = service.normalizeSlugsCsv(data.slugsCsv);

  if (!normalized) {
    throw new errors.ApplicationError('Please enter at least one credit card slug.');
  }

  const invalidSlugs = await service.getInvalidSlugs(normalized);
  if (invalidSlugs.length > 0) {
    throw new errors.ApplicationError(`Invalid credit card slug(s): ${invalidSlugs.join(', ')}`);
  }

  data.slugsCsv = normalized;
}
