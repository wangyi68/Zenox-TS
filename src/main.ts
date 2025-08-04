import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { Zenox } from './bot/bot';
import { Config } from './db/structures';
import { Translator } from './l10n';
import { initSentry, sendWebhook } from './static/utils';
import { log, quickLog } from './utils/logger';
import { displayBanner, displaySystemInfo, displayVersionInfo, displayStartupMessage } from './utils/banner';

// Load environment variables
config();

const env = process.env.ENV || 'dev';
const isDev = env === 'dev';

// Display beautiful startup banner
displayBanner();
displaySystemInfo();
displayVersionInfo('2.0.0');
displayStartupMessage(env);

// Initialize Sentry
initSentry();

// Parse arguments
const args = process.argv.slice(2);
const schedule = args.includes('--schedule') || !isDev;
log.info(`Schedule mode: ${schedule ? 'enabled' : 'disabled'}`);

const configInstance = new Config({ schedule });
log.success('Configuration loaded successfully');

// Create client
log.info('Creating Discord client...');
const client = new Zenox(env, configInstance);
log.success('Discord client created');

// Guild join event
client.on('guildCreate', async (guild) => {
  log.discord('GUILD_JOIN', guild.id, { 
    guildName: guild.name, 
    memberCount: guild.memberCount 
  });
  
  const { GuildConfig } = await import('./db/structures');
  new GuildConfig(guild.id);
  
  const embed = new EmbedBuilder()
    .setTitle(`Joined ${guild.name} (${guild.id})`)
    .setDescription(`\`\`\`\nMembers: ${guild.memberCount}\n\`\`\``);
  
  await sendWebhook(client.logWebhookUrl, 'Guild Join Event', embed);
});

// Guild leave event
client.on('guildDelete', async (guild) => {
  log.discord('GUILD_LEAVE', guild.id, { 
    guildName: guild.name, 
    memberCount: guild.memberCount 
  });
  
  const { GuildConfig } = await import('./db/structures');
  new GuildConfig(guild.id);
  
  const embed = new EmbedBuilder()
    .setTitle(`Left ${guild.name} (${guild.id})`)
    .setDescription(`\`\`\`\nMembers: ${guild.memberCount}\n\`\`\``);
  
  await sendWebhook(client.logWebhookUrl, 'Guild Leave Event', embed);
});

// Ready event
client.once('ready', async () => {
  log.separator('BOT READY');
  log.startup(`Zenox Bot is now online in ${env.toUpperCase()} environment`);
  log.info(`Logged in as: ${client.user?.tag}`);
  log.info(`Bot ID: ${client.user?.id}`);
  log.info(`Guilds: ${client.guilds.cache.size}`);
  log.info(`Users: ${client.users.cache.size}`);
  log.info(`Channels: ${client.channels.cache.size}`);
  
  // Display bot statistics
  log.table('Bot Statistics', {
    'Guilds': client.guilds.cache.size,
    'Users': client.users.cache.size,
    'Channels': client.channels.cache.size,
    'Ping': `${client.ws.ping}ms`,
    'Uptime': '0s'
  });
  
  await client.application?.commands.set([]);
  log.success('Application commands synchronized');
});

// Login
const token = process.env[`BOT_${env.toUpperCase()}_TOKEN`];
if (!token) {
  log.error(`Bot token not found for environment: ${env}`);
  throw new Error(`Bot token not found for environment: ${env}`);
}

log.info('Attempting to login to Discord...');
client.login(token).then(() => {
  log.success('Successfully logged in to Discord');
}).catch((error) => {
  log.error('Failed to login to Discord', error);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  log.separator('SHUTDOWN');
  log.shutdown('Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.separator('SHUTDOWN');
  log.shutdown('Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection', reason);
  process.exit(1);
});