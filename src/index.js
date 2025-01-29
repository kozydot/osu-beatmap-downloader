require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { BOT_NAME, BOT_VERSION } = require('./constants/config');
const Logger = require('./utils/logger');
const BeatmapService = require('./services/BeatmapService');
const RateLimiter = require('./services/RateLimiter');
const DiscordMessageHandler = require('./services/DiscordMessageHandler');

/**
 * Initialize Discord bot with required services
 */
class Bot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        // Initialize services
        this.beatmapService = new BeatmapService();
        this.rateLimiter = new RateLimiter();
        this.messageHandler = new DiscordMessageHandler(
            this.beatmapService,
            this.rateLimiter
        );

        this.setupEventHandlers();
    }

    /**
     * Set up Discord event handlers
     */
    setupEventHandlers() {
        // Ready event
        this.client.once(Events.ClientReady, () => {
            Logger.printBanner(`${BOT_NAME} ${BOT_VERSION}`);
            Logger.success(`Bot is ready! Logged in as ${this.client.user.tag}`);
        });

        // Message event
        this.client.on(Events.MessageCreate, async (message) => {
            try {
                await this.messageHandler.handleMessage(message);
            } catch (error) {
                Logger.error('Error processing message', error);
            }
        });

        // Error event
        this.client.on('error', error => {
            Logger.error('Discord client error', error);
        });
    }

    /**
     * Start the bot
     */
    async start() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            Logger.error('Failed to log in to Discord', error);
            process.exit(1);
        }
    }
}

// Start the bot
const bot = new Bot();
bot.start();