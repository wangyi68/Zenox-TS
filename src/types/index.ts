import { Locale } from 'discord.js';

export interface AutoStreamCodesConfig {
  channel: number;
  message: string;
  stream_time: number;
  version: string;
  disabled: boolean;
}

export interface UserSettings {
  language: Locale;
  dark_mode: boolean;
  dyk: boolean;
}

export interface CodesConfig {
  channel: number | null;
  everyone_ping: boolean;
  role_ping: number | null;
  stream_codes: boolean;
  all_codes: boolean;
}

export interface EventReminderDict {
  streams: boolean;
}

export interface EventReminderConfig {
  config: EventReminderDict;
}

export interface PartnerData {
  inviteUrl: string | null;
  guildName: string | null;
  guildMemberCount: string | null;
  guildDescription: string | null;
}

export interface CodeReward {
  reward: string;
  amount: number;
}

export interface ConfigArgs {
  schedule: boolean;
}

export interface GuildData {
  id: number;
  memberCount: number | null;
  features: string[];
  flags: string[];
  language: string;
  executed_help: boolean;
  pending_deletion: boolean;
  genshin: {
    codes_config: CodesConfig;
    event_reminders: EventReminderDict;
  };
  starrail: {
    codes_config: CodesConfig;
    event_reminders: EventReminderDict;
  };
  zzz: {
    codes_config: CodesConfig;
    event_reminders: EventReminderDict;
  };
  partnerData: PartnerData;
}

export interface UserData {
  id: number;
  features: string[];
  flags: string[];
  settings: {
    language: string;
    dark_mode: boolean;
    dyk: boolean;
  };
}

export interface CodeData {
  game: string;
  code: string;
  is_china: boolean | null;
  rewards: CodeReward[] | null;
  discovered_unix: number | null;
  expire_unix: number | null;
  published: boolean;
  redeemed: any;
}

export interface EventReminderData {
  game: string;
  version: string;
  rtype: string;
  title: string | null;
  start: Date | null;
  end: Date | null;
  image: string | null;
  published: boolean;
  events: [number, number][];
}

export interface SpecialProgramData {
  game: string;
  version: string;
  found: boolean;
  published: boolean;
  image: string | null;
  expire_unix: number | null;
  codes: string[];
}