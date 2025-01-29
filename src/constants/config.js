/**
 * Bot configuration constants
 */
module.exports = {
    BOT_NAME: "KozyDot's Beatmap Downloader",
    BOT_VERSION: "v1.0.0",
    API_BASE_URL: 'https://catboy.best',
    RATE_LIMIT: 5,               // requests per minute
    RATE_LIMIT_WINDOW: 60000,    // 1 minute in milliseconds
    SEARCH_LIMIT: 10,            // number of search results
    EMBED_COLOR: '#FF66AA',
    VALID_STATUSES: [1, 2, 4],   // ranked, approved, loved
};