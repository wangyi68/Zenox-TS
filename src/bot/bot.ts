import { 
  Client, 
  GatewayIntentBits, 
  ActivityType, 
  ClientOptions,
  Collection,
  REST,
  Routes
} from 'discord.js';
import { CommandTree } from './command-tree';
import { DB } from '../db/mongodb';
import { getRepoVersion, getNow } from '../static/utils';
import { Config } from '../db/structures';
import { AppCommandTranslator } from '../l10n';
import { readdirSync } from 'fs';
import { join } from 'path';

export class Zenox extends Client {
  owner_id: number;
  guild_id: number;
  uptime: Date;
  repo: any;
  version: string;
  env: string;
  config: Config;
  db: typeof DB;
  logWebhookUrl: string | undefined;
  commands: Collection<string, any>;

  constructor(env: string, config: Config) {
    const options: ClientOptions = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ],
      presence: {
        activities: [{
          name: `${getRepoVersion() || 'dev'} | ZZZ Full Support`,
          type: ActivityType.Custom
        }]
      }
    };

    super(options);

    this.owner_id = 585834029484343298;
    this.guild_id = 1129777497454686330;
    this.uptime = getNow();
    this.repo = null; // Will be set if git is available
    this.version = getRepoVersion() || "dev";
    this.env = env;
    this.config = config;
    this.db = DB;
    this.logWebhookUrl = process.env[`LOGS_WEBHOOK_${env.toUpperCase()}`];
    this.commands = new Collection();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('ready', () => {
      console.log(`Logged in as ${this.user?.tag}`);
    });

    this.on('error', (error) => {
      console.error('Bot error:', error);
      this.captureException(error);
    });
  }

  async setupHook(): Promise<void> {
    // Set Translator
    // Note: Discord.js v14 doesn't have built-in translator like discord.py
    // You might need to implement your own translation system

    // Load Cogs
    const cogsPath = join(__dirname, '../cogs');
    try {
      const cogFiles = readdirSync(cogsPath).filter(file => file.endsWith('.js'));
      
      for (const file of cogFiles) {
        const cogName = file.replace('.js', '');
        try {
          const cog = require(join(cogsPath, file));
          if (cog.default) {
            const cogInstance = new cog.default(this);
            this.commands.set(cogInstance.name, cogInstance);
          }
        } catch (error) {
          console.error(`Failed to load cog ${cogName}:`, error);
          this.captureException(error as Error);
        }
      }
    } catch (error) {
      console.error('Error loading cogs:', error);
    }

    // Register commands
    await this.registerCommands();
  }

  private async registerCommands(): Promise<void> {
    if (!this.user) return;

    const rest = new REST({ version: '10' }).setToken(this.token!);
    const commands = Array.from(this.commands.values()).map(cmd => cmd.data);

    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(this.user.id),
        { body: commands }
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  captureException(e: Error): void {
    // Implement Sentry or other error tracking here
    console.error('Captured exception:', e);
    
    // Filter out specific errors if needed
    if (e.message.includes('10062')) {
      return;
    }
    
    // You can integrate with Sentry here
    // Sentry.captureException(e);
  }
}