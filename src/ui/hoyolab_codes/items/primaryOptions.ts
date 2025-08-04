import { Select } from '../../../components';
import { User, Locale } from 'discord.js';

export class HoyolabPrimaryOptions extends Select {
  constructor(author: User | null, locale: Locale) {
    super(author, locale, {
      placeholder: 'Select Hoyolab options',
      customId: 'hoyolab_options',
      options: [
        { label: 'Genshin Impact', value: 'genshin' },
        { label: 'Honkai: Star Rail', value: 'starrail' },
        { label: 'Zenless Zone Zero', value: 'zenless' }
      ]
    });
  }
}