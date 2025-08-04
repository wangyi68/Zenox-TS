import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  EmbedBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel
} from 'discord.js';
import { Zenox } from '../bot/bot';
import { DB, ANALYTICSDB, HOYOVERSEDB } from '../db/mongodb';
import { EventReminder, GuildConfig, EventReminderConfigClass } from '../db/structures';
import { ZENOX_LOCALES, HOYO_OFFICIAL_CHANNELS, _supportCache as _cache } from '../static/constants';
import { Game } from '../static/enums';
import { Embed } from '../static/embeds';
import { YOUTUBE, TWITCH } from '../static/emojis';
import { sendWebhook } from '../static/utils';
import { LocaleStr } from '../l10n';

export class DevCog {
  private client: Zenox;
  public name = 'dev';

  constructor(client: Zenox) {
    this.client = client;
  }

  public data = new SlashCommandBuilder()
    .setName('dev')
    .setDescription('Developer commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('stream_analytics')
        .setDescription('Stream Analytics')
        .addStringOption(option =>
          option.setName('game')
            .setDescription('The game')
            .setRequired(true)
            .addChoices(
              { name: 'Genshin Impact', value: Game.GENSHIN },
              { name: 'Honkai: Star Rail', value: Game.STARRAIL },
              { name: 'Zenless Zone Zero', value: Game.ZZZ }
            )
        )
        .addStringOption(option =>
          option.setName('version')
            .setDescription('The version')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('shards')
        .setDescription('Display Shard Information')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('request')
        .setDescription('Request Permission Check for Guild')
        .addStringOption(option =>
          option.setName('guildid')
            .setDescription('Guild ID')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('locale')
            .setDescription('Locale')
            .setRequired(true)
            .addChoices(
              { name: 'English', value: 'en-US' },
              { name: 'German', value: 'de' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('guild_config')
        .setDescription('View RAW Guild Configuration')
        .addStringOption(option =>
          option.setName('guild_id')
            .setDescription('Guild ID')
            .setRequired(true)
        )
        .addBooleanOption(option =>
          option.setName('ephemeral')
            .setDescription('Make response ephemeral')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('schedule_stream')
        .setDescription('Schedule a Stream and update config')
        .addStringOption(option =>
          option.setName('game')
            .setDescription('The game')
            .setRequired(true)
            .addChoices(
              { name: 'Genshin Impact', value: Game.GENSHIN },
              { name: 'Honkai: Star Rail', value: Game.STARRAIL },
              { name: 'Zenless Zone Zero', value: Game.ZZZ }
            )
        )
        .addStringOption(option =>
          option.setName('version')
            .setDescription('The version')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The title')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('start')
            .setDescription('Start timestamp')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option.setName('end')
            .setDescription('End timestamp')
            .setRequired(true)
        )
        .addAttachmentOption(option =>
          option.setName('image')
            .setDescription('Event image')
            .setRequired(true)
        )
    );

  private isOwner(interaction: CommandInteraction): boolean {
    return interaction.user.id === '585834029484343298';
  }

  public async execute(interaction: CommandInteraction): Promise<void> {
    if (!this.isOwner(interaction)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'stream_analytics':
        await this.streamAnalytics(interaction);
        break;
      case 'shards':
        await this.shards(interaction);
        break;
      case 'request':
        await this.request(interaction);
        break;
      case 'guild_config':
        await this.viewConfig(interaction);
        break;
      case 'schedule_stream':
        await this.scheduleStream(interaction);
        break;
    }
  }

  private async streamAnalytics(interaction: CommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const game = interaction.options.getString('game') as Game;
    const version = interaction.options.getString('version')!;

    const res = ANALYTICSDB.reminders.findOne({
      game: game,
      version: version
    });

    if (res) {
      await interaction.editReply(`Stream Analytics for \`${game}\` version \`${version}\` already exists`);
      return;
    }

    const eventReminder = HOYOVERSEDB.event_reminders.findOne({
      game: game,
      version: version
    });

    if (!eventReminder) {
      await interaction.editReply(`Stream Analytics for \`${game}\` version \`${version}\` does not exist`);
      return;
    }

    const events = new EventReminder(game as Game, version);
    const stats: Record<string, number> = {
      interested_count: 0,
      guild_not_found: 0,
      event_not_found: 0,
      scheduled: 0,
      active: 0,
      completed: 0,
      cancelled: 0
    };

    for (const guildData of events.events) {
      const guild = this.client.guilds.cache.get(guildData[0].toString());
      if (!guild) {
        stats.guild_not_found++;
        continue;
      }

      try {
        const event = await guild.scheduledEvents.fetch(guildData[1].toString());
        stats.interested_count += event.userCount;
        
        let eventStatus = event.status;
        if (eventStatus === 'canceled') {
          eventStatus = 'cancelled';
        } else if (eventStatus === 'ended') {
          eventStatus = 'completed';
        }
        stats[eventStatus]++;
      } catch {
        stats.event_not_found++;
      }
    }

    const embed = new Embed(
      interaction.locale,
      0x005fff,
      "Stream Analytics",
      `**Game:** \`${game}\`\n**Version:** \`${version}\`\n**Interested Count:** \`${stats.interested_count}\`\n`
    );

    await interaction.editReply({ embeds: [embed] });

    // Store in DB
    ANALYTICSDB.reminders.insertOne({
      type: "event_analytics",
      game: game,
      version: version,
      stats: stats
    });

    // Clear events
    events.updateVal("events", []);
  }

  private async shards(interaction: CommandInteraction): Promise<void> {
    const embed = new Embed(
      interaction.locale,
      0x005fff,
      "Shard Informations"
    );

    for (const [shardId, shard] of this.client.ws.shards) {
      const latency = shard.ping;
      embed.addFields({
        name: `Shard [${shardId}]:`,
        value: `**Latency:** \`${latency}ms\`\n`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [embed] });
  }

  private async request(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.options.getString('guildid')!;
    const locale = interaction.options.getString('locale')!;

    if (guildId in _cache) {
      await interaction.reply({ content: "There's a pending approval", ephemeral: true });
      return;
    }

    const guild = DB.guilds.findOne({ id: parseInt(guildId) });
    if (!guild) {
      await interaction.reply({ content: `The bot is not in the guild with ID \`${guildId}\``, ephemeral: true });
      return;
    }

    const num = Math.floor(Math.random() * 9000) + 1000;
    const start = Math.round(Date.now() / 1000);

    const embed = new Embed(
      interaction.locale,
      0x005fff,
      new LocaleStr({ key: "request_embed.title" }),
      new LocaleStr({ key: "request_embed.description", code: num, expire: `<t:${start + 86400}:R>` })
    );

    await interaction.reply({ embeds: [embed] });

    _cache[guildId] = {
      number: num,
      channelID: interaction.channelId,
      messageID: interaction.id,
      start: start,
      locale: locale
    };
  }

  private async viewConfig(interaction: CommandInteraction): Promise<void> {
    const guildId = interaction.options.getString('guild_id')!;
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;

    const rawConfig = DB.guilds.findOne({ id: parseInt(guildId) });
    if (!rawConfig) {
      await interaction.reply({ content: `No Data found for \`${guildId}\``, ephemeral });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Raw Data for \`${guildId}\``)
      .setDescription(`\`\`\`json\n${JSON.stringify(rawConfig, null, 2)}\n\`\`\``)
      .setFooter({ text: `Description Length: ${JSON.stringify(rawConfig).length}` });

    await interaction.reply({ embeds: [embed], ephemeral });
  }

  private async scheduleStream(interaction: CommandInteraction): Promise<void> {
    const game = interaction.options.getString('game') as Game;
    const version = interaction.options.getString('version')!;
    const title = interaction.options.getString('title')!;
    const start = interaction.options.getInteger('start')!;
    const end = interaction.options.getInteger('end')!;
    const image = interaction.options.getAttachment('image')!;

    // Update config
    const conf = this.client.config.auto_stream_codes_config[game];
    conf.disabled = false;
    conf.stream_time = start;
    conf.version = version;
    this.client.config.updateClassConfig(game, conf);
    this.client.config.updateConfigFile();

    const eventData = new EventReminder(game as Game, version);
    if (eventData.published) {
      await interaction.reply({ content: `Version ${version} has been published already`, ephemeral: true });
      return;
    }

    // Save image
    const imageBuffer = Buffer.from(await image.attachment.arrayBuffer());
    const fs = require('fs');
    fs.writeFileSync(`./zenox-assets/assets/event-reminders/${image.name}`, imageBuffer);

    // Update event data
    eventData.updateVal("title", title);
    eventData.updateVal("start", new Date(start * 1000));
    eventData.updateVal("end", new Date(end * 1000));
    eventData.updateVal("image", image.name);

    const [success, forbidden, failed, disabled] = await DevCog.createEvents(this.client, eventData);

    eventData.updateVal("published", true);

    await interaction.reply({ 
      content: `Successfully scheduled ${game} stream for ${version} in ${success} guilds. ${forbidden} guilds missing create event permissions. ${failed} guilds failed to create event.`, 
      ephemeral: true 
    });

    await sendWebhook(
      this.client.logWebhookUrl!,
      "Zenox Logs",
      `Successfully scheduled ${game} stream for ${version} in ${success} guilds. ${forbidden} guilds missing create event permissions. ${failed} guilds failed to create event.`
    );

    ANALYTICSDB.reminders.insertOne({
      type: "create_events",
      game: game,
      version: version,
      stats: {
        success,
        forbidden,
        failed,
        disabled
      }
    });
  }

  private static preTranslateScheduleStream(eventData: EventReminder): Record<string, Record<string, string>> {
    const translations: Record<string, Record<string, string>> = {};
    
    for (const language of Object.keys(ZENOX_LOCALES)) {
      translations[language] = {
        name: new LocaleStr({ key: "stream_reminders_event.name", version: eventData.version, title: eventData.title }).translate(language as any),
        description: new LocaleStr({ 
          key: "stream_reminders_event.description", 
          youtube: YOUTUBE, 
          twitch: TWITCH, 
          youtube_url: HOYO_OFFICIAL_CHANNELS[eventData.game]["YouTube"], 
          twitch_url: HOYO_OFFICIAL_CHANNELS[eventData.game]["Twitch"] 
        }).translate(language as any)
      };
    }
    
    return translations;
  }

  private static async createEvents(client: Zenox, eventData: EventReminder): Promise<[number, number, number, number]> {
    let success = 0, forbidden = 0, failed = 0, disabled = 0;
    const createdEvents: [number, number][] = [];
    
    const guilds = DB.guilds.find({}).map(g => g.id);
    const fs = require('fs');
    let eventImage = fs.readFileSync(`./zenox-assets/assets/event-reminders/${eventData.image}`);
    const translations = DevCog.preTranslateScheduleStream(eventData);

    for (const guildId of guilds) {
      try {
        const guild = new GuildConfig(guildId);
        
        if (!guild.event_reminders[eventData.game].config["streams"]) {
          disabled++;
          continue;
        }

        if (!eventImage || !Buffer.isBuffer(eventImage)) {
          eventImage = fs.readFileSync(`./zenox-assets/assets/event-reminders/${eventData.image}`);
        }

        const discordGuild = client.guilds.cache.get(guildId.toString());
        if (!discordGuild) {
          failed++;
          continue;
        }

        const event = await discordGuild.scheduledEvents.create({
          name: translations[guild.language.value]["name"],
          description: translations[guild.language.value]["description"],
          scheduledStartTime: eventData.start!,
          scheduledEndTime: eventData.end!,
          entityType: GuildScheduledEventEntityType.External,
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          location: HOYO_OFFICIAL_CHANNELS[eventData.game]["Twitch"],
          image: eventImage
        });

        createdEvents.push([guildId, parseInt(event.id)]);
        success++;
      } catch (error: any) {
        if (error.code === 50013) { // Missing permissions
          const guild = new GuildConfig(guildId);
          guild.updateGameConfigValue(eventData.game, EventReminderConfigClass, "streams", false);
          forbidden++;
        } else {
          client.captureException(error);
          failed++;
        }
      }
    }

    eventData.updateVal("events", createdEvents);
    return [success, forbidden, failed, disabled];
  }
}