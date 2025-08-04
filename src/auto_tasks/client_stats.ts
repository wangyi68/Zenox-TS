import { Zenox } from '../bot/bot';
import { DB } from '../db/mongodb';
import { Embed } from '../static/embeds';
import { sendWebhook } from '../static/utils';
import { log } from '../utils/logger';

export class ClientStats {
  private static getEmbed(guildCount: number, userCount: number): Embed {
    const desc = `Guilds: ${guildCount}\nUsers: ${userCount}`;
    const embed = new Embed(
      'en-US' as any,
      0xf189ff,
      "Client Stats",
      desc
    );
    return embed;
  }

  static async execute(client: Zenox): Promise<void> {
    log.separator('CLIENT STATS TASK');
    log.info('Starting client stats collection...');
    
    try {
      let memberCount = 0;
      const guildCount = client.guilds.cache.size;

      log.info(`Processing ${guildCount} guilds...`);
      
      // Update member counts for each guild
      for (const guild of client.guilds.cache.values()) {
        memberCount += guild.memberCount;
        DB.guilds.updateOne(
          { id: guild.id },
          { $set: { memberCount: guild.memberCount } }
        );
      }

      // Update growth statistics
      DB.const.updateOne(
        { _id: "guild_growth" },
        { 
          $push: { 
            growth: { 
              date: new Date(), 
              guilds: guildCount 
            } 
          } 
        },
        { upsert: true }
      );

      DB.const.updateOne(
        { _id: "guild_user_growth" },
        { 
          $push: { 
            growth: { 
              date: new Date(), 
              users: memberCount 
            } 
          } 
        },
        { upsert: true }
      );

      // Log statistics
      log.table('Client Statistics', {
        'Total Guilds': guildCount,
        'Total Users': memberCount,
        'Average Users per Guild': Math.round(memberCount / guildCount)
      });

      // Send webhook with stats
      const embed = ClientStats.getEmbed(guildCount, memberCount);
      await sendWebhook(
        client.logWebhookUrl!,
        "Client Stats Task",
        undefined,
        embed
      );

      log.success('Client stats collected and sent successfully');
      log.separator('CLIENT STATS COMPLETE');
    } catch (error) {
      log.error('Error collecting client stats', error);
      client.captureException(error as Error);
    }
  }
}