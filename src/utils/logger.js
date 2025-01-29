const chalk = require('chalk');

/**
 * Formats a timestamp in local time with AM/PM
 * @param {Date} date - The date to format
 * @returns {string} Formatted timestamp string
 */
function formatTimestamp(date) {
    try {
        const timestamp = date instanceof Date ? date : new Date(date);
        if (isNaN(timestamp.getTime())) {
            throw new Error('Invalid date');
        }

        // Get hours for AM/PM format
        let hours = timestamp.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12

        // Format with padding
        const year = timestamp.getFullYear();
        const month = String(timestamp.getMonth() + 1).padStart(2, '0');
        const day = String(timestamp.getDate()).padStart(2, '0');
        const hoursStr = String(hours).padStart(2, '0');
        const minutes = String(timestamp.getMinutes()).padStart(2, '0');
        const seconds = String(timestamp.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
        console.error(chalk.red('Invalid timestamp format:', error.message));
        return formatTimestamp(new Date()); // Recursively try with current time
    }
}

/**
 * Logging utility class
 */
class Logger {
    /**
     * Log an informational message
     * @param {string} message - The message to log
     */
    static info(message) {
        console.log(chalk.blue(`[${formatTimestamp(new Date())}] [INFO] ${message}`));
    }

    /**
     * Log a success message
     * @param {string} message - The message to log
     */
    static success(message) {
        console.log(chalk.green(`[${formatTimestamp(new Date())}] [SUCCESS] ${message}`));
    }

    /**
     * Log a warning message
     * @param {string} message - The message to log
     */
    static warning(message) {
        console.log(chalk.yellow(`[${formatTimestamp(new Date())}] [WARNING] ${message}`));
    }

    /**
     * Log an error message with optional error details
     * @param {string} message - The error message
     * @param {Error|null} [error=null] - Optional error object with details
     */
    static error(message, error = null) {
        console.error(chalk.red(`[${formatTimestamp(new Date())}] [ERROR] ${message}`));
        if (error) {
            console.error(chalk.red('Details:'), error);
        }
    }

    /**
     * Print a banner with the given text
     * @param {string} text - The text to display in the banner
     */
    static printBanner(text) {
        const border = '='.repeat(50);
        console.log('\n' + chalk.cyan(border));
        console.log(chalk.cyan(text));
        console.log(chalk.cyan(border) + '\n');
    }
}

module.exports = Logger;