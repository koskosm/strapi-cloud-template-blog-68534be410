'use strict';

module.exports = ({ env }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': ["'self'", 'https://cdn.ckeditor.com'],
          'connect-src': ["'self'", 'https://proxy-event.ckeditor.com'],
          'img-src': ["'self'", 'data:', 'blob:', 'https://fly.storage.tigris.dev', 'https://*.fly.storage.tigris.dev'],
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'https://looklookduck-web.fly.dev',
        env('FRONTEND_URL', 'https://looklookduck-web.fly.dev'),
      ],
      headers: ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
