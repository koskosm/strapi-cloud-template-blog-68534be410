/**
 * Behaviour-level verification for GET /api/shop-offers/suggestions (PPD-172).
 *
 * The CMS has no JS test runner, so this script asserts the endpoint's behaviour two ways:
 *
 *   1. PURE: exercises `buildSuggestionsFromLocaleRows` (the cross-locale aggregation that
 *      backs the controller) against fixture rows — runs offline, no Strapi needed.
 *   2. CONTROLLER: invokes the real `suggestions(ctx)` action with a stubbed `strapi.db.query`
 *      so locale normalization, active-only filtering, the multi-locale union, and the minimal
 *      response shape are all checked through the actual handler.
 *
 * Run: node scripts/verify-suggestions.mjs
 * Exit code 0 = all assertions pass (green); non-zero = failure (red).
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const controllerModule = require('../src/api/shop-offer/controllers/shop-offer.js');
const { buildSuggestionsFromLocaleRows } = controllerModule;

let failures = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ok  - ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${msg}`);
  }
}
function eq(actual, expected, msg) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${msg} (got ${JSON.stringify(actual)})`,
  );
}

// ── Fixtures: two cross-locale offers, one single-locale offer ────────────────
const rows = [
  { slug: 'sushiro-8', name: '壽司郎 8 折', locale: 'zh-HK', isActive: true, publishedAt: 'x' },
  { slug: 'sushiro-8', name: 'Sushiro 8% off', locale: 'en', isActive: true, publishedAt: 'x' },
  { slug: 'cafe-deal', name: 'Cafe Deal', locale: 'en', isActive: true, publishedAt: 'x' },
];

console.log('PURE: buildSuggestionsFromLocaleRows');

{
  const out = buildSuggestionsFromLocaleRows(rows, 'zh-HK');
  const sushiro = out.find((o) => o.slug === 'sushiro-8');
  // Minimal shape: exactly slug/name/allLocaleNames, nothing else.
  eq(Object.keys(sushiro).sort(), ['allLocaleNames', 'name', 'slug'], 'entry has only slug/name/allLocaleNames');
  // name = requested-locale (zh-HK) title.
  assert(sushiro.name === '壽司郎 8 折', 'zh-HK name is the zh-HK title');
  // allLocaleNames has BOTH titles regardless of requested locale.
  assert(
    sushiro.allLocaleNames.includes('壽司郎 8 折') && sushiro.allLocaleNames.includes('Sushiro 8% off'),
    'allLocaleNames contains both zh-HK + en titles',
  );
}

{
  const out = buildSuggestionsFromLocaleRows(rows, 'en');
  const sushiro = out.find((o) => o.slug === 'sushiro-8');
  assert(sushiro.name === 'Sushiro 8% off', 'en name is the en title');
}

{
  // Requested locale (zh-HK) missing for cafe-deal -> falls back to en name, still appears.
  const out = buildSuggestionsFromLocaleRows(rows, 'zh-HK');
  const cafe = out.find((o) => o.slug === 'cafe-deal');
  assert(Boolean(cafe), 'offer missing in requested locale still appears (fallback)');
  assert(cafe.name === 'Cafe Deal', 'fallback name comes from an available locale');
}

{
  // Empty slug / empty name rows are excluded.
  const out = buildSuggestionsFromLocaleRows(
    [{ slug: '', name: 'no slug', locale: 'en' }, { slug: 'x', name: '', locale: 'en' }],
    'en',
  );
  eq(out, [], 'rows with empty slug or empty name are excluded');
}

// ── CONTROLLER: real suggestions(ctx) with a stubbed strapi.db.query ──────────
console.log('CONTROLLER: suggestions(ctx)');

function makeStrapi(allRows) {
  const queryCalls = [];
  return {
    queryCalls,
    // createCoreController() introspects the content type when the factory is invoked.
    contentType() {
      return { kind: 'collectionType', attributes: {} };
    },
    db: {
      query() {
        return {
          async findMany(args) {
            queryCalls.push(args);
            // Emulate Strapi: filter active + published, and by locale when provided.
            return allRows.filter((r) => {
              if (r.publishedAt == null) return false;
              if (r.isActive === false) return false;
              const wantLocale = args?.where?.locale;
              if (wantLocale === undefined) return true; // locale-free pass returns all
              return r.locale === wantLocale;
            });
          },
        };
      },
    },
  };
}

const dbRows = [
  { slug: 'sushiro-8', name: '壽司郎 8 折', locale: 'zh-HK', isActive: true, publishedAt: 'x' },
  { slug: 'sushiro-8', name: 'Sushiro 8% off', locale: 'en', isActive: true, publishedAt: 'x' },
  { slug: 'inactive', name: 'Inactive Offer', locale: 'en', isActive: false, publishedAt: 'x' },
  { slug: 'draft', name: 'Draft Offer', locale: 'en', isActive: true, publishedAt: null },
];

async function callController(localeParam, allRows) {
  const strapi = makeStrapi(allRows);
  const controller = controllerModule({ strapi });
  const ctx = { query: { locale: localeParam }, body: undefined };
  await controller.suggestions(ctx);
  return { ctx, strapi };
}

{
  const { ctx } = await callController('zh-HK', dbRows);
  const data = ctx.body.data;
  const slugs = data.map((d) => d.slug).sort();
  eq(slugs, ['sushiro-8'], 'only active+published offers appear (inactive & draft absent)');
  const sushiro = data.find((d) => d.slug === 'sushiro-8');
  assert(sushiro.name === '壽司郎 8 折', 'controller returns zh-HK name for ?locale=zh-HK');
  assert(
    sushiro.allLocaleNames.includes('壽司郎 8 折') && sushiro.allLocaleNames.includes('Sushiro 8% off'),
    'controller unions names across locales',
  );
}

{
  // ?locale=zh is treated as zh-HK.
  const { ctx } = await callController('zh', dbRows);
  const sushiro = ctx.body.data.find((d) => d.slug === 'sushiro-8');
  assert(sushiro && sushiro.name === '壽司郎 8 折', '?locale=zh resolves to zh-HK title');
}

{
  // No client paging: handler runs a bounded number of queries (one per locale pass), not page loops.
  const { strapi } = await callController('en', dbRows);
  assert(strapi.queryCalls.length <= 3, `single bounded query path (one per locale pass), got ${strapi.queryCalls.length}`);
  assert(
    strapi.queryCalls.every((c) => typeof c.limit === 'number' && c.limit >= 1000),
    'each query uses a generous single-shot limit (no pageSize loop)',
  );
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('\nAll suggestions endpoint assertions passed.');
