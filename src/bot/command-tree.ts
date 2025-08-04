import { 
  CommandInteraction, 
  InteractionResponse, 
  EmbedBuilder,
  Locale
} from 'discord.js';
import { log } from '../utils/logger';

export class CommandTree {
  static async onError(interaction: CommandInteraction, error: Error): Promise<void> {
    try {
      // Check if it's a permission error
      if (error.message.includes('Missing Permissions') || error.message.includes('CheckFailure')) {
        log.warn(`Permission error for command ${interaction.commandName} by ${interaction.user.id}`);
        return;
      }

      log.error(`Command error: ${interaction.commandName}`, error);

      // Create error embed
      const embed = new EmbedBuilder()
        .setTitle('❌ Command Error')
        .setDescription('An error occurred while executing this command.')
        .setColor(0xff0000)
        .setTimestamp();

      // Add error details in development
      if (process.env.NODE_ENV === 'development') {
        embed.addFields({
          name: 'Error Details',
          value: `\`\`\`${error.message}\`\`\``,
          inline: false
        });
      }

      // Send error response
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followup.send({ embeds: [embed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      } catch (sendError) {
        log.error('Failed to send error response', sendError);
      }

      // Capture exception for monitoring
      if (interaction.client && 'captureException' in interaction.client) {
        (interaction.client as any).captureException(error);
      }
    } catch (handlerError) {
      log.error('Error in command error handler', handlerError);
    }
  }

  static getErrorEmbed(error: Error, locale: Locale): { embed: EmbedBuilder; recognized: boolean } {
    let recognized = false;
    let title = '❌ Error';
    let description = 'An unexpected error occurred.';

    // Handle specific error types
    if (error.message.includes('Missing Permissions')) {
      recognized = true;
      title = '🚫 Permission Denied';
      description = 'You do not have permission to use this command.';
    } else if (error.message.includes('Unknown Interaction')) {
      recognized = true;
      title = '⏰ Interaction Expired';
      description = 'This interaction has expired. Please try the command again.';
    } else if (error.message.includes('Unknown Channel')) {
      recognized = true;
      title = '📺 Channel Not Found';
      description = 'The specified channel could not be found.';
    } else if (error.message.includes('Unknown User')) {
      recognized = true;
      title = '👤 User Not Found';
      description = 'The specified user could not be found.';
    } else if (error.message.includes('Unknown Role')) {
      recognized = true;
      title = '🎭 Role Not Found';
      description = 'The specified role could not be found.';
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0xff0000)
      .setTimestamp();

    return { embed, recognized };
  }
}