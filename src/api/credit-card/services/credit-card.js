'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::credit-card.credit-card', ({ strapi }) => ({
  normalizeSlugsCsv(value) {
    if (typeof value !== 'string') {
      return '';
    }

    const unique = new Set(
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    );

    return Array.from(unique).join(',');
  },

  async getInvalidSlugs(csvValue) {
    const slugs = this.normalizeSlugsCsv(csvValue)
      .split(',')
      .filter(Boolean);

    const validationChecks = await Promise.all(
      slugs.map(async (slug) => {
        const card = await this.fetchCardBySlug(slug);
        return { slug, isValid: Boolean(card) };
      })
    );

    return validationChecks.filter((item) => !item.isValid).map((item) => item.slug);
  },

  async searchExternalCards(query) {
    const trimmed = String(query || '').trim();
    if (!trimmed) {
      return [];
    }

    const endpoint = `/api/v1/cards?q=${encodeURIComponent(trimmed)}`;
    const payload = await this.fetchExternalJson(endpoint);
    const cards = Array.isArray(payload?.data) ? payload.data : [];

    return cards
      .map((card) => {
        const slug = card?.slug;
        if (!slug) {
          return null;
        }

        const labelParts = [card?.name, card?.issuer].filter(Boolean);
        return {
          value: slug,
          label: labelParts.length > 0 ? `${labelParts.join(' - ')} (${slug})` : slug,
        };
      })
      .filter(Boolean);
  },

  async fetchCardBySlug(slug) {
    const safeSlug = encodeURIComponent(String(slug || '').trim());
    if (!safeSlug) {
      return null;
    }

    try {
      const payload = await this.fetchExternalJson(`/api/v1/cards/by-slug/${safeSlug}`);
      return payload?.data || null;
    } catch (error) {
      // Treat non-200 as "not found" for validation.
      return null;
    }
  },

  async fetchExternalJson(pathname) {
    const config = strapi.config.get('custom.cardApi', {});
    const baseUrl = String(config.baseUrl || '').replace(/\/$/, '');
    const timeoutMs = Number(config.timeoutMs || 5000);
    const apiKey = String(config.apiKey || '').trim();
    const url = `${baseUrl}${pathname}`;

    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          Accept: 'application/json',
          ...(apiKey ? { 'X-API-Key': apiKey } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`External API request failed: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  },
}));
