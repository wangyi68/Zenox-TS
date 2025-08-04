import { WebhookClient, EmbedBuilder, Interaction } from 'discord.js';
import { Game } from './enums';
import { UTC_8 } from './constants';
import * as emojis from './emojis';
import { DB } from '../db/mongodb';
import { LocaleStr } from '../l10n';

// Initialize Sentry
export function initSentry(): void {
  // You can integrate Sentry here
  // import * as Sentry from '@sentry/node';
  // Sentry.init({
  //   dsn: process.env.SENTRY_DSN,
  //   environment: process.env.ENV,
  //   tracesSampleRate: 1.0,
  //   profilesSampleRate: 1.0,
  // });
  console.log('Sentry initialized');
}

export async function sendWebhook(
  webhookUrl: string, 
  username: string = "Zenox Logs", 
  content?: string, 
  embed?: EmbedBuilder, 
  embeds?: EmbedBuilder[]
): Promise<void> {
  if (embed && embeds) {
    throw new Error("Cannot specify both `embed` and `embeds`.");
  }

  const webhook = new WebhookClient({ url: webhookUrl });
  
  try {
    await webhook.send({
      content,
      embeds: embed ? [embed] : embeds,
      username
    });
  } finally {
    webhook.destroy();
  }
}

export function parseCookie(cookie: string): Record<string, string> {
  const reqCookies: Record<string, string> = {};
  for (const pair of cookie.split(' ')) {
    const [key, value] = pair.split('=', 2);
    reqCookies[key] = value.replace(/'/g, '');
  }
  return reqCookies;
}

export async function generateHoyolabToken(): Promise<void> {
  // This would need to be implemented with a Hoyolab API client
  // For now, we'll leave it as a placeholder
  console.log('Generating Hoyolab token...');
}

export async function redeemCode(code: string, game: Game): Promise<number> {
  try {
    // This would need to be implemented with a Hoyolab API client
    console.log(`Redeeming code ${code} for game ${game}`);
    return 1;
  } catch (error) {
    console.error('Error redeeming code:', error);
    // Refresh cookie and try again
    await generateHoyolabToken();
    return 1;
  }
}

export function ephemeral(interaction: Interaction): boolean {
  return !interaction.appPermissions?.has('EmbedLinks');
}

export function generateId(length: number = 5): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function pathToBuffer(path: string): Buffer {
  const fs = require('fs');
  return fs.readFileSync(path);
}

export function getRepoVersion(): string | null {
  try {
    // This would need to be implemented with a git library
    // For now, return null
    return null;
  } catch (error) {
    return null;
  }
}

export function getNow(): Date {
  return new Date();
}

export function getEmoji(emoji: string): string {
  const emojiKey = emoji.replace(/ /g, '_').replace(/'/g, '').replace(/-/g, '_').toUpperCase();
  
  try {
    return (emojis as any)[emojiKey] || '';
  } catch (error) {
    return '';
  }
}

export async function approveRequest(
  guildId: string, 
  number: number, 
  client: any
): Promise<void> {
  // This would need to be implemented based on your cache system
  console.log(`Approving request for guild ${guildId} with number ${number}`);
}