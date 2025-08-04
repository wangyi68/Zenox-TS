import { EmbedBuilder, Locale } from 'discord.js';
import { LocaleStr } from '../l10n';

export class Embed extends EmbedBuilder {
  constructor(
    locale: Locale,
    color: number,
    title?: string | LocaleStr,
    description?: string | LocaleStr
  ) {
    super();
    
    this.setColor(color);
    
    if (title) {
      this.setTitle(typeof title === 'string' ? title : title.translate(locale));
    }
    
    if (description) {
      this.setDescription(typeof description === 'string' ? description : description.translate(locale));
    }
  }

  addField(name: string | LocaleStr, value: string | LocaleStr, inline?: boolean): this {
    const fieldName = typeof name === 'string' ? name : name.translate(Locale.EnglishUS);
    const fieldValue = typeof value === 'string' ? value : value.translate(Locale.EnglishUS);
    
    return super.addFields({
      name: fieldName,
      value: fieldValue,
      inline: inline || false
    });
  }

  setThumbnail(url: string): this {
    return super.setThumbnail(url);
  }

  setImage(url: string): this {
    return super.setImage(url);
  }

  setFooter(text: string | LocaleStr, iconURL?: string): this {
    const footerText = typeof text === 'string' ? text : text.translate(Locale.EnglishUS);
    return super.setFooter({ text: footerText, iconURL });
  }

  setTimestamp(date?: Date): this {
    return super.setTimestamp(date);
  }
}