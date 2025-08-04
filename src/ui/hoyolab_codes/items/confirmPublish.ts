import { Button } from '../../../components';
import { User, Locale, ButtonStyle } from 'discord.js';

export class ConfirmPublish extends Button {
  constructor(author: User | null, locale: Locale) {
    super(author, locale, {
      label: 'Confirm Publish',
      style: ButtonStyle.Success,
      customId: 'confirm_publish',
      emoji: '✅'
    });
  }
}