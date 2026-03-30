const { mergeConfig } = require('vite');

module.exports = (config) => {
  // Embed at build time. Strapi Cloud must expose one of these during `strapi build` (not only at runtime).
  // Prefer STRAPI_ADMIN_CKEDITOR_LICENSE_KEY — Strapi forwards STRAPI_ADMIN_* into the admin env.
  const ckeditorLicense =
    process.env.STRAPI_ADMIN_CKEDITOR_LICENSE_KEY ||
    process.env.CKEDITOR_LICENSE_KEY ||
    process.env.VITE_CKEDITOR_LICENSE_KEY ||
    '';

  return mergeConfig(config, {
    define: {
      // Inlined into the admin bundle; avoids import.meta.env merge issues with Strapi's Vite config.
      __STRAPI_CKEDITOR_LICENSE_KEY__: JSON.stringify(ckeditorLicense),
    },
  });
};
