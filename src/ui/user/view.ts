import { View } from '../../components';
import { User, Locale } from 'discord.js';

export class UserSettingsUI extends View {
  constructor(author: User | null, locale: Locale, settings: any) {
    super(author, locale);
  }

  getEmbed() {
    return {
      title: 'User Settings',
      description: 'Configure your user settings for Zenox Bot',
      color: 0x00ff00
    };
  }

  getBrandImageFile() {
    return null;
  }
}