# Kozydot's Discord Beatmap Downloader

A Discord bot for downloading osu! beatmaps using the Nerinyan API.

## Features

- Download beatmaps using their ID
- Search for beatmaps by name
- Rich embed messages with beatmap information
- Rate limiting to prevent API abuse
- Clean logging with timestamps

## Commands

- `!bm <beatmap_id>` - Download a beatmap by its numeric ID
- `!bm "song name"` - Search and download a beatmap by its name

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Discord bot token:
   ```
   DISCORD_TOKEN=your_token_here
   ```
4. Start the bot:
   ```bash
   npm start
   ```

## Development

- Start with auto-reload:
  ```bash
  npm run dev
  ```
- Lint code:
  ```bash
  npm run lint
  ```

## Error Handling

The bot includes comprehensive error handling:
- Rate limiting (5 requests per minute per user)
- Invalid command format detection
- API error handling
- Network error recovery
- Graceful error messages to users

## Logging

Colored console logging with timestamps:
- INFO: General information (blue)
- SUCCESS: Successful operations (green)
- WARNING: Non-critical issues (yellow)
- ERROR: Critical issues (red)

## Dependencies

- discord.js: Discord API interaction
- axios: HTTP requests
- chalk: Colored console output
- dotenv: Environment variable management
- nodemon: Development auto-reload
- eslint: Code linting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
