import { Zenox } from '../bot/bot';
import { DB } from '../db/mongodb';
import { GuildConfig } from '../db/structures';
import { sendWebhook } from '../static/utils';
import { Embed } from '../static/embeds';
import { log } from '../utils/logger';

interface CleanDBResults {
  skipped: number;
  restored: number;
  pending: number;
  deleted: number;
  error: number;
}

export class CleanDB {
  private static bot: Zenox;
  private static start: number;
  private static end: number;
  private static results: CleanDBResults;

  private static resetVars(): void {
    this.results = {
      skipped: 0,
      restored: 0,
      pending: 0,
      deleted: 0,
      error: 0
    };
  }

  private static incrVal(val: keyof CleanDBResults): void {
    this.results[val]++;
  }

  private static getEmbed(): Embed {
    const desc = `Guilds\n\`\`\`\n${this.results.skipped} Skipped\n${this.results.restored} Restored\n${this.results.pending} Pending\n${this.results.deleted} Deleted\n${this.results.error} Error\n\`\`\``;
    
    const embed = new Embed(
      'en-US' as any,
      0xf189ff,
      "Database CleanUp Results",
      desc
    );
    
    embed.setFooter(`Task Duration: ${(this.end - this.start).toFixed(3)}s`);
    return embed;
  }

  static async execute(client: Zenox): Promise<void> {
    log.separator('DATABASE CLEANUP TASK');
    log.info('Starting database cleanup task...');
    
    this.bot = client;
    this.resetVars();
    this.start = Date.now();

    // Get all guilds from Discord
    const guilds: number[] = [];
    const dbGuilds: number[] = [];
    
    for (const guild of this.bot.guilds.cache.values()) {
      guilds.push(guild.id);
    }
    
    log.info(`Found ${guilds.length} guilds in Discord cache`);

    // Get all guilds from database
    const dbGuildsData = DB.guilds.find({}, { _id: 0, id: 1 });
    log.info(`Found ${dbGuildsData.length} guilds in database`);

    // Process each guild in database
    log.progress(0, dbGuildsData.length, 'Processing database guilds');
    
    for (let i = 0; i < dbGuildsData.length; i++) {
      const guildData = dbGuildsData[i];
      
      try {
        const guild = new GuildConfig(guildData.id);
        
        if (guild.id in guilds) {
          dbGuilds.push(guild.id);
          
          if (guild.pending_deletion) {
            guild.updatePendingDeletion(false);
            this.incrVal('restored');
            log.success(`Restored guild ${guild.id} (was pending deletion)`);
          } else {
            this.incrVal('skipped');
            log.debug(`Skipped guild ${guild.id} (no action needed)`);
          }
        } else {
          if (guild.pending_deletion) {
            guild.removeGuild();
            this.incrVal('deleted');
            log.warn(`Deleted guild ${guild.id} (was pending deletion and not in Discord)`);
          } else {
            guild.updatePendingDeletion(true);
            this.incrVal('pending');
            log.warn(`Marked guild ${guild.id} as pending deletion (not in Discord)`);
          }
        }
      } catch (error) {
        this.bot.captureException(error as Error);
        this.incrVal('error');
        log.error(`Error processing guild ${guildData.id}`, error);
      }
      
      // Update progress every 10 guilds
      if ((i + 1) % 10 === 0 || i + 1 === dbGuildsData.length) {
        log.progress(i + 1, dbGuildsData.length, 'Processing database guilds');
      }
    }

    // Create new guild configs for guilds not in database
    log.info('Creating new guild configs for missing guilds...');
    let newGuilds = 0;
    
    for (const guildId of guilds) {
      if (!dbGuilds.includes(guildId)) {
        new GuildConfig(guildId);
        newGuilds++;
        log.debug(`Created new config for guild ${guildId}`);
      }
    }
    
    if (newGuilds > 0) {
      log.success(`Created ${newGuilds} new guild configurations`);
    }

    this.end = Date.now();
    const duration = this.end - this.start;
    
    // Log results
    log.table('Database Cleanup Results', {
      'Skipped': this.results.skipped,
      'Restored': this.results.restored,
      'Pending': this.results.pending,
      'Deleted': this.results.deleted,
      'Error': this.results.error,
      'New Guilds': newGuilds,
      'Duration': `${duration.toFixed(3)}s`
    });

    // Send webhook with results
    try {
      await sendWebhook(
        this.bot.logWebhookUrl!,
        "cleanDB Task",
        undefined,
        this.getEmbed()
      );
      log.success('Cleanup results sent via webhook');
    } catch (error) {
      log.error('Failed to send cleanup results via webhook', error);
    }

    log.separator('DATABASE CLEANUP COMPLETE');
    log.success(`Database cleanup completed in ${duration.toFixed(3)}s`);
  }
}