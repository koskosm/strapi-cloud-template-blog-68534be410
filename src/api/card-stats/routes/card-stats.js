'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/card-stats/detail-view',
      handler: 'card-stats.recordDetailView',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/card-stats/search-top',
      handler: 'card-stats.recordSearchTop',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/card-stats/top',
      handler: 'card-stats.getTop',
      config: {
        auth: false,
      },
    },
  ],
};
