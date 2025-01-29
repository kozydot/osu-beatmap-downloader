require('dotenv').config();
const { Client, GatewayIntentBits, Events, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const chalk = require('chalk');

// Initialize Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Bot version and name
const BOT_NAME = "KozyDot's Beatmap Downloader";
const BOT_VERSION = "v1.0.0";

// Create axios instance with common configs
const api = axios.create({
    baseURL: 'https://catboy.best',
    headers: {
        'User-Agent': `${BOT_NAME} ${BOT_VERSION}`
    }
});

// Logging functions
function formatTimestamp(date) {
    try {
        // Ensure we have a valid Date object
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
        // Return current time if there's an error
        const now = new Date();
        let hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} ${ampm}`;
    }
}

function logInfo(message) {
    console.log(chalk.blue(`[${formatTimestamp(new Date())}] [INFO] ${message}`));
}

function logSuccess(message) {
    console.log(chalk.green(`[${formatTimestamp(new Date())}] [SUCCESS] ${message}`));
}

function logWarning(message) {
    console.log(chalk.yellow(`[${formatTimestamp(new Date())}] [WARNING] ${message}`));
}

function logError(message, error = null) {
    console.error(chalk.red(`[${formatTimestamp(new Date())}] [ERROR] ${message}`));
    if (error) {
        console.error(chalk.red('Details:'), error);
    }
}

// Rate limiting map
const rateLimits = new Map();
const RATE_LIMIT = 5; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

// Helper function to check rate limits
function checkRateLimit(userId) {
    const now = Date.now();
    const userRateLimit = rateLimits.get(userId) || { count: 0, timestamp: now };

    if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
        // Reset rate limit if window has passed
        userRateLimit.count = 1;
        userRateLimit.timestamp = now;
    } else if (userRateLimit.count >= RATE_LIMIT) {
        return false;
    } else {
        userRateLimit.count++;
    }

    rateLimits.set(userId, userRateLimit);
    return true;
}

// Function to create beatmap embed
async function createBeatmapEmbed(beatmap) {
    const embed = new EmbedBuilder()
        .setColor('#FF66AA')
        .setTitle(`${beatmap.title}`)
        .setDescription(`**Artist:** ${beatmap.artist}\n**Creator:** ${beatmap.creator}`)
        .addFields(
            { name: 'BPM', value: `${beatmap.bpm}`, inline: true },
            { name: 'Status', value: beatmap.status, inline: true },
            { name: 'Favorite Count', value: `${beatmap.favourite_count}`, inline: true }
        )
        .addFields(
            { 
                name: 'Download Links', 
                value: `[Download with Video](https://catboy.best/d/${beatmap.id})\n[Download without Video](https://catboy.best/d/${beatmap.id}n)`
            }
        )
        .setFooter({ text: `Beatmap ID: ${beatmap.id} • ${BOT_NAME} ${BOT_VERSION}` });

    // Try to add background image if preview is available
    try {
        const previewUrl = `https://catboy.best/preview/background/${beatmap.id}`;
        embed.setImage(previewUrl);
    } catch (error) {
        logWarning(`Failed to set preview image for beatmap ${beatmap.id}`);
    }

    return embed;
}

// Get beatmap info function
async function getBeatmapInfo(beatmapsetId) {
    logInfo(`Fetching info for beatmap set ${beatmapsetId}`);
    try {
        const response = await api.get(`/api/v2/s/${beatmapsetId}`);
        logSuccess(`Retrieved info for beatmap set ${beatmapsetId}`);
        return response.data;
    } catch (error) {
        logError(`Failed to get info for beatmap set ${beatmapsetId}`, error.response?.data || error.message);
        if (error.response?.status === 404) {
            throw new Error('Beatmap not found');
        }
        throw new Error('Failed to get beatmap info - ' + error.message);
    }
}

// Search beatmaps function
async function searchBeatmaps(query) {
    logInfo(`Searching for beatmaps matching "${query}"`);
    try {
        const response = await api.get('/api/v2/search', {
            params: {
                query: query,
                limit: 10,
                status: [1, 2, 4], // ranked, approved, loved
                mode: [-1],        // all game modes
                sort: 'ranked_desc'
            }
        });
        
        const resultCount = response.data?.length || 0;
        if (resultCount > 0) {
            logSuccess(`Found ${resultCount} beatmaps matching "${query}"`);
        } else {
            logWarning(`No beatmaps found matching "${query}"`);
        }
        
        return response.data;
    } catch (error) {
        logError(`Search failed for query "${query}"`, error.response?.data || error.message);
        throw new Error('Failed to search beatmaps - ' + error.message);
    }
}

// Handle commands
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    
    if (!message.content.startsWith('!bm')) return;

    // Check rate limit
    if (!checkRateLimit(message.author.id)) {
        logWarning(`Rate limit exceeded for user ${message.author.tag}`);
        message.reply('You are being rate limited. Please wait a minute before trying again.');
        return;
    }

    try {
        const args = message.content.slice(3).trim();
        logInfo(`Processing command from ${message.author.tag}: ${message.content}`);
        
        // Direct ID lookup
        if (/^\d+$/.test(args)) {
            const beatmap = await getBeatmapInfo(args);
            const embed = await createBeatmapEmbed(beatmap);
            await message.reply({ embeds: [embed] });
            logSuccess(`Sent beatmap info for ID ${args} to ${message.author.tag}`);
            return;
        }

        // Search by name
        if (args.startsWith('"') && args.endsWith('"')) {
            const query = args.slice(1, -1);
            
            if (!query) {
                logWarning(`Empty search query from ${message.author.tag}`);
                message.reply('Please provide a search query between quotes. Example: !bm "song name"');
                return;
            }

            const results = await searchBeatmaps(query);

            if (!results || results.length === 0) {
                message.reply('No beatmaps found matching your search.');
                return;
            }

            const beatmap = results[0];
            const embed = await createBeatmapEmbed(beatmap);
            await message.reply({ embeds: [embed] });
            logSuccess(`Sent search results for "${query}" to ${message.author.tag}`);
        } else {
            logWarning(`Invalid command format from ${message.author.tag}: ${message.content}`);
            message.reply('Invalid command format. Use:\n!bm <beatmapset_id>\n!bm "beatmap name"');
        }
    } catch (error) {
        logError(`Command error for ${message.author.tag}`, error);
        message.reply(`Error: ${error.message}`);
    }
});

// Login event
client.once(Events.ClientReady, () => {
    console.log('\n' + chalk.cyan('='.repeat(50)));
    console.log(chalk.cyan(`${BOT_NAME} ${BOT_VERSION}`));
    console.log(chalk.cyan('='.repeat(50)) + '\n');
    logSuccess(`Bot is ready! Logged in as ${client.user.tag}`);
});

// Error handling
client.on('error', error => {
    logError('Discord client error', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
    .catch(error => {
        logError('Failed to log in to Discord', error);
        process.exit(1);
    });