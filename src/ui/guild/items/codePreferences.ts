import { Select } from '../../../components';
import { User, Locale } from 'discord.js';

export class CodePreferences extends Select {
  constructor(author: User | null, locale: Locale) {
    super(author, locale, {
      placeholder: 'Select code preferences',
      customId: 'code_preferences',
      options: [
        { label: 'Auto-redeem', value: 'auto_redeem' },
        { label: 'Manual redeem', value: 'manual_redeem' },
        { label: 'Notification only', value: 'notification' }
      ]
    });
  }
}