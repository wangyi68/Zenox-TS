import axios from 'axios';
import { Zenox } from '../bot/bot';
import { Game, WIKI_PAGES, HOYO_REDEEM_URLS, GAME_THUMBNAILS } from '../static/constants';
import { Code, CodeReward, GuildConfig, CodesConfigClass } from '../db/structures';
import { ANALYTICSDB } from '../db/mongodb';
import { Embed } from '../static/embeds';
import { sendWebhook } from '../static/utils';
import { log } from '../utils/logger';

export class WikiCodes {
  private static queuedCodes: Record<Game, Code[][]> = {} as Record<Game, Code[][]>;
  private static readonly limit = 4;
  private static stop = false;

  private static readonly blocked = ["HoYo FEST 2024", "Glad Tidings From Afar"];
  private static readonly blockedLower = [
    "prime", "crucialgames", "steelseries", "alienware", 
    "intel gaming access", "amd rewards", "giveaway)", 
    "bundle", "twitch", "discord", "hoyofest", "hoyo fest"
  ];
  private static readonly rowHeaders = ["Code", "Server", "Rewards", "Duration"];
  private static readonly servers = [
    'All', 'America, Europe, Asia, TW/HK/Macao', 'China', 
    'America', 'Asia', 'Europe', 'TW/HK/Macao'
  ];

  private static initVars(): void {
    for (const game of Object.values(Game)) {
      this.queuedCodes[game] = [];
    }
  }

  private static async getCodes(game: Game): Promise<any[]> {
    try {
      // Note: This would need to be implemented with a proper HTML parser
      // For now, we'll return an empty array
      log.debug(`Fetching codes for ${game} from wiki`);
      return [];
    } catch (error) {
      log.error(`Error fetching codes for ${game}`, error);
      return [];
    }
  }

  static async execute(client: Zenox): Promise<void> {
    log.separator('WIKI CODES TASK');
    log.info('Starting wiki codes discovery...');

    if (this.stop) {
      log.info('Wiki codes task is stopped');
      return;
    }

    try {
      const addedToQueue: Code[] = [];

      if (!Object.keys(this.queuedCodes).length) {
        this.initVars();
      }

      for (const game of Object.values(Game)) {
        if (!WIKI_PAGES[game]) {
          continue;
        }

        log.info(`Processing wiki codes for ${game}...`);
        const codesData = await this.getCodes(game);

        // Process codes data
        for (const codeData of codesData) {
          // Code processing logic would go here
          // This is a simplified version
          log.debug(`Processing code data for ${game}`);
        }
      }

      if (addedToQueue.length > 0) {
        log.success(`Added ${addedToQueue.length} codes to queue`);
        
        await sendWebhook(
          client.logWebhookUrl!,
          "WikiCodes Task",
          `Added ${addedToQueue.length} Codes to Queue | Codes in Queue per Game: ${Object.entries(this.queuedCodes)
            .filter(([_, codes]) => codes.length > 0)
            .map(([game, codes]) => `${game}: ${codes.length}`)
            .join(', ')}`
        );
      } else {
        log.info('No new codes found in wiki');
        
        await sendWebhook(
          client.logWebhookUrl!,
          "WikiCodes Task",
          "No New Codes found in Wiki"
        );
      }
    } catch (error) {
      log.error('Error executing wiki codes task', error);
      client.captureException(error as Error);
      
      await sendWebhook(
        client.logWebhookUrl!,
        "WikiCodes Task",
        "Error while executing Task"
      );
    }

    log.separator('WIKI CODES COMPLETE');
  }

  static async checkPublish(client: Zenox): Promise<void> {
    log.separator('WIKI CODES PUBLISH CHECK');
    log.info('Checking for codes to publish...');

    if (this.stop) {
      log.info('Wiki codes task is stopped');
      return;
    }

    if (!Object.keys(this.queuedCodes).length) {
      this.initVars();
    }

    if (!Object.keys(this.queuedCodes).length) {
      log.info('No codes in queue to publish');
      return;
    }

    for (const game of Object.values(Game)) {
      if (!WIKI_PAGES[game]) {
        continue;
      }

      log.info(`Processing publish queue for ${game}...`);
      
      const codes: Code[] = [];
      const rewards: CodeReward[] = [];

      // Process queued codes
      for (let i = 0; i < Math.min(this.queuedCodes[game].length, this.limit); i++) {
        const queuedCodes = this.queuedCodes[game][i];
        if (queuedCodes.length > 0) {
          codes.push(queuedCodes[0]);
          
          // Collect rewards
          for (const reward of queuedCodes[0].rewards || []) {
            const existingReward = rewards.find(r => r.reward === reward.reward);
            if (existingReward) {
              existingReward.amount += reward.amount;
            } else {
              rewards.push(new CodeReward(reward.reward, reward.amount));
            }
          }
        }
      }

      if (codes.length > 0) {
        await this.publish(client, game, codes, rewards);
      }
    }

    log.separator('WIKI CODES PUBLISH COMPLETE');
  }

  private static async publish(
    client: Zenox, 
    game: Game, 
    codes: Code[], 
    rewards: CodeReward[]
  ): Promise<void> {
    log.info(`Publishing ${codes.length} codes for ${game}...`);

    let success = 0, failed = 0, forbidden = 0, noChannel = 0, noRole = 0;

    const guilds = client.db.guilds.find({}).map(g => g.id);

    for (const guildId of guilds) {
      try {
        const guild = new GuildConfig(guildId);
        let role = null;
        let displayWarning = false;

        if (!guild.codes_config[game].channel) {
          noChannel++;
          continue;
        }

        if (guild.codes_config[game].role_ping) {
          const discordGuild = client.guilds.cache.get(guildId.toString());
          if (discordGuild) {
            role = discordGuild.roles.cache.get(guild.codes_config[game].role_ping.toString());
            if (!role) {
              displayWarning = true;
              guild.updateGameConfigValue(game, CodesConfigClass, "role_ping", null);
              noRole++;
            }
          }
        }

        // Create embed and send message
        const embed = new Embed(
          guild.language,
          0x00ff00,
          "Wiki Codes",
          `Codes found for ${game}`
        );

        const channel = client.channels.cache.get(guild.codes_config[game].channel.toString());
        if (channel && 'send' in channel) {
          await channel.send({
            content: `New codes available! ${role ? role.toString() : ''} ${guild.codes_config[game].everyone_ping ? '@everyone' : ''}`,
            embeds: [embed]
          });
          success++;
        }
      } catch (error) {
        log.error(`Error publishing codes to guild ${guildId}`, error);
        failed++;
      }
    }

    // Log results
    log.table('Publish Results', {
      'Success': success,
      'Failed': failed,
      'Forbidden': forbidden,
      'No Channel': noChannel,
      'No Role': noRole
    });

    // Send webhook
    await sendWebhook(
      client.logWebhookUrl!,
      "WikiCodes Task",
      `Published ${success} Codes, ${failed} Failed, ${forbidden} Forbidden, ${noChannel} No Channel, ${noRole} No Role`
    );

    // Store analytics
    ANALYTICSDB.wiki_codes.insertOne({
      type: "send_wiki_codes",
      game: game,
      time: new Date(),
      stats: {
        success,
        failed,
        forbidden,
        no_channel: noChannel,
        no_role: noRole
      }
    });
  }
}