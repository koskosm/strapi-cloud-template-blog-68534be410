'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/credit-cards/external/search',
      handler: 'credit-card.externalSearch',
      config: {
        auth: false,
      },
    },
  ],
};
