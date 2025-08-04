import { View } from '../../components';
import { User, Locale } from 'discord.js';

export class HoyolabCodesUI extends View {
  constructor(author: User | null, data: any, locale: Locale) {
    super(author, locale);
  }

  getEmbed() {
    return {
      title: 'Hoyolab Codes',
      description: 'Manage Hoyolab redemption codes',
      color: 0x00ff00
    };
  }
}