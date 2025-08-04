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
import { log } from '../utils/logger';

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
      log.success(`Bot client ready - Logged in as ${this.user?.tag}`);
    });

    this.on('error', (error) => {
      log.error('Bot client error', error);
      this.captureException(error);
    });

    this.on('warn', (warning) => {
      log.warn(`Bot client warning: ${warning}`);
    });

    this.on('debug', (message) => {
      log.debug(`Bot client debug: ${message}`);
    });
  }

  async setupHook(): Promise<void> {
    log.info('Setting up bot hook...');
    
    // Set Translator
    // Note: Discord.js v14 doesn't have built-in translator like discord.py
    // You might need to implement your own translation system
    log.debug('Translator setup skipped (not implemented in Discord.js)');

    // Load Cogs
    const cogsPath = join(__dirname, '../cogs');
    try {
      const cogFiles = readdirSync(cogsPath).filter(file => file.endsWith('.js'));
      log.info(`Found ${cogFiles.length} cog files to load`);
      
      let loadedCogs = 0;
      for (const file of cogFiles) {
        const cogName = file.replace('.js', '');
        try {
          const cog = require(join(cogsPath, file));
          if (cog.default) {
            const cogInstance = new cog.default(this);
            this.commands.set(cogInstance.name, cogInstance);
            loadedCogs++;
            log.success(`Loaded cog: ${cogName}`);
          }
        } catch (error) {
          log.error(`Failed to load cog ${cogName}`, error);
          this.captureException(error as Error);
        }
      }
      
      log.table('Cog Loading Results', {
        'Total Files': cogFiles.length,
        'Successfully Loaded': loadedCogs,
        'Failed': cogFiles.length - loadedCogs
      });
    } catch (error) {
      log.error('Error loading cogs', error);
    }

    // Register commands
    await this.registerCommands();
  }

  private async registerCommands(): Promise<void> {
    if (!this.user) return;

    const rest = new REST({ version: '10' }).setToken(this.token!);
    const commands = Array.from(this.commands.values()).map(cmd => cmd.data);

    try {
      log.info(`Started refreshing ${commands.length} application (/) commands...`);

      await rest.put(
        Routes.applicationCommands(this.user.id),
        { body: commands }
      );

      log.success(`Successfully registered ${commands.length} application commands`);
      
      if (commands.length > 0) {
        log.table('Registered Commands', {
          'Total Commands': commands.length,
          'Global Commands': commands.filter(cmd => !cmd.guild_id).length,
          'Guild Commands': commands.filter(cmd => cmd.guild_id).length
        });
      }
    } catch (error) {
      log.error('Error registering commands', error);
    }
  }

  captureException(e: Error): void {
    // Filter out specific errors if needed
    if (e.message.includes('10062')) {
      log.debug('Ignoring error 10062 (known Discord API issue)');
      return;
    }
    
    log.error('Captured exception in bot', e);
    
    // You can integrate with Sentry here
    // Sentry.captureException(e);
  }
}