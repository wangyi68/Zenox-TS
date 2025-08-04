import { Select } from '../../../components';
import { User, Locale } from 'discord.js';

export class PrimaryOptions extends Select {
  constructor(author: User | null, locale: Locale) {
    super(author, locale, {
      placeholder: 'Select primary options',
      customId: 'primary_options',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ]
    });
  }
}