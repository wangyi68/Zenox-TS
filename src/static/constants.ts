import { Locale } from 'discord.js';
import { Game } from './enums';

export const _supportCache: Record<string, any> = {};

export const DEV_GUILD = 1129777497454686330;
export const VERSION = 2.0;
export const UTC_8 = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai' });

export const ZENOX_LOCALES: Record<Locale, { name: string; emoji: string }> = {
  [Locale.EnglishUS]: { name: "English", emoji: "🇺🇸" },
  [Locale.German]: { name: "Deutsch", emoji: "🇩🇪" }
  // [Locale.Russian]: { name: "Russian", emoji: "🇷🇺" }
};

export const LOCALE_TO_TEXTMAP: Record<Locale, string> = {
  [Locale.EnglishUS]: "TextMapEN",
  [Locale.German]: "TextMapDE"
};

export const DatabaseKey: Record<Game, string> = {
  [Game.GENSHIN]: "GenshinImpact",
  [Game.STARRAIL]: "StarRail",
  [Game.ZZZ]: "ZenlessZoneZero",
};

export const HOYOLAB_GAME_IDS: Record<Game, number> = {
  [Game.GENSHIN]: 2,
  [Game.STARRAIL]: 6,
  [Game.ZZZ]: 8
};

export const HOYO_OFFICIAL_CHANNELS: Record<Game, Record<string, string>> = {
  [Game.GENSHIN]: {
    "YouTube": "https://www.youtube.com/@GenshinImpact", 
    "Twitch": "https://www.twitch.tv/genshinimpactofficial"
  },
  [Game.STARRAIL]: {
    "YouTube": "https://www.youtube.com/@HonkaiStarRail", 
    "Twitch": "https://www.twitch.tv/honkaistarrail"
  },
  [Game.ZZZ]: {
    "YouTube": "https://www.youtube.com/@ZZZ_Official", 
    "Twitch": "https://www.twitch.tv/zenlesszonezero"
  }
};

export const HOYO_REDEEM_URLS: Record<Game, string> = {
  [Game.GENSHIN]: "https://genshin.hoyoverse.com/en/gift?code=",
  [Game.STARRAIL]: "https://hsr.hoyoverse.com/gift?code=",
  [Game.ZZZ]: "https://zenless.hoyoverse.com/redemption?code="
};

export const WIKI_PAGES: Record<Game, string | null> = {
  [Game.GENSHIN]: "https://genshin-impact.fandom.com/wiki/Promotional_Code",
  [Game.STARRAIL]: "https://honkai-star-rail.fandom.com/wiki/Redemption_Code",
  [Game.ZZZ]: "https://zenless-zone-zero.fandom.com/wiki/Redemption_Code"
};

export const GAME_TO_EMOJI: Record<Game, string> = {
  [Game.GENSHIN]: "<:LOGO_GENSHIN:1352032994382188614>",
  [Game.STARRAIL]: "<:LOGO_STARRAIL:1352033070219526187>",
  [Game.ZZZ]: "<:LOGO_ZENLESS:1352033174640922724>"
};

export const GAME_THUMBNAILS: Record<Game, string> = {
  [Game.GENSHIN]: "Icon_Paimon_Menu.png",
  [Game.STARRAIL]: "Icon_Pom_Menu.png",
  [Game.ZZZ]: "Icon_Bangboo_Menu.png"
};

// Static Icons for redemption codes embed

export const ZX_GAME_TO_GPY_GAME: Record<Game, string> = {
  [Game.GENSHIN]: "genshin",
  [Game.STARRAIL]: "starrail",
  [Game.ZZZ]: "zzz"
};

// Zenox Game enum to genshin.py game enum

export const GPY_GAME_TO_ZX_GAME: Record<string, Game> = Object.fromEntries(
  Object.entries(ZX_GAME_TO_GPY_GAME).map(([key, value]) => [value, key as Game])
);

// genshin.py game enum to Zenox Game enum