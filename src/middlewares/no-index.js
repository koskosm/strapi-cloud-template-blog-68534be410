module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();
    ctx.set('X-Robots-Tag', 'noindex, nofollow');
  };
};
