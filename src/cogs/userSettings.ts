import { 
  SlashCommandBuilder, 
  CommandInteraction 
} from 'discord.js';
import { Zenox } from '../bot/bot';
import { ephemeral } from '../static/utils';
import { UserConfig } from '../db/structures';
import { log } from '../utils/logger';

export class UserSettingsCog {
  private client: Zenox;
  public name = 'user_settings';

  constructor(client: Zenox) {
    this.client = client;
  }

  public data = new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure your user settings');

  public async execute(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: ephemeral(interaction) });

    try {
      log.command('settings', interaction.user.id, interaction.guild?.id);

      const userConfig = new UserConfig(parseInt(interaction.user.id));
      const settings = userConfig.settings;

      // Note: UserSettingsUI would need to be implemented
      // const view = new UserSettingsUI(
      //   interaction.user,
      //   settings.language,
      //   settings
      // );

      // For now, send a simple response
      await interaction.editReply({
        content: `User settings for ${interaction.user.username}`,
        embeds: [{
          title: 'User Settings',
          description: `Language: ${settings.language.value}\nDark Mode: ${settings.dark_mode ? 'Enabled' : 'Disabled'}\nDYK: ${settings.dyk ? 'Enabled' : 'Disabled'}`,
          color: 0x00ff00
        }]
      });

      log.success(`User settings displayed for ${interaction.user.username}`);
    } catch (error) {
      log.error('Error displaying user settings', error);
      await interaction.editReply({
        content: 'An error occurred while loading user settings.',
        embeds: [{
          title: 'Error',
          description: 'Failed to load user configuration',
          color: 0xff0000
        }]
      });
    }
  }
}