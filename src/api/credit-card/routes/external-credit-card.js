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
    {
      method: 'GET',
      path: '/credit-cards/ckeditor-license',
      handler: 'credit-card.ckeditorLicense',
      config: {
        auth: false,
      },
    },
  ],
};
