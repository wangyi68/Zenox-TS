import axios from 'axios';
import { Zenox } from '../bot/bot';
import { Game } from '../static/enums';
import { HOYOLAB_GAME_IDS, GAME_THUMBNAILS } from '../static/constants';
import { SpecialProgram, Code } from '../db/structures';
import { log } from '../utils/logger';

export class HoyolabCodes {
  private static bot: Zenox;
  private static firstRun = true;
  private static readonly STATES = ["Disabled", "No Schedule", "Not yet live", "Distributed", "Searching", "Found"];

  /**
   * Possible states
   * 0 = Disabled Game
   * 1 = No Stream scheduled
   * 2 = Stream not yet live
   * 3 = Codes already Distributed
   * 4 = Codes haven't been found 
   * 5 = Codes have been found
   * (Determined by if all codes are present (according to hoyoverse))
   */

  private static async updateMessage(): Promise<void> {
    log.info('Updating Hoyolab codes messages...');
    
    for (const game of Object.values(Game)) {
      try {
        const specialProgram = new SpecialProgram(game, this.bot.config.auto_stream_codes_config[game].version);
        
        // Note: buildMessage method would need to be implemented
        // const [_, embed, __] = await specialProgram.buildMessage(this.bot, 'en-US' as any);
        // const view = new HoyolabCodesUI(null, specialProgram, 'en-US' as any);
        
        const state = this.getState(game, this.bot.config.auto_stream_codes_config[game].version);
        const channel = this.bot.channels.cache.get(this.bot.config.auto_stream_codes_config[game].channel);
        
        if (channel && 'messages' in channel) {
          const message = await channel.messages.fetch(this.bot.config.auto_stream_codes_config[game].message);
          
          const content = `State \`${state}\` \`${this.STATES[state]}\` Version \`${this.bot.config.auto_stream_codes_config[game].version}\` Next Update <t:${Math.round(Date.now()/1000 + 180)}:R>`;
          
          // await message.edit({
          //   content,
          //   embeds: [embed],
          //   components: [view]
          // });
          
          log.debug(`Updated message for ${game} - State: ${this.STATES[state]}`);
        }
      } catch (error) {
        log.error(`Error updating message for ${game}`, error);
      }
    }
  }

  private static getHeader(gameId: number): Record<string, string> {
    return {
      "authority": "bbs-api-os.hoyolab.com",
      "method": "GET",
      "path": `/community/painter/wapi/circle/channel/guide/material?game_id=${gameId}`,
      "scheme": "https",
      "accept": "application/json, text/plain, */*",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-DE,en;q=0.9,de-DE;q=0.8,de;q=0.7,en-GB;q=0.6,en-US;q=0.5,zh-CN;q=0.4,zh;q=0.3",
      "origin": "https://www.hoyolab.com",
      "referer": "https://www.hoyolab.com/",
      "sec-ch-ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": "Windows",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-rpc-app_version": "3.1.0",
      "x-rpc-client_type": "5",
      "x-rpc-hour": "18",
      "x-rpc-language": "en-us",
      "x-rpc-page_info": '{"pageName":"","pageType":"","pageId":"","pageArrangement":"","gameId":""}',
      "x-rpc-page_name": "",
      "x-rpc-show-translated": "False",
      "x-rpc-source_info": '{"sourceName":"","sourceType":"","sourceId":"","sourceArrangement":"","sourceGameId":""}',
      "x-rpc-sys_version": "Windows NT 10.0",
      "x-rpc-timezone": "Europe/Berlin",
      "x-rpc-weekday": "5"
    };
  }

  private static async apiRequest(game: Game): Promise<any> {
    log.info(`Sending Hoyolab request for ${game}`);
    
    const url = `https://bbs-api-os.hoyolab.com/community/painter/wapi/circle/channel/guide/material?game_id=${HOYOLAB_GAME_IDS[game]}`;

    try {
      const response = await axios.get(url, {
        headers: {
          ...this.getHeader(HOYOLAB_GAME_IDS[game]),
          "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
        }
      });

      return response.data;
    } catch (error) {
      log.error(`API request failed for ${game}`, error);
      throw error;
    }
  }

  private static parseData(responseData: any, specialProgram: SpecialProgram): boolean {
    let moduleData = null;
    
    // Check if Module 7 exists in data (7 = Stream Codes)
    for (const module of responseData.data.modules) {
      if (module.module_type !== 7) {
        continue;
      }
      moduleData = module;
      break;
    }

    if (!moduleData) {
      return false;
    }

    const totalCodes: number = moduleData.exchange_group.bonuses_summary.code_count;
    if (!moduleData.exchange_group.bonuses) {
      return false;
    }

    for (const codeData of moduleData.exchange_group.bonuses) {
      if (!codeData.exchange_code) {
        continue;
      }

      const code = new Code(specialProgram.game, codeData.exchange_code);
      
      if (code.expire_unix !== codeData.offline_at) {
        code.updateVal("expire_unix", codeData.offline_at);
      }
      
      if (!code.discovered_unix) {
        code.updateVal("discovered_unix", Math.round(Date.now() / 1000));
      }
      
      if (code.is_china === null) {
        code.is_china = false;
      }

      specialProgram.addCode(code);
    }

    if (totalCodes !== specialProgram.codes.length) {
      return false;
    }

    return true;
  }

  private static getState(game: Game, version: string): number {
    const config = this.bot.config.auto_stream_codes_config[game];
    
    if (config.disabled) {
      return 0; // Disabled Game
    } else if (config.stream_time === 0) {
      return 1; // No Stream scheduled
    } else if (config.stream_time - Date.now() / 1000 > 0) {
      return 2; // Stream hasn't started yet
    } else if (new SpecialProgram(game, version).published) {
      return 3; // Codes have been distributed already
    } else if (new SpecialProgram(game, version).found) {
      return 5; // Codes have been found
    }
    
    return 4; // Codes haven't been found
  }

  static async execute(client: Zenox): Promise<void> {
    log.separator('HOYOLAB CODES TASK');
    log.info('Starting Hoyolab codes discovery...');
    
    this.bot = client;

    for (const game of Object.values(Game)) {
      try {
        const state = this.getState(game, this.bot.config.auto_stream_codes_config[game].version);
        
        if (![4, 5].includes(state)) {
          log.debug(`Skipping ${game} - State: ${this.STATES[state]}`);
          continue;
        }

        const specialProgram = new SpecialProgram(game, this.bot.config.auto_stream_codes_config[game].version);

        if (state === 4) {
          log.info(`Searching for codes in ${game}...`);
          const responseData = await this.apiRequest(game);
          const result = this.parseData(responseData, specialProgram);
          
          if (result) {
            specialProgram.mark("found");
            log.success(`Found codes for ${game}`);
          } else {
            log.warn(`No codes found for ${game}`);
          }
        }
      } catch (error) {
        log.error(`Error processing ${game}`, error);
      }
    }

    await this.updateMessage();
    log.separator('HOYOLAB CODES COMPLETE');
  }
}