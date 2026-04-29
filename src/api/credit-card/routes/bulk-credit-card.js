'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/credit-cards/bulk',
      handler: 'credit-card.bulkByCsv',
      config: {
        auth: false,
      },
    },
  ],
};
