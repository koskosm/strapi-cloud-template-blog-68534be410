'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/home-bundle',
      handler: 'home-bundle.getBundle',
      config: {
        auth: false,
      },
    },
  ],
};
