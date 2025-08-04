import axios from 'axios';
import { Zenox } from '../bot/bot';
import { sendWebhook } from '../static/utils';
import { log } from '../utils/logger';

export class TopGG {
  private static bot: Zenox;
  private static readonly url = "https://top.gg/api/bots/781529450734551071/stats";

  static async execute(client: Zenox): Promise<void> {
    log.separator('TOP.GG UPDATE TASK');
    log.info('Starting Top.gg guild count update...');
    
    this.bot = client;
    
    if (this.bot.env !== "prod") {
      log.info('Skipping Top.gg update - not in production environment');
      return;
    }

    try {
      const token = process.env.TOPGG_TOKEN;
      if (!token) {
        log.warn('Top.gg token not found, skipping update');
        return;
      }

      const headers = { "Authorization": `Bearer ${token}` };
      const data = { "server_count": client.guilds.cache.size };

      log.info(`Updating Top.gg with ${data.server_count} guilds...`);

      const response = await axios.post(this.url, data, { headers });
      
      if (response.status === 200) {
        log.success('Successfully updated Top.gg guild count');
        
        await sendWebhook(
          client.logWebhookUrl!,
          "TopGG Task",
          "Updated Guild Count on TopGG"
        );
      } else {
        throw new Error(`Top.gg API returned status ${response.status}`);
      }
    } catch (error) {
      log.error('Failed to update Top.gg guild count', error);
      this.bot.captureException(error as Error);
      
      await sendWebhook(
        client.logWebhookUrl!,
        "TopGG Task",
        "Failed to update Guild Count on TopGG"
      );
    }

    log.separator('TOP.GG UPDATE COMPLETE');
  }
}