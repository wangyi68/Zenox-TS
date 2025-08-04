import { 
  SlashCommandBuilder, 
  CommandInteraction,
  VoiceChannel
} from 'discord.js';
import { Zenox } from '../bot/bot';
import { log } from '../utils/logger';

export class OthersCog {
  private client: Zenox;
  public name = 'others';
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(client: Zenox) {
    this.client = client;
    this.setupTasks();
  }

  private setupTasks(): void {
    if (this.client.env === "prod") {
      this.startUpdateVcsState();
    }
  }

  private startUpdateVcsState(): void {
    // Update every 2 hours
    this.updateInterval = setInterval(async () => {
      await this.updateVcsState();
    }, 2 * 60 * 60 * 1000);

    log.info('Started VCS state update task');
  }

  private async updateVcsState(): Promise<void> {
    try {
      const guild = this.client.guilds.cache.get(this.client.guild_id.toString()) || 
                   await this.client.guilds.fetch(this.client.guild_id.toString());

      if (!guild) {
        log.warn('Could not fetch guild for VCS state update');
        return;
      }

      const CATEGORY_ID = '1337553668181856277';
      const category = guild.channels.cache.find(channel => 
        channel.type === 4 && channel.id === CATEGORY_ID
      );

      if (!category) {
        log.warn('VCS category not found');
        return;
      }

      const voiceChannels = guild.channels.cache.filter(channel => 
        channel.type === 2 && channel.parentId === CATEGORY_ID
      ) as Map<string, VoiceChannel>;

      const vcIds = Array.from(voiceChannels.keys());
      let currentIndex = 0;

      // Server Count
      const serverCount = this.client.guilds.cache.size;
      const vc = voiceChannels.get(vcIds[currentIndex]);
      
      if (vc) {
        await vc.setName(`${serverCount} Servers`);
        log.debug(`Updated VCS channel name to "${serverCount} Servers"`);
      }

      // Rotate to next channel for next update
      currentIndex = (currentIndex + 1) % vcIds.length;
    } catch (error) {
      log.error('Error updating VCS state', error);
    }
  }

  public data = new SlashCommandBuilder()
    .setName('others')
    .setDescription('Other utility commands');

  public async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.reply({
      content: 'Other commands module loaded',
      ephemeral: true
    });
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      log.info('Stopped VCS state update task');
    }
  }
}