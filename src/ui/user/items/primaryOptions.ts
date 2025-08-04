import { Select } from '../../../components';
import { User, Locale } from 'discord.js';

export class UserPrimaryOptions extends Select {
  constructor(author: User | null, locale: Locale) {
    super(author, locale, {
      placeholder: 'Select user options',
      customId: 'user_options',
      options: [
        { label: 'Language', value: 'language' },
        { label: 'Theme', value: 'theme' },
        { label: 'Notifications', value: 'notifications' }
      ]
    });
  }
}