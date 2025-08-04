import { 
  SlashCommandBuilder, 
  CommandInteraction 
} from 'discord.js';
import { Zenox } from '../bot/bot';
import { log } from '../utils/logger';
import { CleanDB } from '../auto_tasks/cleanDB';
import { TopGG } from '../auto_tasks/topGG';
import { HoyolabCodes } from '../auto_tasks/hoyolabCodes';
import { WikiCodes } from '../auto_tasks/wikiCodes';
import { ClientStats } from '../auto_tasks/client_stats';

export class ScheduleCog {
  private client: Zenox;
  public name = 'schedule';
  private intervals: NodeJS.Timeout[] = [];

  constructor(client: Zenox) {
    this.client = client;
    this.setupScheduledTasks();
  }

  private setupScheduledTasks(): void {
    if (!this.client.config.schedule) {
      log.info('Scheduled tasks disabled');
      return;
    }

    log.info('Setting up scheduled tasks...');

    // Clean DB - Daily at midnight UTC+8
    this.scheduleDailyTask('clean_db', 0, 0, () => CleanDB.execute(this.client));

    // Wiki codes - Twice daily at 1:00 and 13:00 UTC+8
    this.scheduleDailyTask('request_wiki_codes', 1, 0, () => WikiCodes.execute(this.client));
    this.scheduleDailyTask('request_wiki_codes', 13, 0, () => WikiCodes.execute(this.client));

    // Publish wiki codes - Twice daily at 3:00 and 15:00 UTC+8
    this.scheduleDailyTask('publish_wiki_codes', 3, 0, () => WikiCodes.checkPublish(this.client));
    this.scheduleDailyTask('publish_wiki_codes', 15, 0, () => WikiCodes.checkPublish(this.client));

    // Hoyolab codes - Every 3 minutes
    this.scheduleIntervalTask('request_hoyolab_codes', 3 * 60 * 1000, () => HoyolabCodes.execute(this.client));

    // Top.gg count - Daily at midnight UTC+8
    this.scheduleDailyTask('update_topgg_count', 0, 0, () => TopGG.execute(this.client));

    // Client stats - Daily at midnight UTC+8
    this.scheduleDailyTask('update_client_stats', 0, 0, () => ClientStats.execute(this.client));

    log.success('All scheduled tasks configured');
  }

  private scheduleDailyTask(name: string, hour: number, minute: number, task: () => Promise<void>): void {
    const interval = setInterval(async () => {
      try {
        log.info(`Executing scheduled task: ${name}`);
        await task();
        log.success(`Completed scheduled task: ${name}`);
      } catch (error) {
        log.error(`Error in scheduled task: ${name}`, error);
      }
    }, this.getTimeUntilNext(hour, minute));

    this.intervals.push(interval);
    log.info(`Scheduled task '${name}' for ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC+8`);
  }

  private scheduleIntervalTask(name: string, intervalMs: number, task: () => Promise<void>): void {
    const interval = setInterval(async () => {
      try {
        log.debug(`Executing interval task: ${name}`);
        await task();
        log.debug(`Completed interval task: ${name}`);
      } catch (error) {
        log.error(`Error in interval task: ${name}`, error);
      }
    }, intervalMs);

    this.intervals.push(interval);
    log.info(`Scheduled interval task '${name}' every ${intervalMs / 1000 / 60} minutes`);
  }

  private getTimeUntilNext(hour: number, minute: number): number {
    const now = new Date();
    const utc8Offset = 8 * 60; // UTC+8 in minutes
    const localOffset = now.getTimezoneOffset();
    const totalOffset = utc8Offset + localOffset;

    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    target.setTime(target.getTime() + totalOffset * 60 * 1000);

    // If target time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
  }

  public data = new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule management commands');

  public async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.reply({
      content: 'Schedule management module loaded',
      ephemeral: true
    });
  }

  public destroy(): void {
    // Clear all intervals
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];
    
    log.info('All scheduled tasks stopped');
  }

  // Manual task execution methods for testing
  public async executeCleanDB(): Promise<void> {
    log.info('Manually executing clean DB task');
    await CleanDB.execute(this.client);
  }

  public async executeHoyolabCodes(): Promise<void> {
    log.info('Manually executing Hoyolab codes task');
    await HoyolabCodes.execute(this.client);
  }

  public async executeWikiCodes(): Promise<void> {
    log.info('Manually executing wiki codes task');
    await WikiCodes.execute(this.client);
  }

  public async executeTopGG(): Promise<void> {
    log.info('Manually executing Top.gg task');
    await TopGG.execute(this.client);
  }

  public async executeClientStats(): Promise<void> {
    log.info('Manually executing client stats task');
    await ClientStats.execute(this.client);
  }
}