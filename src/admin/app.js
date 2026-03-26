const config = {
  locales: [],
};

export default {
  config,
  register(app) {
    app.customFields.register({
      name: 'credit-card-slugs',
      pluginId: 'global',
      type: 'text',
      intlLabel: {
        id: 'credit-card-slugs.label',
        defaultMessage: 'Credit card slugs',
      },
      intlDescription: {
        id: 'credit-card-slugs.description',
        defaultMessage: 'Comma-separated slugs with autocomplete per token.',
      },
      components: {
        Input: async () =>
          import('./components/CreditCardSlugsInput').then((module) => ({
            default: module.default,
          })),
      },
    });
  },
};
