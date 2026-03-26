module.exports = ({ env }) => ({
  cardApi: {
    baseUrl: env(
      "CARD_API_BASE_URL",
      "https://credit-card-recommendation-api-lime.vercel.app"
    ),
    timeoutMs: env.int("CARD_API_TIMEOUT_MS", 5000),
    apiKey: env("CARD_API_KEY", ""),
  },
});
