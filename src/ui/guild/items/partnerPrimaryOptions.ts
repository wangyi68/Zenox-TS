import { Select } from '../../../components';
import { User, Locale } from 'discord.js';

export class PartnerPrimaryOptions extends Select {
  constructor(author: User | null, locale: Locale) {
    super(author, locale, {
      placeholder: 'Select partner options',
      customId: 'partner_options',
      options: [
        { label: 'Partner 1', value: 'partner1' },
        { label: 'Partner 2', value: 'partner2' },
        { label: 'Partner 3', value: 'partner3' }
      ]
    });
  }
}