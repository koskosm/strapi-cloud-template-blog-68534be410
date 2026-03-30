'use strict';
const bootstrap = require("./bootstrap");

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    strapi.customFields.register({
      name: 'credit-card-slugs',
      type: 'text',
      inputSize: {
        default: 12,
        isResizable: true,
      },
    });

    // Serve CKEditor license before the content API router so Users & Permissions
    // scope checks cannot return 403 (Strapi Cloud / custom routes).
    const apiPrefix = strapi.config.get('api.rest.prefix', '/api');
    const ckeditorLicensePath = `${apiPrefix}/credit-cards/ckeditor-license`;
    strapi.server.use(async (ctx, next) => {
      if (ctx.method !== 'GET' || ctx.path !== ckeditorLicensePath) {
        return next();
      }
      const licenseKey =
        strapi.config.get('custom.ckeditorLicenseKey') ||
        process.env.CKEDITOR_LICENSE_KEY ||
        process.env.STRAPI_ADMIN_CKEDITOR_LICENSE_KEY ||
        '';
      ctx.set('Cache-Control', 'no-store');
      ctx.type = 'application/json';
      ctx.body = { licenseKey };
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap,
};
