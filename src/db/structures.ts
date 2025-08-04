import { Locale } from 'discord.js';
import { 
  AutoStreamCodesConfig, 
  UserSettings, 
  CodesConfig, 
  EventReminderConfig, 
  PartnerData, 
  CodeReward,
  ConfigArgs,
  GuildData,
  UserData,
  CodeData,
  EventReminderData,
  SpecialProgramData
} from '../types';
import { Game, DatabaseKey } from '../constants/enums';
import { DB, HOYOVERSEDB } from './mongodb';

export class AutoStreamCodesConfigClass {
  channel: number;
  message: string;
  stream_time: number;
  version: string;
  disabled: boolean;

  constructor(cfg: Record<string, number | string | boolean>) {
    this.channel = cfg.channel as number;
    this.message = cfg.message as string;
    this.stream_time = cfg.stream_time as number;
    this.version = cfg.version as string;
    this.disabled = cfg.disabled as boolean;
  }
}

export class Config {
  schedule: boolean;
  auto_stream_codes_config: Record<Game, AutoStreamCodesConfigClass>;

  constructor(args: ConfigArgs) {
    this.schedule = args.schedule;
    const cfg = this.loadConfigFile();
    const env = process.env.ENV || 'dev';
    
    this.auto_stream_codes_config = {
      [Game.GENSHIN]: new AutoStreamCodesConfigClass(cfg[env][DatabaseKey.GENSHIN]["auto-stream-codes"]),
      [Game.STARRAIL]: new AutoStreamCodesConfigClass(cfg[env][DatabaseKey.STARRAIL]["auto-stream-codes"]),
      [Game.ZZZ]: new AutoStreamCodesConfigClass(cfg[env][DatabaseKey.ZZZ]["auto-stream-codes"])
    };
  }

  updateClassConfig(game: Game, newConf: AutoStreamCodesConfigClass): void {
    this.auto_stream_codes_config[game] = newConf;
  }

  updateConfigFile(): void {
    const conf = this.loadConfigFile();
    const env = process.env.ENV || 'dev';
    
    for (const game of Object.values(Game)) {
      for (const [k, v] of Object.entries(this.auto_stream_codes_config[game])) {
        conf[env][DatabaseKey[game]]["auto-stream-codes"][k] = v;
      }
    }
    this.dumpConfigFile(conf);
  }

  private loadConfigFile(): any {
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync("./zenox/bot/data/zenox.json", "utf8"));
    return cfg;
  }

  private dumpConfigFile(cfg: any): void {
    const fs = require('fs');
    fs.writeFileSync("./zenox/bot/data/zenox.json", JSON.stringify(cfg, null, 4));
  }
}

export class UserSettingsClass {
  language: Locale;
  dark_mode: boolean;
  dyk: boolean;

  constructor(settings: Record<string, string | boolean>) {
    this.language = new Locale(settings.language as string);
    this.dark_mode = settings.dark_mode as boolean;
    this.dyk = settings.dyk as boolean;
  }
}

export class UserConfig {
  private static cache: Record<number, UserConfig> = {};
  
  id: number;
  features: string[];
  flags: string[];
  settings: UserSettingsClass;

  constructor(userID: number) {
    if (userID in UserConfig.cache) {
      const existing = UserConfig.cache[userID];
      this.id = existing.id;
      this.features = existing.features;
      this.flags = existing.flags;
      this.settings = existing.settings;
      return;
    }

    let user = DB.users.findOne({ id: userID });

    if (!user) {
      this.addUser(userID);
      user = DB.users.findOne({ id: userID });
    }

    this.id = user.id;
    this.features = user.features;
    this.flags = user.flags;
    this.settings = new UserSettingsClass(user.settings);

    UserConfig.cache[userID] = this;
  }

  static addUser(userID: number): void {
    const features: string[] = [];
    DB.users.insertOne({
      id: userID,
      features,
      flags: [],
      settings: {
        language: "en-US",
        dark_mode: true,
        dyk: true
      }
    });
  }

  private updateVal(key: string, value: any, operator: string = "$set"): void {
    DB.users.updateOne({ id: this.id }, { [operator]: { [key]: value } });
  }

  updateSetting(setting: string, val: any): void {
    (this.settings as any)[setting] = val;
    this.updateVal(`settings.${setting}`, val);
  }

  updateSettings(settings: UserSettingsClass): void {
    this.settings = settings;
    this.updateVal("settings.language", settings.language.value);
    this.updateVal("settings.dark_mode", settings.dark_mode);
    this.updateVal("settings.dyk", settings.dyk);
  }
}

export class CodesConfigClass {
  channel: number | null;
  everyone_ping: boolean;
  role_ping: number | null;
  stream_codes: boolean;
  all_codes: boolean;

  constructor(config: Record<string, number | boolean | null>) {
    this.channel = config.channel as number | null;
    this.everyone_ping = config.everyone_ping as boolean;
    this.role_ping = config.role_ping as number | null;
    this.stream_codes = config.stream_codes as boolean;
    this.all_codes = config.all_codes as boolean;
  }
}

export class EventReminderConfigClass {
  config: Record<string, boolean>;

  constructor(config: Record<string, boolean>) {
    this.config = { ...config };
  }
}

export class PartnerDataClass {
  inviteUrl: string | null;
  guildName: string | null;
  guildMemberCount: string | null;
  guildDescription: string | null;

  constructor(data: Record<string, string | null>) {
    this.inviteUrl = data.inviteUrl;
    this.guildName = data.guildName;
    this.guildMemberCount = data.guildMemberCount;
    this.guildDescription = data.guildDescription;
  }
}

export class GuildConfig {
  private static cache: Record<number, GuildConfig> = {};

  id: number;
  memberCount: number | null;
  features: string[];
  flags: string[];
  language: Locale;
  executed_help: boolean;
  pending_deletion: boolean;
  codes_config: Record<Game, CodesConfigClass>;
  event_reminders: Record<Game, EventReminderConfigClass>;
  partnerData: PartnerDataClass;

  constructor(guildID: number) {
    if (guildID in GuildConfig.cache) {
      const existing = GuildConfig.cache[guildID];
      Object.assign(this, existing);
      return;
    }

    let guild = DB.guilds.findOne({ id: guildID });

    if (!guild) {
      this.addGuild(guildID);
      guild = DB.guilds.findOne({ id: guildID });
    }

    this.id = guild.id;
    this.memberCount = guild.memberCount;
    this.features = guild.features;
    this.flags = guild.flags;
    this.language = new Locale(guild.language);
    this.executed_help = guild.executed_help;
    this.pending_deletion = guild.pending_deletion;
    
    this.codes_config = {
      [Game.GENSHIN]: new CodesConfigClass(guild[DatabaseKey.GENSHIN].codes_config),
      [Game.STARRAIL]: new CodesConfigClass(guild[DatabaseKey.STARRAIL].codes_config),
      [Game.ZZZ]: new CodesConfigClass(guild[DatabaseKey.ZZZ].codes_config)
    };

    this.event_reminders = {
      [Game.GENSHIN]: new EventReminderConfigClass(guild[DatabaseKey.GENSHIN].event_reminders),
      [Game.STARRAIL]: new EventReminderConfigClass(guild[DatabaseKey.STARRAIL].event_reminders),
      [Game.ZZZ]: new EventReminderConfigClass(guild[DatabaseKey.ZZZ].event_reminders)
    };

    this.partnerData = new PartnerDataClass(guild.partnerData);

    GuildConfig.cache[this.id] = this;
  }

  static addGuild(guildID: number): void {
    const features: string[] = [];
    
    DB.guilds.insertOne({
      id: guildID,
      memberCount: null,
      features,
      flags: [],
      language: "en-US",
      executed_help: false,
      pending_deletion: false,
      [DatabaseKey.GENSHIN]: {
        codes_config: {
          channel: null,
          everyone_ping: false,
          role_ping: null,
          stream_codes: true,
          all_codes: true
        },
        event_reminders: {
          streams: false
        }
      },
      [DatabaseKey.STARRAIL]: {
        codes_config: {
          channel: null,
          everyone_ping: false,
          role_ping: null,
          stream_codes: true,
          all_codes: true
        },
        event_reminders: {
          streams: false
        }
      },
      [DatabaseKey.ZZZ]: {
        codes_config: {
          channel: null,
          everyone_ping: false,
          role_ping: null,
          stream_codes: true,
          all_codes: true
        },
        event_reminders: {
          streams: false
        }
      },
      partnerData: {
        inviteUrl: null,
        guildName: null,
        guildMemberCount: null,
        guildDescription: null
      }
    });
  }

  removeGuild(): void {
    DB.guilds.deleteOne({ id: this.id });
    delete GuildConfig.cache[this.id];
  }

  private updateVal(key: string, value: any, operator: string = "$set"): void {
    DB.guilds.updateOne({ id: this.id }, { [operator]: { [key]: value } });
  }

  updateLanguage(language: Locale): void {
    this.language = language;
    this.updateVal("language", language.value);
  }

  updatePendingDeletion(state: boolean): void {
    this.pending_deletion = state;
    this.updateVal("pending_deletion", state);
  }

  updateGameConfigValue(game: Game, dataType: typeof CodesConfigClass | typeof EventReminderConfigClass, key: string, value: any): void {
    if (dataType === CodesConfigClass) {
      (this.codes_config[game] as any)[key] = value;
      this.updateVal(`${DatabaseKey[game]}.codes_config.${key}`, value);
    } else if (dataType === EventReminderConfigClass) {
      this.event_reminders[game].config[key] = value;
      this.updateVal(`${DatabaseKey[game]}.event_reminders.${key}`, value);
    } else {
      throw new Error("Invalid data type");
    }
  }

  updatePartnerData(key: string, value: string | null): void {
    (this.partnerData as any)[key] = value;
    this.updateVal(`partnerData.${key}`, value);
  }
}

export class CodeRewardClass {
  reward: string;
  amount: number;

  constructor(reward: string, amount: number) {
    this.reward = reward;
    this.amount = amount;
  }
}

export class Code {
  private static cache: Record<Game, Record<string, Code>> = {
    [Game.GENSHIN]: {},
    [Game.STARRAIL]: {},
    [Game.ZZZ]: {}
  };

  game: Game;
  code: string;
  is_china: boolean | null;
  rewards: CodeRewardClass[] | null;
  discovered_unix: number | null;
  expire_unix: number | null;
  published: boolean;
  redeemed: any;

  constructor(game: Game, code: string) {
    if (code in Code.cache[game]) {
      const existing = Code.cache[game][code];
      Object.assign(this, existing);
      return;
    }

    let codeData = HOYOVERSEDB.codes.findOne({ game: game, code });

    if (!codeData) {
      Code.addCode(game, code);
      codeData = HOYOVERSEDB.codes.findOne({ game: game, code });
    }

    this.game = Game(codeData.game);
    this.code = codeData.code;
    this.is_china = codeData.is_china;
    this.rewards = codeData.rewards ? codeData.rewards.map((x: any) => new CodeRewardClass(x.reward, x.amount)) : [];
    this.discovered_unix = codeData.discovered_unix;
    this.expire_unix = codeData.expire_unix;
    this.published = codeData.published;
    this.redeemed = codeData.redeemed;

    Code.cache[game][code] = this;
  }

  private updateVal(key: string, value: any, operator: string = "$set"): void {
    HOYOVERSEDB.codes.updateOne({ game: this.game, code: this.code }, { [operator]: { [key]: value } });
    (this as any)[key] = value;
  }

  private addReward(reward: CodeRewardClass): void {
    this.rewards!.push(reward);
    HOYOVERSEDB.codes.updateOne(
      { game: this.game, code: this.code },
      { $addToSet: { rewards: { reward: reward.reward, amount: reward.amount } } }
    );
  }

  static addCode(game: Game, code: string): void {
    HOYOVERSEDB.codes.insertOne({
      game: game,
      code,
      is_china: null,
      rewards: [],
      discovered_unix: null,
      expire_unix: null,
      published: false,
      redeemed: null
    });
  }
}

export class EventReminder {
  private static cache: Record<Game, Record<string, EventReminder>> = {
    [Game.GENSHIN]: {},
    [Game.STARRAIL]: {},
    [Game.ZZZ]: {}
  };

  game: Game;
  version: string;
  rtype: string;
  title: string | null;
  start: Date | null;
  end: Date | null;
  image: string | null;
  published: boolean;
  events: [number, number][];

  constructor(game: Game, version: string) {
    if (version in EventReminder.cache[game]) {
      const existing = EventReminder.cache[game][version];
      Object.assign(this, existing);
      return;
    }

    let reminderData = HOYOVERSEDB.event_reminders.findOne({ game: game, version });

    if (!reminderData) {
      EventReminder.addEventReminder(game, version);
      reminderData = HOYOVERSEDB.event_reminders.findOne({ game: game, version });
    }

    this.game = Game(reminderData.game);
    this.version = reminderData.version;
    this.rtype = reminderData.rtype;
    this.title = reminderData.title;
    this.start = reminderData.start ? new Date(reminderData.start) : null;
    this.end = reminderData.end ? new Date(reminderData.end) : null;
    this.image = reminderData.image;
    this.published = reminderData.published;
    this.events = reminderData.events || [];

    EventReminder.cache[game][version] = this;
  }

  private updateVal(key: string, value: any, operator: string = "$set"): void {
    (this as any)[key] = value;
    HOYOVERSEDB.event_reminders.updateOne(
      { game: this.game, version: this.version },
      { [operator]: { [key]: value } }
    );
  }

  static addEventReminder(game: Game, version: string): void {
    HOYOVERSEDB.event_reminders.insertOne({
      game: game,
      version,
      rtype: "update_stream",
      title: null,
      start: null,
      end: null,
      image: null,
      published: false,
      events: []
    });
  }
}

export class SpecialProgram {
  private static cache: Record<Game, Record<string, SpecialProgram>> = {
    [Game.GENSHIN]: {},
    [Game.STARRAIL]: {},
    [Game.ZZZ]: {}
  };

  game: Game;
  version: string;
  found: boolean;
  published: boolean;
  image: string | null;
  expire_unix: number | null;
  codes: Code[];

  constructor(game: Game, version: string) {
    if (version in SpecialProgram.cache[game]) {
      const existing = SpecialProgram.cache[game][version];
      Object.assign(this, existing);
      return;
    }

    let programData = HOYOVERSEDB.special_programs.findOne({ game: game, version });

    if (!programData) {
      SpecialProgram.addSpecialProgram(game, version);
      programData = HOYOVERSEDB.special_programs.findOne({ game: game, version });
    }

    this.game = game;
    this.version = version;
    this.found = programData.found;
    this.published = programData.published;
    this.image = programData.image;
    this.expire_unix = programData.expire_unix;
    this.codes = programData.codes ? programData.codes.map((x: string) => new Code(this.game, x)) : [];

    SpecialProgram.cache[game][version] = this;
  }

  private updateVal(key: string, value: any, operator: string = "$set"): void {
    HOYOVERSEDB.special_programs.updateOne(
      { game: this.game, version: this.version },
      { [operator]: { [key]: value } }
    );
  }

  addCode(code: Code): void {
    if (this.codes && this.codes.some(x => x.code === code.code)) {
      return; // Prevent duplicates
    }
    this.codes.push(code);
    this.updateVal("codes", code.code, "$push");
  }

  mark(typ: "found" | "published"): void {
    if (!(this as any)[typ]) {
      (this as any)[typ] = true;
      this.updateVal(typ, true);
    }

    if (typ === "published") {
      for (const code of this.codes) {
        code.updateVal("published", true);
      }
    }
  }

  updateImage(img: string): void {
    this.image = img;
    this.updateVal("image", img);
  }

  static addSpecialProgram(game: Game, version: string): void {
    HOYOVERSEDB.special_programs.insertOne({
      game: game,
      version,
      found: false,
      published: false,
      image: null,
      expire_unix: null,
      codes: []
    });
  }
}