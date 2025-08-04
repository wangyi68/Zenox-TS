import { View } from './components';
import { User, Locale } from 'discord.js';

export class DevUI extends View {
  constructor(author: User | null, locale: Locale) {
    super(author, locale);
  }

  getEmbed() {
    return {
      title: 'Developer Tools',
      description: 'Developer interface for Zenox Bot',
      color: 0x00ff00
    };
  }
}