import { EmbedBuilder, Locale } from 'discord.js';
import { log } from '../utils/logger';

export function getErrorEmbed(
  error: Error,
  locale: Locale
): { embed: EmbedBuilder; known: boolean } {
  let known = true;
  let embed: EmbedBuilder | null = null;

  // Handle specific error types
  if (error.name === 'DiscordAPIError') {
    const discordError = error as any;
    
    switch (discordError.code) {
      case 50013: // Missing Permissions
        embed = new EmbedBuilder()
          .setTitle('🚫 Permission Denied')
          .setDescription('You do not have the required permissions to perform this action.')
          .setColor(0xff0000);
        break;
        
      case 10062: // Unknown Interaction
        embed = new EmbedBuilder()
          .setTitle('⏰ Interaction Expired')
          .setDescription('This interaction has expired. Please try again.')
          .setColor(0xffa500);
        break;
        
      case 10003: // Unknown Channel
        embed = new EmbedBuilder()
          .setTitle('📺 Channel Not Found')
          .setDescription('The specified channel could not be found.')
          .setColor(0xff0000);
        break;
        
      case 10013: // Unknown User
        embed = new EmbedBuilder()
          .setTitle('👤 User Not Found')
          .setDescription('The specified user could not be found.')
          .setColor(0xff0000);
        break;
        
      case 10011: // Unknown Role
        embed = new EmbedBuilder()
          .setTitle('🎭 Role Not Found')
          .setDescription('The specified role could not be found.')
          .setColor(0xff0000);
        break;
        
      case 50001: // Missing Access
        embed = new EmbedBuilder()
          .setTitle('🔒 Access Denied')
          .setDescription('I do not have access to the specified channel.')
          .setColor(0xff0000);
        break;
        
      case 50005: // Request Entity Too Large
        embed = new EmbedBuilder()
          .setTitle('📏 Content Too Large')
          .setDescription('The content is too large to send.')
          .setColor(0xff0000);
        break;
        
      default:
        known = false;
        break;
    }
  }

  // If no specific error was handled, create a generic error embed
  if (embed === null) {
    known = false;
    const description = error.message || `${error.name}: ${error.message}`;
    
    embed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(description)
      .setColor(0xff0000)
      .setTimestamp();
  }

  // Add footer
  embed.setFooter({ 
    text: 'If this error persists, please contact support.' 
  });

  log.debug(`Error embed created - Known: ${known}, Error: ${error.name}`);

  return { embed, known };
}

export function handleError(error: Error, context?: string): void {
  log.error(`Error${context ? ` in ${context}` : ''}`, error);
  
  // You can add additional error handling logic here
  // For example, sending to error reporting service
}