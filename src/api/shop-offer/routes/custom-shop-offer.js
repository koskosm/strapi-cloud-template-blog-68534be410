'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/shop-offers/with-card-previews',
      handler: 'shop-offer.withCardPreviews',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/shop-offers/suggestions',
      handler: 'shop-offer.suggestions',
      config: {
        auth: false,
      },
    },
  ],
};
