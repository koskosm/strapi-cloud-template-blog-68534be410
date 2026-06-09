/**
 * Behaviour-level verification for GET /api/shop-offers/for-card (PPD-171).
 *
 * The CMS has no JS test runner, so this script asserts the endpoint's behaviour two ways:
 *
 *   1. PURE: exercises `buildCardScopedOffersPage` (the exact-segment match → classify →
 *      sort → slice pipeline that backs the controller) against fixture rows — runs offline.
 *   2. CONTROLLER: invokes the real `forCard(ctx)` action with a stubbed `strapi.db.query`
 *      so locale normalization, active/published filtering, exclusive-not-truncated, the
 *      partial-slug rejection, and the default `page_size`/explicit `page_size=6` are all
 *      checked through the actual handler.
 *
 * Run: node scripts/verify-for-card.mjs
 * Exit code 0 = all assertions pass (green); non-zero = failure (red).
 */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const controllerModule = require('../src/api/shop-offer/controllers/shop-offer.js');
const { buildCardScopedOffersPage } = controllerModule;

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

// ── PURE: buildCardScopedOffersPage ────────────────────────────────────────────
console.log('PURE: buildCardScopedOffersPage');

const SLUG = 'mox-credit';

{
  // Group order recommended → exclusive → non-exclusive; within group publishedAt desc;
  // tie-break id asc. A recommended+exclusive offer lands in the recommended group.
  const rows = [
    { id: 1, creditCardSlug: 'mox-credit,other', publishedAt: '2026-01-01T00:00:00.000Z' }, // non-exclusive
    { id: 2, creditCardSlug: 'mox-credit', isRecommended: true, publishedAt: '2026-02-01T00:00:00.000Z' }, // recommended
    { id: 3, creditCardSlug: 'mox-credit', publishedAt: '2026-03-01T00:00:00.000Z' }, // exclusive
    { id: 4, creditCardSlug: 'mox-credit', publishedAt: '2026-04-01T00:00:00.000Z' }, // exclusive (newer)
  ];
  const out = buildCardScopedOffersPage(rows, { slug: SLUG, page: 1, pageSize: 24 });
  eq(out.data.map((r) => r.id), [2, 4, 3, 1], 'recommended → exclusive(desc) → non-exclusive');
  eq(out.meta.pagination, { page: 1, pageSize: 24, total: 4, pageCount: 1 }, 'pagination meta');
}

{
  // The exclusive offer is OLDER than all the non-exclusive offers, yet still ranks ahead of them
  // (group precedence beats date) — the core PPD-171 truncation fix, at the ordering level.
  const rows = [
    { id: 10, creditCardSlug: 'mox-credit', publishedAt: '2020-01-01T00:00:00.000Z' }, // exclusive, ancient
    { id: 11, creditCardSlug: 'mox-credit,b', publishedAt: '2026-01-01T00:00:00.000Z' },
    { id: 12, creditCardSlug: 'mox-credit,c', publishedAt: '2026-02-01T00:00:00.000Z' },
  ];
  const out = buildCardScopedOffersPage(rows, { slug: SLUG, page: 1, pageSize: 6 });
  assert(out.data[0].id === 10, 'ancient exclusive offer ranks first despite oldest date');
}

{
  // Tie-break: equal/missing dates → id ascending; stable across page boundaries (no dupes/skips).
  const rows = [
    { id: 3, creditCardSlug: 'mox-credit,x' },
    { id: 1, creditCardSlug: 'mox-credit,x' },
    { id: 2, creditCardSlug: 'mox-credit,x' },
    { id: 4, creditCardSlug: 'mox-credit,x' },
  ];
  const p1 = buildCardScopedOffersPage(rows, { slug: SLUG, page: 1, pageSize: 2 });
  const p2 = buildCardScopedOffersPage(rows, { slug: SLUG, page: 2, pageSize: 2 });
  eq(p1.data.map((r) => r.id), [1, 2], 'page 1 tie-break id asc');
  eq(p2.data.map((r) => r.id), [3, 4], 'page 2 continues, no dupes/skips');
  eq(p1.meta.pagination.pageCount, 2, 'pageCount reflects full set');
}

{
  // Multi-card CSV including the slug → included, classified non-exclusive.
  const rows = [
    { id: 1, creditCardSlug: 'mox-credit,visa-platinum', publishedAt: '2026-01-01T00:00:00.000Z' },
    { id: 2, creditCardSlug: 'mox-credit', publishedAt: '2026-01-01T00:00:00.000Z' }, // exclusive
  ];
  const out = buildCardScopedOffersPage(rows, { slug: SLUG, page: 1, pageSize: 24 });
  eq(out.data.map((r) => r.id), [2, 1], 'multi-card offer ranks below the exclusive one (non-exclusive group)');
}

{
  // Exact-segment match: mox-credit must NOT return mox-credit-x-only offers.
  const rows = [
    { id: 1, creditCardSlug: 'mox-credit-x' },
    { id: 2, creditCardSlug: 'mox-credit' },
    { id: 3, creditCardSlug: 'x-mox-credit' },
  ];
  const out = buildCardScopedOffersPage(rows, { slug: SLUG, page: 1, pageSize: 24 });
  eq(out.data.map((r) => r.id), [2], 'only the exact-segment match is returned (no partial-slug false match)');
}

{
  // Whitespace / case in CSV segments still matches exactly.
  const rows = [{ id: 1, creditCardSlug: ' Mox-Credit , Other ' }];
  const out = buildCardScopedOffersPage(rows, { slug: SLUG, page: 1, pageSize: 24 });
  eq(out.data.map((r) => r.id), [1], 'segments are trimmed + lowercased before comparison');
}

{
  // Page beyond the last → empty data; pageCount still reflects total.
  const rows = [
    { id: 1, creditCardSlug: 'mox-credit' },
    { id: 2, creditCardSlug: 'mox-credit' },
  ];
  const out = buildCardScopedOffersPage(rows, { slug: SLUG, page: 5, pageSize: 2 });
  eq(out.data, [], 'page beyond last → empty data');
  assert(out.meta.pagination.page > out.meta.pagination.pageCount, 'page > pageCount signals end');
}

// ── CONTROLLER: real forCard(ctx) with a stubbed strapi.db.query ───────────────
console.log('CONTROLLER: forCard(ctx)');

function makeStrapi(allRows) {
  const queryCalls = [];
  return {
    queryCalls,
    contentType() {
      return { kind: 'collectionType', attributes: {} };
    },
    db: {
      query() {
        return {
          async findMany(args) {
            queryCalls.push(args);
            // Emulate the active/published/expiry $or clause the controller sends, so the
            // verification exercises the real `where` rather than re-implementing it here.
            const where = args?.where ?? {};
            const expiryOr = Array.isArray(where.$or) ? where.$or : null;
            return allRows.filter((r) => {
              if (r.publishedAt == null) return false;
              if (r.isActive === false) return false;
              // Expiry: pass if no $or clause OR (endDate null) OR (endDate >= the $gte bound).
              if (expiryOr) {
                const gte = expiryOr
                  .map((c) => c?.endDate?.$gte)
                  .find((v) => v != null);
                const endDate = r.endDate ?? null;
                const active =
                  endDate == null || (gte != null && String(endDate) >= String(gte));
                if (!active) return false;
              }
              const wantLocale = where.locale;
              if (wantLocale === undefined) return true; // locale-free pass returns all
              return r.locale === wantLocale;
            });
          },
        };
      },
    },
  };
}

async function callForCard(query, allRows) {
  const strapi = makeStrapi(allRows);
  const controller = controllerModule({ strapi });
  const ctx = { query, body: undefined };
  await controller.forCard(ctx);
  return { ctx, strapi };
}

const dbRows = [];
// 30 non-exclusive offers (newest), then one exclusive offer with an OLD publishedAt.
for (let i = 0; i < 30; i += 1) {
  dbRows.push({
    id: 100 + i,
    slug: `multi-${i}`,
    creditCardSlug: 'mox-credit,other-card',
    locale: 'en',
    isActive: true,
    publishedAt: `2026-05-${String((i % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
  });
}
dbRows.push({
  id: 1,
  slug: 'exclusive-old',
  creditCardSlug: 'mox-credit',
  locale: 'en',
  isActive: true,
  publishedAt: '2020-01-01T00:00:00.000Z',
});
// An inactive + an unpublished offer that must never surface.
dbRows.push({ id: 2, slug: 'inactive', creditCardSlug: 'mox-credit', locale: 'en', isActive: false, publishedAt: 'x' });
dbRows.push({ id: 3, slug: 'draft', creditCardSlug: 'mox-credit', locale: 'en', isActive: true, publishedAt: null });
// A partial-slug card offer that must be rejected.
dbRows.push({ id: 4, slug: 'wrong-card', creditCardSlug: 'mox-credit-x', locale: 'en', isActive: true, publishedAt: '2026-06-01T00:00:00.000Z' });

// PPD-171 QA: expiry must be excluded server-side, BEFORE pagination, matching the browse path
// (active = endDate null OR endDate >= today, local date; same-day offers stay active).
function localDateOffsetString(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const YESTERDAY = localDateOffsetString(-1);
const TODAY = localDateOffsetString(0);
// Expired (endDate before today) — must be filtered out of both the page AND the total.
dbRows.push({ id: 5, slug: 'expired-offer', creditCardSlug: 'mox-credit', locale: 'en', isActive: true, publishedAt: '2026-05-01T00:00:00.000Z', endDate: YESTERDAY });
// Ends exactly today — still ACTIVE (>= today), must remain.
dbRows.push({ id: 6, slug: 'ends-today', creditCardSlug: 'mox-credit', locale: 'en', isActive: true, publishedAt: '2026-05-02T00:00:00.000Z', endDate: TODAY });

{
  const { ctx } = await callForCard({ slug: 'mox-credit', page: '1', page_size: '6' }, dbRows);
  const ids = ctx.body.data.map((r) => r.slug);
  assert(ids.includes('exclusive-old'), 'exclusive offer (old date, outside newest-window) is on page 1');
  // Group precedence: every exclusive offer (single-card == mox-credit) ranks ahead of every
  // non-exclusive (multi-card) one, regardless of date. exclusive-old (2020) + ends-today (2026)
  // are both exclusive; the multi-* offers are non-exclusive.
  const lastExclusiveIdx = Math.max(ids.indexOf('exclusive-old'), ids.indexOf('ends-today'));
  const firstMultiIdx = ids.findIndex((s) => s.startsWith('multi-'));
  assert(
    firstMultiIdx === -1 || lastExclusiveIdx < firstMultiIdx,
    'exclusive offers rank ahead of all non-exclusive offers',
  );
  assert(ctx.body.data.length === 6, 'page_size=6 returns exactly 6');
  assert(!ids.includes('inactive') && !ids.includes('draft'), 'inactive + unpublished offers absent');
  assert(!ids.includes('wrong-card'), 'partial-slug (mox-credit-x) offer rejected');
}

{
  // PPD-171 QA: expired offers are excluded server-side, before pagination.
  const { ctx, strapi } = await callForCard({ slug: 'mox-credit', page: '1', page_size: '50' }, dbRows);
  const ids = ctx.body.data.map((r) => r.slug);
  // (a) the controller's where carries the endDate expiry $or clause on EVERY locale pass.
  assert(
    strapi.queryCalls.length > 0 &&
      strapi.queryCalls.every((c) =>
        Array.isArray(c?.where?.$or) &&
        c.where.$or.some((o) => o?.endDate?.$null === true) &&
        c.where.$or.some((o) => o?.endDate?.$gte != null),
      ),
    'where includes the endDate expiry $or clause ($null OR $gte today) on every locale pass',
  );
  // (b) the expired offer is absent from the page AND excluded from the total.
  assert(!ids.includes('expired-offer'), 'expired offer (endDate < today) is excluded from the page');
  // (c) the same-day offer (endDate == today) is still active and present.
  assert(ids.includes('ends-today'), 'offer ending exactly today is still active (>= today)');
  // (d) the total counts only active+non-expired offers — the expired one is not in it.
  const expectedActive = dbRows.filter((r) =>
    r.isActive !== false &&
    r.publishedAt != null &&
    (r.endDate == null || String(r.endDate) >= TODAY) &&
    r.creditCardSlug.split(',').map((s) => s.trim().toLowerCase()).includes('mox-credit'),
  ).length;
  assert(
    ctx.body.meta.pagination.total === expectedActive,
    `pagination.total excludes expired offers (expected ${expectedActive}, got ${ctx.body.meta.pagination.total})`,
  );
}

{
  // page_size omitted → default 24.
  const { ctx } = await callForCard({ slug: 'mox-credit', page: '1' }, dbRows);
  assert(ctx.body.meta.pagination.pageSize === 24, 'default page_size is 24 when omitted');
  assert(ctx.body.data.length === 24, 'returns 24 offers with the default page size');
}

{
  // ?locale=zh treated as zh-HK and the zh-HK rows come back.
  const zhRows = [
    { id: 1, slug: 'a', creditCardSlug: 'mox-credit', locale: 'zh-HK', name: '優惠', isActive: true, publishedAt: '2026-01-01T00:00:00.000Z' },
    { id: 2, slug: 'a', creditCardSlug: 'mox-credit', locale: 'en', name: 'Offer', isActive: true, publishedAt: '2026-01-01T00:00:00.000Z' },
  ];
  const { ctx, strapi } = await callForCard({ slug: 'mox-credit', locale: 'zh' }, zhRows);
  const first = ctx.body.data[0];
  assert(first.name === '優惠', '?locale=zh resolves to zh-HK rows (localized name)');
  assert(strapi.queryCalls.some((c) => c?.where?.locale === 'zh-HK'), 'queries the zh-HK locale');
  assert(!strapi.queryCalls.some((c) => c?.where?.locale === 'zh'), 'never queries the bare zh locale');
}

{
  // Locale fallback: requested locale empty → falls to en (withCardPreviews break-on-first-non-empty).
  const rows = [
    { id: 1, slug: 'a', creditCardSlug: 'mox-credit', locale: 'en', name: 'Offer EN', isActive: true, publishedAt: '2026-01-01T00:00:00.000Z' },
  ];
  const { ctx } = await callForCard({ slug: 'mox-credit', locale: 'zh' }, rows);
  assert(ctx.body.data.length === 1 && ctx.body.data[0].name === 'Offer EN', 'falls back to en when requested locale has no rows');
}

{
  // Every query uses a generous single-shot limit (no pageSize page loop).
  const { strapi } = await callForCard({ slug: 'mox-credit', page: '1', page_size: '6' }, dbRows);
  assert(strapi.queryCalls.length <= 3, `bounded query path (one per locale pass), got ${strapi.queryCalls.length}`);
  assert(
    strapi.queryCalls.every((c) => typeof c.limit === 'number' && c.limit >= 1000),
    'each query uses a generous single-shot limit',
  );
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log('\nAll for-card endpoint assertions passed.');
