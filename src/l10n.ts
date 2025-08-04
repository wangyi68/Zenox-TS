import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Locale } from 'discord.js';
import { ZENOX_LOCALES, DatabaseKey, LOCALE_TO_TEXTMAP } from './static/constants';
import { Game } from './static/enums';

const SOURCE_LANG = "en-US";
const L10N_PATH = "./zenox/l10n";
const SUPPORTED_LANG = Object.values(ZENOX_LOCALES).map(x => x.value);

export function genStringKey(string: string): string {
  return string.replace(/ /g, "_").replace(/,/g, "").replace(/\./g, "").replace(/-/g, "_").toLowerCase();
}

export interface LocaleStrOptions {
  key?: string;
  customStr?: string;
  translate?: boolean;
  dataGame?: Game;
  [key: string]: any;
}

export class LocaleStr {
  key?: string;
  customStr?: string;
  extras: Record<string, any>;
  translate_: boolean;
  game?: Game;

  constructor(options: LocaleStrOptions) {
    this.key = options.key;
    this.customStr = options.customStr;
    this.extras = { ...options };
    delete this.extras.key;
    delete this.extras.customStr;
    delete this.extras.translate;
    delete this.extras.dataGame;
    this.translate_ = options.translate ?? true;
    this.game = options.dataGame;
  }

  translate(locale: Locale): string {
    return translator.translate(this, locale);
  }
}

export class Translator {
  private _localizations: Record<string, Record<string, string>> = {};
  private _gameTextmaps: Record<Game, Record<Locale, Record<string, string>>> = {
    [Game.GENSHIN]: {},
    [Game.STARRAIL]: {},
    [Game.ZZZ]: {}
  };

  constructor() {
    this.loadL10nFiles();
    this.loadTextMaps();
  }

  private loadTextMaps(): void {
    for (const game of Object.values(Game)) {
      const gameStr = DatabaseKey[game];
      for (const locale of Object.keys(ZENOX_LOCALES)) {
        const fileStr = LOCALE_TO_TEXTMAP[locale as Locale];
        this._gameTextmaps[game][locale as Locale] = this.readJson(
          `zenox/bot/data/text_maps/${gameStr}/${fileStr}.json`
        );
      }
    }
  }

  private loadL10nFiles(): void {
    // This would need to be implemented to read YAML files
    // For now, we'll create a basic structure
    this._localizations[SOURCE_LANG] = {};
  }

  private readJson(filepath: string): Record<string, string> {
    try {
      if (!existsSync(filepath)) {
        return {};
      }
      const jsonData = JSON.parse(readFileSync(filepath, 'utf8'));
      const localizations: Record<string, string> = {};
      for (const [locale, strings] of Object.entries(jsonData)) {
        localizations[locale] = strings as string;
      }
      return localizations;
    } catch (error) {
      console.error(`Error reading JSON file ${filepath}:`, error);
      return {};
    }
  }

  private readYaml(filepath: string): Record<string, string> {
    // This would need to be implemented with a YAML parser
    // For now, return empty object
    return {};
  }

  private translateExtras(extras: Record<string, any>, locale: Locale): Record<string, any> {
    const extras_: Record<string, any> = {};
    for (const [k, v] of Object.entries(extras)) {
      if (v instanceof LocaleStr) {
        extras_[k] = this.translate(v, locale);
      } else if (Array.isArray(v) && v[0] instanceof LocaleStr) {
        extras_[k] = v.map(i => this.translate(i, locale)).join("/");
      } else {
        extras_[k] = v;
      }
    }
    return extras_;
  }

  private static getStringKey(string: LocaleStr): string {
    if (string.key === undefined) {
      if (string.customStr === undefined) {
        throw new Error("Either key or customStr must be provided.");
      }
      return genStringKey(string.customStr);
    }
    return string.key;
  }

  translate(string: LocaleStr | string, locale: Locale): string {
    if (typeof string === "string") {
      return string;
    }

    const extras = this.translateExtras(string.extras, locale);
    const stringKey = Translator.getStringKey(string);

    let sourceString: string | undefined;

    if (string.game !== undefined) {
      sourceString = this._gameTextmaps[string.game][Locale.EnglishUS]?.[stringKey];
    } else {
      sourceString = this._localizations[SOURCE_LANG]?.[stringKey];
    }

    if (string.translate_ && sourceString === undefined && string.customStr === undefined) {
      throw new Error(`String '${stringKey}' not found in source language file`);
    }

    let translation: string | undefined;

    if (string.game !== undefined) {
      translation = this._gameTextmaps[string.game][locale]?.[stringKey];
    } else {
      translation = this._localizations[locale.value]?.[stringKey];
    }

    translation = translation || sourceString || string.customStr || stringKey;

    try {
      translation = translation.replace(/\{(\w+)\}/g, (match, key) => {
        return extras[key] !== undefined ? extras[key] : match;
      });
    } catch (error) {
      // Ignore formatting errors
    }

    return translation;
  }
}

export class AppCommandTranslator {
  constructor() {
    // Discord.js doesn't have built-in translator like discord.py
    // This would need to be implemented differently
  }

  async translate(
    string: any,
    locale: Locale,
    context: any
  ): Promise<string> {
    const key = string.extras?.key;
    if (key === undefined) {
      return string.message;
    }
    return translator.translate(new LocaleStr({ key }), locale);
  }
}

export const translator = new Translator();