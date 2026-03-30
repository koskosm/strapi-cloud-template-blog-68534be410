module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          // Keep 'self' so the admin bundle can load; append CKEditor CDN (see CKEditor Strapi plugin README).
          'script-src': ["'self'", 'https://cdn.ckeditor.com'],
          'connect-src': ["'self'", 'https://proxy-event.ckeditor.com'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
