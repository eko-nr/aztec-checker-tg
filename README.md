# Aztec Checker Bot

A Telegram bot built with Bun, TypeScript, and Grammy that provides Aztec network checking functionality with scheduled monitoring.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Bun](https://bun.sh/) (latest version)
- A Telegram account
- Access to create a Telegram bot via BotFather

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/eko-nr/aztec-checker-tg
cd aztec-checker
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Environment Setup
Create a `.env` file in the root directory based on the `.env.example`:

```env
BOT_TOKEN=your_telegram_bot_token_here
```

### 4. Get Your Telegram Bot Token
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Start a chat with BotFather and send `/newbot`
3. Follow the instructions to create your bot
4. Copy the bot token provided by BotFather
5. Paste the token in your `.env` file as `BOT_TOKEN`

## Bot Setup

### 1. Configure Your Bot (Optional)
You can customize your bot settings via BotFather:
- `/setdescription` - Set bot description
- `/setabouttext` - Set about text
- `/setuserpic` - Set bot profile picture
- `/setcommands` - Set bot commands menu

### 2. Environment Variables
Ensure your `.env` file contains:
```env
BOT_TOKEN=7011434908:BOT_TOKEN_HERE
```
*Replace with your actual bot token from BotFather*

## Running the Bot

### Development Mode (with auto-reload)
```bash
bun run dev
```

### Production Mode
```bash
bun run start
```

### Clean Logs
```bash
bun run clean-logs
```

## Project Structure

```
├── src/
│   ├── commands/          # Bot commands
│   ├── db/               # Database related files
│   ├── handlers/         # Event and command handlers
│   ├── jobs/             # Scheduled jobs/cron tasks
│   ├── scripts/          # Utility scripts (including cleanLogs.ts)
│   ├── utils/            # Helper utilities
│   └── index.ts          # Main bot file
├── .env.example          # Environment variables template
├── .env                  # Your environment variables (not in git)
├── .gitignore           # Git ignore rules
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Features

Based on the project structure and dependencies, this bot likely includes:
- **Aztec Network Monitoring**: Automated checking of Aztec network status
- **Scheduled Tasks**: Using node-cron for periodic monitoring
- **Timezone Support**: Moment-timezone for handling different timezones
- **HTTP Requests**: Axios for making API calls to Aztec services
- **Log Management**: Clean-logs script for maintenance

## Available Scripts

- `bun run start` - Start the bot in production mode
- `bun run dev` - Start the bot in development mode with file watching
- `bun run clean-logs` - Clean up log files

## Configuration

### Environment Variables
- `BOT_TOKEN`: Your Telegram bot token from BotFather

### Scheduled Jobs
The bot uses `node-cron` for scheduled tasks. Check the `src/jobs/` directory for:
- Network status monitoring
- Periodic health checks
- Automated notifications

## Usage

1. Start the bot using one of the run commands above
2. Find your bot on Telegram using the username you set with BotFather
3. Send `/start` to begin interacting with the bot
4. Use available commands to check Aztec network status

## Development

### Tech Stack
- **Runtime**: Bun (fast JavaScript runtime)
- **Language**: TypeScript
- **Bot Framework**: Grammy (modern Telegram bot framework)
- **HTTP Client**: Axios
- **Scheduling**: node-cron
- **Environment**: dotenv

### Adding New Features
1. **Commands**: Add new command handlers in `src/commands/`
2. **Scheduled Jobs**: Create new cron jobs in `src/jobs/`
3. **Utilities**: Add helper functions in `src/utils/`
4. **Handlers**: Add event handlers in `src/handlers/`

### Code Style
- TypeScript strict mode enabled
- ESM modules (type: "module")
- Bun-native APIs where applicable

## Troubleshooting

### Common Issues

**Bot doesn't respond:**
- Verify your bot token is correct in `.env`
- Check that the bot is running without errors
- Ensure you've sent `/start` to activate the bot

**Permission errors:**
- Make sure the bot token has the necessary permissions
- Check if the bot is added to groups (if applicable)

**Module errors:**
- Run `bun install` to ensure dependencies are installed
- Check that you're using a compatible Bun version

**Cron jobs not running:**
- Verify cron expressions in your job files
- Check timezone configurations
- Look for errors in console output

### Logs
- Check console output for runtime errors
- Use the `clean-logs` script to manage log files
- Monitor scheduled job execution

## Monitoring

The bot includes built-in monitoring capabilities:
- Network status checking
- Scheduled health monitoring
- Automated alerting (implementation dependent)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper TypeScript types
4. Test with `bun run dev`
5. Submit a pull request

## Dependencies

### Core Dependencies
- `grammy` - Modern Telegram bot framework
- `axios` - HTTP client for API requests
- `dotenv` - Environment variable management
- `node-cron` - Task scheduling
- `moment-timezone` - Timezone handling

### Development Dependencies  
- `typescript` - TypeScript compiler
- `@types/bun` - Bun type definitions
- `@types/node` - Node.js type definitions
- `esbuild` - Fast JavaScript bundler

## License

[Add your license information here]

## Support

For issues related to:
- **Aztec Network**: Check official Aztec documentation
- **Bot Issues**: Create an issue in this repository
- **Telegram Bot API**: Refer to [Telegram Bot API documentation](https://core.telegram.org/bots/api)