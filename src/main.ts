import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { Zenox } from './bot/bot';
import { Config } from './db/structures';
import { Translator } from './l10n';
import { initSentry, sendWebhook } from './static/utils';

// Load environment variables
config();

const env = process.env.ENV || 'dev';
const isDev = env === 'dev';

// Initialize Sentry
initSentry();

// Setup logging
console.log(`Starting in ${env} environment`);

// Parse arguments
const args = process.argv.slice(2);
const schedule = args.includes('--schedule') || !isDev;
const configInstance = new Config({ schedule });

// Create client
const client = new Zenox(env, configInstance);

// Guild join event
client.on('guildCreate', async (guild) => {
  const { GuildConfig } = await import('./db/structures');
  new GuildConfig(guild.id);
  
  const embed = new EmbedBuilder()
    .setTitle(`Joined ${guild.name} (${guild.id})`)
    .setDescription(`\`\`\`\nMembers: ${guild.memberCount}\n\`\`\``);
  
  await sendWebhook(client.logWebhookUrl, 'Guild Join Event', embed);
});

// Guild leave event
client.on('guildDelete', async (guild) => {
  const { GuildConfig } = await import('./db/structures');
  new GuildConfig(guild.id);
  
  const embed = new EmbedBuilder()
    .setTitle(`Left ${guild.name} (${guild.id})`)
    .setDescription(`\`\`\`\nMembers: ${guild.memberCount}\n\`\`\``);
  
  await sendWebhook(client.logWebhookUrl, 'Guild Leave Event', embed);
});

// Ready event
client.once('ready', async () => {
  console.log(`Started in ${env} Environment`);
  await client.application?.commands.set([]);
});

// Login
const token = process.env[`BOT_${env.toUpperCase()}_TOKEN`];
if (!token) {
  throw new Error(`Bot token not found for environment: ${env}`);
}

client.login(token);