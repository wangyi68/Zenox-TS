import { Select } from '../../../components';
import { User, Locale } from 'discord.js';

export class PingPreferences extends Select {
  constructor(author: User | null, locale: Locale) {
    super(author, locale, {
      placeholder: 'Select ping preferences',
      customId: 'ping_preferences',
      options: [
        { label: 'Everyone', value: 'everyone' },
        { label: 'Role only', value: 'role' },
        { label: 'No ping', value: 'none' }
      ]
    });
  }
}