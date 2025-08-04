import { View } from '../../components';
import { User, Locale } from 'discord.js';

export class GuildSettingsUI extends View {
  constructor(author: User | null, locale: Locale, settings: any) {
    super(author, locale);
  }

  getEmbed() {
    return {
      title: 'Guild Settings',
      description: 'Configure guild settings for Zenox Bot',
      color: 0x00ff00
    };
  }

  getBrandImageFile() {
    return null;
  }
}