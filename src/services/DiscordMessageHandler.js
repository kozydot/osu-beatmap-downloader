const { EmbedBuilder } = require('discord.js');
const { BOT_NAME, BOT_VERSION, EMBED_COLOR } = require('../constants/config');
const Logger = require('../utils/logger');

/**
 * Service for handling Discord message interactions
 */
class DiscordMessageHandler {
    /**
     * @param {BeatmapService} beatmapService - Service for beatmap operations
     * @param {RateLimiter} rateLimiter - Service for rate limiting
     */
    constructor(beatmapService, rateLimiter) {
        this.beatmapService = beatmapService;
        this.rateLimiter = rateLimiter;
    }

    /**
     * Create a Discord embed for a beatmap
     * @param {Object} beatmap - Beatmap data
     * @returns {EmbedBuilder} Discord embed object
     */
    createBeatmapEmbed(beatmap) {
        const downloadUrls = this.beatmapService.getDownloadUrls(beatmap.id);
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle(beatmap.title)
            .setDescription(`**Artist:** ${beatmap.artist}\n**Creator:** ${beatmap.creator}`)
            .addFields(
                { name: 'BPM', value: `${beatmap.bpm}`, inline: true },
                { name: 'Status', value: beatmap.status, inline: true },
                { name: 'Favorite Count', value: `${beatmap.favourite_count}`, inline: true }
            )
            .addFields(
                { 
                    name: 'Download Links', 
                    value: `[Download with Video](${downloadUrls.withVideo})\n[Download without Video](${downloadUrls.withoutVideo})`
                }
            )
            .setFooter({ text: `Beatmap ID: ${beatmap.id} • ${BOT_NAME} ${BOT_VERSION}` });

        // Try to add background image
        try {
            const previewUrl = this.beatmapService.getBackgroundPreviewUrl(beatmap.id);
            embed.setImage(previewUrl);
        } catch (error) {
            Logger.warning(`Failed to set preview image for beatmap ${beatmap.id}`);
        }

        return embed;
    }

    /**
     * Process a beatmap ID lookup command
     * @param {Message} message - Discord message object
     * @param {string} beatmapId - Beatmap ID to look up
     */
    async handleIdLookup(message, beatmapId) {
        try {
            const beatmap = await this.beatmapService.getBeatmapInfo(beatmapId);
            const embed = this.createBeatmapEmbed(beatmap);
            await message.reply({ embeds: [embed] });
            Logger.success(`Sent beatmap info for ID ${beatmapId} to ${message.author.tag}`);
        } catch (error) {
            Logger.error(`Command error for ${message.author.tag}`, error);
            message.reply(`Error: ${error.message}`);
        }
    }

    /**
     * Process a beatmap search command
     * @param {Message} message - Discord message object
     * @param {string} query - Search query
     */
    async handleSearch(message, query) {
        if (!query) {
            Logger.warning(`Empty search query from ${message.author.tag}`);
            message.reply('Please provide a search query between quotes. Example: !bm "song name"');
            return;
        }

        try {
            const results = await this.beatmapService.searchBeatmaps(query);

            if (!results || results.length === 0) {
                message.reply('No beatmaps found matching your search.');
                return;
            }

            const beatmap = results[0];  // Get first result
            const embed = this.createBeatmapEmbed(beatmap);
            await message.reply({ embeds: [embed] });
            Logger.success(`Sent search results for "${query}" to ${message.author.tag}`);
        } catch (error) {
            Logger.error(`Command error for ${message.author.tag}`, error);
            message.reply(`Error: ${error.message}`);
        }
    }

    /**
     * Process an incoming Discord message
     * @param {Message} message - Discord message object
     */
    async handleMessage(message) {
        if (message.author.bot) return;
        if (!message.content.startsWith('!bm')) return;

        // Check rate limit
        if (!this.rateLimiter.checkRateLimit(message.author.id)) {
            message.reply('You are being rate limited. Please wait a minute before trying again.');
            return;
        }

        const args = message.content.slice(3).trim();
        Logger.info(`Processing command from ${message.author.tag}: ${message.content}`);

        // Direct ID lookup
        if (/^\d+$/.test(args)) {
            await this.handleIdLookup(message, args);
            return;
        }

        // Search by name
        if (args.startsWith('"') && args.endsWith('"')) {
            const query = args.slice(1, -1);
            await this.handleSearch(message, query);
        } else {
            Logger.warning(`Invalid command format from ${message.author.tag}: ${message.content}`);
            message.reply('Invalid command format. Use:\n!bm <beatmapset_id>\n!bm "beatmap name"');
        }
    }
}

module.exports = DiscordMessageHandler;