const { RATE_LIMIT, RATE_LIMIT_WINDOW } = require('../constants/config');
const Logger = require('../utils/logger');

/**
 * Service for handling rate limiting
 */
class RateLimiter {
    constructor() {
        this.rateLimits = new Map();
    }

    /**
     * Check if a user has exceeded their rate limit
     * @param {string} userId - The user's ID
     * @returns {boolean} True if the user can make a request, false if rate limited
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const userRateLimit = this.rateLimits.get(userId) || { count: 0, timestamp: now };

        // Reset rate limit if window has passed
        if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
            userRateLimit.count = 1;
            userRateLimit.timestamp = now;
        }
        // Check if user has exceeded rate limit
        else if (userRateLimit.count >= RATE_LIMIT) {
            Logger.warning(`Rate limit exceeded for user ${userId}`);
            return false;
        }
        // Increment request count
        else {
            userRateLimit.count++;
        }

        this.rateLimits.set(userId, userRateLimit);
        return true;
    }

    /**
     * Get remaining requests for a user
     * @param {string} userId - The user's ID
     * @returns {number} Number of remaining requests in current window
     */
    getRemainingRequests(userId) {
        const userRateLimit = this.rateLimits.get(userId);
        if (!userRateLimit) return RATE_LIMIT;
        
        const now = Date.now();
        if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
            return RATE_LIMIT;
        }

        return Math.max(0, RATE_LIMIT - userRateLimit.count);
    }

    /**
     * Get time until rate limit resets for a user
     * @param {string} userId - The user's ID
     * @returns {number} Milliseconds until rate limit resets
     */
    getResetTime(userId) {
        const userRateLimit = this.rateLimits.get(userId);
        if (!userRateLimit) return 0;

        const now = Date.now();
        const timeSinceLastRequest = now - userRateLimit.timestamp;
        return Math.max(0, RATE_LIMIT_WINDOW - timeSinceLastRequest);
    }
}

module.exports = RateLimiter;