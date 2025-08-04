import { 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  EmbedBuilder,
  ButtonInteraction,
  SelectMenuInteraction,
  ModalSubmitInteraction,
  User,
  Locale,
  ChannelType,
  Role,
  GuildBasedChannel
} from 'discord.js';
import { LocaleStr } from '../l10n';
import { log } from '../utils/logger';

// Base UI Component class
export abstract class UIComponent {
  protected locale: Locale;
  protected author: User | null;

  constructor(author: User | null, locale: Locale) {
    this.author = author;
    this.locale = locale;
  }

  protected translate(text: LocaleStr | string): string {
    if (typeof text === 'string') {
      return text;
    }
    return text.translate(this.locale);
  }
}

// Button Component
export class Button extends UIComponent {
  private builder: ButtonBuilder;

  constructor(
    author: User | null,
    locale: Locale,
    options: {
      label?: LocaleStr | string;
      style?: ButtonStyle;
      customId?: string;
      url?: string;
      emoji?: string;
      disabled?: boolean;
    } = {}
  ) {
    super(author, locale);
    
    this.builder = new ButtonBuilder()
      .setStyle(options.style || ButtonStyle.Secondary)
      .setDisabled(options.disabled || false);

    if (options.label) {
      this.builder.setLabel(this.translate(options.label));
    }

    if (options.customId) {
      this.builder.setCustomId(options.customId);
    }

    if (options.url) {
      this.builder.setURL(options.url);
    }

    if (options.emoji) {
      this.builder.setEmoji(options.emoji);
    }
  }

  getBuilder(): ButtonBuilder {
    return this.builder;
  }

  async handleInteraction(interaction: ButtonInteraction): Promise<void> {
    // Override in subclasses
    log.debug(`Button interaction: ${interaction.customId}`);
  }
}

// Select Menu Component
export class Select extends UIComponent {
  private builder: StringSelectMenuBuilder;

  constructor(
    author: User | null,
    locale: Locale,
    options: {
      placeholder?: LocaleStr | string;
      customId?: string;
      minValues?: number;
      maxValues?: number;
      disabled?: boolean;
      options?: Array<{
        label: LocaleStr | string;
        value: string;
        description?: LocaleStr | string;
        emoji?: string;
        default?: boolean;
      }>;
    } = {}
  ) {
    super(author, locale);
    
    this.builder = new StringSelectMenuBuilder()
      .setMinValues(options.minValues || 1)
      .setMaxValues(options.maxValues || 1)
      .setDisabled(options.disabled || false);

    if (options.placeholder) {
      this.builder.setPlaceholder(this.translate(options.placeholder));
    }

    if (options.customId) {
      this.builder.setCustomId(options.customId);
    }

    if (options.options) {
      const selectOptions = options.options.map(opt => 
        new SelectMenuOptionBuilder()
          .setLabel(this.translate(opt.label))
          .setValue(opt.value)
          .setDefault(opt.default || false)
          .setEmoji(opt.emoji || '')
          .setDescription(opt.description ? this.translate(opt.description) : undefined)
      );
      this.builder.addOptions(selectOptions);
    }
  }

  getBuilder(): StringSelectMenuBuilder {
    return this.builder;
  }

  async handleInteraction(interaction: SelectMenuInteraction): Promise<void> {
    // Override in subclasses
    log.debug(`Select interaction: ${interaction.customId}, Values: ${interaction.values.join(', ')}`);
  }
}

// Channel Select Component
export class ChannelSelect extends UIComponent {
  private builder: ChannelSelectMenuBuilder;

  constructor(
    author: User | null,
    locale: Locale,
    options: {
      placeholder?: LocaleStr | string;
      customId?: string;
      channelTypes?: ChannelType[];
      minValues?: number;
      maxValues?: number;
      disabled?: boolean;
    } = {}
  ) {
    super(author, locale);
    
    this.builder = new ChannelSelectMenuBuilder()
      .setMinValues(options.minValues || 1)
      .setMaxValues(options.maxValues || 1)
      .setDisabled(options.disabled || false);

    if (options.placeholder) {
      this.builder.setPlaceholder(this.translate(options.placeholder));
    }

    if (options.customId) {
      this.builder.setCustomId(options.customId);
    }

    if (options.channelTypes) {
      this.builder.setChannelTypes(options.channelTypes);
    }
  }

  getBuilder(): ChannelSelectMenuBuilder {
    return this.builder;
  }

  async handleInteraction(interaction: SelectMenuInteraction): Promise<void> {
    // Override in subclasses
    log.debug(`Channel select interaction: ${interaction.customId}, Channels: ${interaction.values.join(', ')}`);
  }
}

// Role Select Component
export class RoleSelect extends UIComponent {
  private builder: RoleSelectMenuBuilder;

  constructor(
    author: User | null,
    locale: Locale,
    options: {
      placeholder?: LocaleStr | string;
      customId?: string;
      minValues?: number;
      maxValues?: number;
      disabled?: boolean;
    } = {}
  ) {
    super(author, locale);
    
    this.builder = new RoleSelectMenuBuilder()
      .setMinValues(options.minValues || 1)
      .setMaxValues(options.maxValues || 1)
      .setDisabled(options.disabled || false);

    if (options.placeholder) {
      this.builder.setPlaceholder(this.translate(options.placeholder));
    }

    if (options.customId) {
      this.builder.setCustomId(options.customId);
    }
  }

  getBuilder(): RoleSelectMenuBuilder {
    return this.builder;
  }

  async handleInteraction(interaction: SelectMenuInteraction): Promise<void> {
    // Override in subclasses
    log.debug(`Role select interaction: ${interaction.customId}, Roles: ${interaction.values.join(', ')}`);
  }
}

// Text Input Component
export class TextInput extends UIComponent {
  private builder: TextInputBuilder;

  constructor(
    author: User | null,
    locale: Locale,
    options: {
      label: LocaleStr | string;
      customId?: string;
      placeholder?: LocaleStr | string;
      defaultValue?: LocaleStr | string;
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      style?: TextInputStyle;
    } = {}
  ) {
    super(author, locale);
    
    this.builder = new TextInputBuilder()
      .setLabel(this.translate(options.label))
      .setRequired(options.required !== false)
      .setStyle(options.style || TextInputStyle.Short);

    if (options.customId) {
      this.builder.setCustomId(options.customId);
    }

    if (options.placeholder) {
      this.builder.setPlaceholder(this.translate(options.placeholder));
    }

    if (options.defaultValue) {
      this.builder.setValue(this.translate(options.defaultValue));
    }

    if (options.minLength) {
      this.builder.setMinLength(options.minLength);
    }

    if (options.maxLength) {
      this.builder.setMaxLength(options.maxLength);
    }
  }

  getBuilder(): TextInputBuilder {
    return this.builder;
  }
}

// Modal Component
export class Modal extends UIComponent {
  private builder: ModalBuilder;
  private inputs: TextInput[] = [];

  constructor(
    author: User | null,
    locale: Locale,
    options: {
      title: LocaleStr | string;
      customId?: string;
    } = {}
  ) {
    super(author, locale);
    
    this.builder = new ModalBuilder()
      .setTitle(this.translate(options.title));

    if (options.customId) {
      this.builder.setCustomId(options.customId);
    }
  }

  addInput(input: TextInput): this {
    this.inputs.push(input);
    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(input.getBuilder());
    this.builder.addComponents(actionRow);
    return this;
  }

  getBuilder(): ModalBuilder {
    return this.builder;
  }

  async handleSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    // Override in subclasses
    log.debug(`Modal submit: ${interaction.customId}`);
  }
}

// View Component (Container for multiple UI components)
export class View extends UIComponent {
  private components: UIComponent[] = [];
  private actionRows: ActionRowBuilder<any>[] = [];

  constructor(author: User | null, locale: Locale) {
    super(author, locale);
  }

  addButton(button: Button): this {
    this.components.push(button);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(button.getBuilder());
    this.actionRows.push(actionRow);
    return this;
  }

  addSelect(select: Select): this {
    this.components.push(select);
    const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select.getBuilder());
    this.actionRows.push(actionRow);
    return this;
  }

  addChannelSelect(select: ChannelSelect): this {
    this.components.push(select);
    const actionRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(select.getBuilder());
    this.actionRows.push(actionRow);
    return this;
  }

  addRoleSelect(select: RoleSelect): this {
    this.components.push(select);
    const actionRow = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(select.getBuilder());
    this.actionRows.push(actionRow);
    return this;
  }

  getActionRows(): ActionRowBuilder<any>[] {
    return this.actionRows;
  }

  async handleInteraction(interaction: ButtonInteraction | SelectMenuInteraction): Promise<void> {
    const component = this.components.find(comp => {
      if (comp instanceof Button && interaction instanceof ButtonInteraction) {
        return comp.getBuilder().data.custom_id === interaction.customId;
      }
      if (comp instanceof Select && interaction instanceof SelectMenuInteraction) {
        return comp.getBuilder().data.custom_id === interaction.customId;
      }
      return false;
    });

    if (component) {
      if (component instanceof Button && interaction instanceof ButtonInteraction) {
        await component.handleInteraction(interaction);
      } else if (component instanceof Select && interaction instanceof SelectMenuInteraction) {
        await component.handleInteraction(interaction);
      }
    }
  }
}

// Utility functions
export function createButton(
  author: User | null,
  locale: Locale,
  options: {
    label?: LocaleStr | string;
    style?: ButtonStyle;
    customId?: string;
    url?: string;
    emoji?: string;
    disabled?: boolean;
  } = {}
): Button {
  return new Button(author, locale, options);
}

export function createSelect(
  author: User | null,
  locale: Locale,
  options: {
    placeholder?: LocaleStr | string;
    customId?: string;
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
    options?: Array<{
      label: LocaleStr | string;
      value: string;
      description?: LocaleStr | string;
      emoji?: string;
      default?: boolean;
    }>;
  } = {}
): Select {
  return new Select(author, locale, options);
}

export function createModal(
  author: User | null,
  locale: Locale,
  options: {
    title: LocaleStr | string;
    customId?: string;
  } = {}
): Modal {
  return new Modal(author, locale, options);
}