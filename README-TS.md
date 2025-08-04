# Zenox Bot - TypeScript Version

A modern Discord bot for Hoyoverse games (Genshin Impact, Honkai: Star Rail, Zenless Zone Zero) built with TypeScript and Discord.js v14.

## 🚀 Features

- **Multi-Game Support**: Genshin Impact, Honkai: Star Rail, Zenless Zone Zero
- **Redemption Code Management**: Automatic code discovery and distribution
- **Event Reminders**: Stream and event scheduling
- **Multi-Language Support**: English and German localization
- **Advanced Logging**: Beautiful console output with Winston
- **Database Integration**: MongoDB with Mongoose
- **Modern Architecture**: TypeScript with strict typing

## 📋 Requirements

- Node.js 18+ 
- MongoDB 4.4+
- Discord Bot Token
- Hoyolab API credentials

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zenox-ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   ENV=dev
   NODE_ENV=development
   
   # Discord Bot Tokens
   BOT_DEV_TOKEN=your_dev_bot_token
   BOT_PROD_TOKEN=your_prod_bot_token
   
   # MongoDB Connections
   MONGODB_DEV=mongodb://localhost:27017/zenox_dev
   MONGODB_PROD=mongodb://localhost:27017/zenox
   
   # Webhooks
   LOGS_WEBHOOK_DEV=your_dev_webhook_url
   LOGS_WEBHOOK_PROD=your_prod_webhook_url
   
   # Hoyolab API
   HOYOLAB_EMAIL=your_email
   HOYOLAB_PASSWORD=your_password
   
   # Sentry (optional)
   SENTRY_DSN=your_sentry_dsn
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the bot**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🏗️ Project Structure

```
src/
├── auto_tasks/          # Automated background tasks
├── bot/                 # Bot client and core logic
├── cogs/                # Discord command modules
├── constants/           # Game constants and enums
├── db/                  # Database models and connections
├── l10n/                # Localization system
├── static/              # Static utilities and embeds
├── types/               # TypeScript type definitions
├── ui/                  # Discord UI components
├── utils/               # Utility functions and logging
└── main.ts              # Application entry point
```

## 🎮 Commands

### Developer Commands
- `/dev stream_analytics` - Analyze stream event statistics
- `/dev shards` - Display shard information
- `/dev request` - Request permission check for guild
- `/dev guild_config` - View raw guild configuration
- `/dev schedule_stream` - Schedule a stream event

### User Commands
- `/settings` - Configure user preferences
- `/codes` - View available redemption codes
- `/events` - Check upcoming events

### Guild Commands
- `/guild settings` - Configure guild settings
- `/guild codes` - Manage code distribution
- `/guild events` - Configure event reminders

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start in development mode
npm run watch        # Watch for changes and rebuild

# Building
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues

# Production
npm start            # Start production server
```

### Logging

The bot uses a custom logging system with Winston:

```typescript
import { log } from './utils/logger';

// Different log levels
log.success('Operation completed successfully');
log.info('Information message');
log.warn('Warning message');
log.error('Error occurred', error);
log.debug('Debug information');

// Specialized logging
log.db('insert', 'users', { userId: 123 });
log.api('GET', '/api/users', 200);
log.discord('GUILD_JOIN', guildId);
log.command('/settings', userId, guildId);
log.performance('Database query', 150);

// Progress tracking
log.progress(5, 10, 'Processing items');

// Table output
log.table('Statistics', {
  'Total Users': 1000,
  'Active Guilds': 50,
  'Commands Executed': 500
});
```

### Database Models

The bot uses MongoDB with Mongoose-like structures:

```typescript
import { GuildConfig, UserConfig } from './db/structures';

// Create new guild config
const guild = new GuildConfig(guildId);

// Update settings
guild.updateLanguage(Locale.EnglishUS);
guild.updateGameConfigValue(Game.GENSHIN, CodesConfigClass, 'channel', channelId);

// User configuration
const user = new UserConfig(userId);
user.updateSetting('language', Locale.EnglishUS);
```

## 🌐 Localization

The bot supports multiple languages through a custom localization system:

```typescript
import { LocaleStr } from './l10n';

// Create localized string
const title = new LocaleStr({ 
  key: 'welcome_message', 
  version: '2.0',
  game: Game.GENSHIN 
});

// Translate to specific locale
const translated = title.translate(Locale.EnglishUS);
```

## 🔄 Auto Tasks

Background tasks run automatically:

- **Database Cleanup**: Removes orphaned guild configurations
- **Code Discovery**: Scans for new redemption codes
- **Event Scheduling**: Manages stream reminders
- **Analytics**: Collects usage statistics

## 📊 Monitoring

The bot includes comprehensive monitoring:

- **Performance Tracking**: Command execution times
- **Error Reporting**: Sentry integration
- **Webhook Logging**: Important events sent to Discord
- **Health Checks**: Database and API status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆚 Migration from Python

This TypeScript version is a complete rewrite of the original Python bot with:

- **Better Type Safety**: Full TypeScript support
- **Modern Architecture**: Discord.js v14 with latest features
- **Improved Performance**: Optimized database queries
- **Enhanced Logging**: Beautiful console output
- **Better Error Handling**: Comprehensive error management
- **Modular Design**: Clean separation of concerns

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string in `.env`
   - Ensure network connectivity

2. **Discord Bot Token Invalid**
   - Verify bot token in Discord Developer Portal
   - Check environment variable names
   - Ensure bot has required permissions

3. **Build Errors**
   - Run `npm install` to ensure all dependencies
   - Check TypeScript version compatibility
   - Verify Node.js version (18+ required)

### Getting Help

- Check the logs in `logs/` directory
- Review Discord.js documentation
- Open an issue on GitHub

## 🔮 Future Plans

- [ ] Add more game support
- [ ] Implement advanced analytics
- [ ] Add web dashboard
- [ ] Support for more languages
- [ ] Enhanced UI components
- [ ] Performance optimizations