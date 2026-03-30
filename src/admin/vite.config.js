const { mergeConfig } = require('vite');

module.exports = (config) => {
  const ckeditorLicense =
    process.env.CKEDITOR_LICENSE_KEY || process.env.VITE_CKEDITOR_LICENSE_KEY || '';

  return mergeConfig(config, {
    define: {
      'import.meta.env.VITE_CKEDITOR_LICENSE_KEY': JSON.stringify(ckeditorLicense),
    },
  });
};
