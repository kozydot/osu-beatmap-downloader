const axios = require('axios');
const { BOT_NAME, BOT_VERSION, API_BASE_URL, SEARCH_LIMIT, VALID_STATUSES } = require('../constants/config');
const Logger = require('../utils/logger');

/**
 * Service for handling beatmap-related operations
 */
class BeatmapService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'User-Agent': `${BOT_NAME} ${BOT_VERSION}`
            }
        });
    }

    /**
     * Get information about a specific beatmap set
     * @param {string|number} beatmapsetId - The ID of the beatmap set
     * @returns {Promise<Object>} Beatmap information
     * @throws {Error} When beatmap is not found or API error occurs
     */
    async getBeatmapInfo(beatmapsetId) {
        Logger.info(`Fetching info for beatmap set ${beatmapsetId}`);
        try {
            const response = await this.api.get(`/api/v2/s/${beatmapsetId}`);
            Logger.success(`Retrieved info for beatmap set ${beatmapsetId}`);
            return response.data;
        } catch (error) {
            Logger.error(
                `Failed to get info for beatmap set ${beatmapsetId}`,
                error.response?.data || error.message
            );
            if (error.response?.status === 404) {
                throw new Error('Beatmap not found');
            }
            throw new Error('Failed to get beatmap info - ' + error.message);
        }
    }

    /**
     * Search for beatmaps matching a query
     * @param {string} query - The search query
     * @returns {Promise<Array>} Array of matching beatmaps
     * @throws {Error} When search fails
     */
    async searchBeatmaps(query) {
        Logger.info(`Searching for beatmaps matching "${query}"`);
        try {
            const response = await this.api.get('/api/v2/search', {
                params: {
                    query: query,
                    limit: SEARCH_LIMIT,
                    status: VALID_STATUSES,
                    mode: [-1], // all game modes
                    sort: 'ranked_desc'
                }
            });
            
            const resultCount = response.data?.length || 0;
            if (resultCount > 0) {
                Logger.success(`Found ${resultCount} beatmaps matching "${query}"`);
            } else {
                Logger.warning(`No beatmaps found matching "${query}"`);
            }
            
            return response.data;
        } catch (error) {
            Logger.error(
                `Search failed for query "${query}"`,
                error.response?.data || error.message
            );
            throw new Error('Failed to search beatmaps - ' + error.message);
        }
    }

    /**
     * Get the preview URL for a beatmap's background
     * @param {string|number} beatmapId - The beatmap ID
     * @returns {string} URL to the background preview
     */
    getBackgroundPreviewUrl(beatmapId) {
        return `${API_BASE_URL}/preview/background/${beatmapId}`;
    }

    /**
     * Get download URLs for a beatmap
     * @param {string|number} beatmapId - The beatmap ID
     * @returns {{withVideo: string, withoutVideo: string}} Object containing both download URLs
     */
    getDownloadUrls(beatmapId) {
        return {
            withVideo: `${API_BASE_URL}/d/${beatmapId}`,
            withoutVideo: `${API_BASE_URL}/d/${beatmapId}n`
        };
    }
}

module.exports = BeatmapService;