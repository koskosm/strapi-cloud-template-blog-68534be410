'use strict';

/**
 * card-stats controller
 *
 * Endpoints:
 *   POST /api/card-stats/detail-view   { slug, sessionId }
 *   POST /api/card-stats/search-top    { slug, sessionId }
 *   GET  /api/card-stats/top?type=detail_view&days=7&limit=10
 *
 * Rate limiting: 5 POST requests/min per IP (in-memory, resets on process restart).
 * Read cache: 60s in-memory cache keyed by (type, days, limit).
 * Session cap: max 5 detail_view increments per (sessionId, slug, day).
 * Lazy prune: GET top deletes rows older than 30 days before computing rollup.
 */

const SESSION_CAP = 5;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const READ_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const PRUNE_DAYS = 30;

// ── In-memory rate limiter ───────────────────────────────────────────────────
// Map<ip, { count, windowStart }>
const rateLimitStore = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  entry.count += 1;
  return false;
}

// ── In-memory read cache ─────────────────────────────────────────────────────
// Map<cacheKey, { data, expiresAt }>
const readCache = new Map();

function getCached(key) {
  const entry = readCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    readCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  readCache.set(key, { data, expiresAt: Date.now() + READ_CACHE_TTL_MS });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function getClientIp(ctx) {
  const forwarded = ctx.request.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return ctx.request.ip || 'unknown';
}

// ── Core upsert (SQLite-compatible via Strapi knex) ─────────────────────────

async function upsertDailyStat(strapi, type, slug, date) {
  const knex = strapi.db.connection;
  const client = knex.client.config.client;

  if (client === 'sqlite' || client === 'better-sqlite3') {
    await knex.raw(
      `INSERT INTO card_stat_dailies (date, slug, type, count, created_at, updated_at)
       VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
       ON CONFLICT(type, date, slug) DO UPDATE SET count = count + 1, updated_at = datetime('now')`,
      [date, slug, type],
    );
  } else {
    // PostgreSQL (production)
    await knex.raw(
      `INSERT INTO card_stat_dailies (date, slug, type, count, created_at, updated_at)
       VALUES (?, ?, ?, 1, NOW(), NOW())
       ON CONFLICT (type, date, slug) DO UPDATE SET count = card_stat_dailies.count + 1, updated_at = NOW()`,
      [date, slug, type],
    );
  }
}

async function upsertSessionCap(strapi, sessionId, slug, date) {
  const knex = strapi.db.connection;
  const client = knex.client.config.client;

  if (client === 'sqlite' || client === 'better-sqlite3') {
    await knex.raw(
      `INSERT INTO card_stat_session_caps (date, slug, session_id, count, created_at, updated_at)
       VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
       ON CONFLICT(date, slug, session_id) DO UPDATE SET count = count + 1, updated_at = datetime('now')`,
      [date, slug, sessionId],
    );
  } else {
    // PostgreSQL (production)
    await knex.raw(
      `INSERT INTO card_stat_session_caps (date, slug, session_id, count, created_at, updated_at)
       VALUES (?, ?, ?, 1, NOW(), NOW())
       ON CONFLICT (date, slug, session_id) DO UPDATE SET count = card_stat_session_caps.count + 1, updated_at = NOW()`,
      [date, slug, sessionId],
    );
  }

  const row = await knex('card_stat_session_caps')
    .where({ date, slug, session_id: sessionId })
    .first();
  return row ? row.count : 1;
}

async function pruneOldRows(strapi) {
  const cutoff = daysAgoStr(PRUNE_DAYS);
  const knex = strapi.db.connection;
  await knex('card_stat_dailies').where('date', '<', cutoff).delete();
}

// ── Exported controller ──────────────────────────────────────────────────────

module.exports = {
  /**
   * POST /api/card-stats/detail-view
   * Body: { slug: string, sessionId: string }
   */
  async recordDetailView(ctx) {
    const ip = getClientIp(ctx);
    if (isRateLimited(ip)) {
      ctx.status = 429;
      ctx.body = { error: 'Too many requests' };
      return;
    }

    const { slug, sessionId } = ctx.request.body || {};
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'slug is required' };
      return;
    }
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'sessionId is required' };
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    const cleanSession = sessionId.trim();
    const date = todayStr();
    const strapi = ctx.strapi || globalThis.strapi;

    // Check session cap before incrementing aggregate
    // First read existing cap count without incrementing
    const knex = strapi.db.connection;
    const capRow = await knex('card_stat_session_caps')
      .where({ date, slug: cleanSlug, session_id: cleanSession })
      .first();
    const currentCapCount = capRow ? capRow.count : 0;

    if (currentCapCount >= SESSION_CAP) {
      // Already at or over cap — no-op
      ctx.status = 200;
      ctx.body = { ok: true, capped: true };
      return;
    }

    // Increment session cap
    await upsertSessionCap(strapi, cleanSession, cleanSlug, date);

    // Upsert aggregate
    await upsertDailyStat(strapi, 'detail_view', cleanSlug, date);

    ctx.status = 200;
    ctx.body = { ok: true };
  },

  /**
   * POST /api/card-stats/search-top
   * Body: { slug: string, sessionId: string }
   */
  async recordSearchTop(ctx) {
    const ip = getClientIp(ctx);
    if (isRateLimited(ip)) {
      ctx.status = 429;
      ctx.body = { error: 'Too many requests' };
      return;
    }

    const { slug, sessionId } = ctx.request.body || {};
    if (!slug || typeof slug !== 'string' || !slug.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'slug is required' };
      return;
    }
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      ctx.status = 400;
      ctx.body = { error: 'sessionId is required' };
      return;
    }

    const cleanSlug = slug.trim().toLowerCase();
    const date = todayStr();
    const strapi = ctx.strapi || globalThis.strapi;

    await upsertDailyStat(strapi, 'search_top', cleanSlug, date);

    ctx.status = 200;
    ctx.body = { ok: true };
  },

  /**
   * GET /api/card-stats/top?type=detail_view&days=7&limit=10
   * Returns: [{ slug, count }] sorted desc by count
   */
  async getTop(ctx) {
    const type = String(ctx.query.type || 'detail_view').trim();
    const days = Math.max(1, Math.min(365, parseInt(ctx.query.days || '7', 10) || 7));
    const limit = Math.max(1, Math.min(50, parseInt(ctx.query.limit || '10', 10) || 10));

    if (type !== 'detail_view' && type !== 'search_top') {
      ctx.status = 400;
      ctx.body = { error: 'type must be detail_view or search_top' };
      return;
    }

    const cacheKey = `${type}:${days}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) {
      ctx.status = 200;
      ctx.body = cached;
      return;
    }

    const strapi = ctx.strapi || globalThis.strapi;

    // Lazy prune
    await pruneOldRows(strapi);

    const cutoffDate = daysAgoStr(days - 1); // inclusive: last `days` days including today
    const knex = strapi.db.connection;

    const rows = await knex('card_stat_dailies')
      .select('slug')
      .sum({ total: 'count' })
      .where('type', type)
      .where('date', '>=', cutoffDate)
      .groupBy('slug')
      .orderBy('total', 'desc')
      .limit(limit);

    const result = rows.map((r) => ({ slug: String(r.slug), count: Number(r.total) }));

    setCache(cacheKey, result);

    ctx.status = 200;
    ctx.body = result;
  },
};
