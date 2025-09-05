import axios from 'axios';

import { parseMessageFromError } from './common';

export const formatMessage = (message: any) => {
  try {
    if (!message) return '';

    let stringifiedMessage: string;
    try {
      stringifiedMessage = parseMessageFromError(message);
    } catch (error) {
      stringifiedMessage = 'Error parsing message';
    }

    if (!stringifiedMessage || typeof stringifiedMessage !== 'string') {
      return 'Invalid message format';
    }

    return (
      stringifiedMessage
        // Escape special Markdown characters that could break parsing
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/\*/g, '\\*') // Escape asterisks
        .replace(/_/g, '\\_') // Escape underscores
        .replace(/\[/g, '\\[') // Escape square brackets
        .replace(/\]/g, '\\]') // Escape square brackets
        .replace(/\(/g, '\\(') // Escape parentheses
        .replace(/\)/g, '\\)') // Escape parentheses
        .replace(/~/g, '\\~') // Escape tildes
        .replace(/`/g, '\\`') // Escape backticks
        .replace(/>/g, '\\>') // Escape greater than
        .replace(/#/g, '\\#') // Escape hash
        .replace(/\+/g, '\\+') // Escape plus
        .replace(/-/g, '\\-') // Escape minus
        .replace(/=/g, '\\=') // Escape equals
        .replace(/\|/g, '\\|') // Escape pipe
        .replace(/\{/g, '\\{') // Escape curly braces
        .replace(/\}/g, '\\}') // Escape curly braces
        .replace(/\./g, '\\.') // Escape dots
        .replace(/!/g, '\\!') // Escape exclamation marks
        // Remove or replace characters that could cause issues
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .trim()
    ); // Remove leading/trailing whitespace
  } catch (error) {
    console.error('Error in formatMessage:', error);
    return 'Error formatting message';
  }
};

export const reportIssue = async (message: string) => {
  try {
    const formattedMessage = formatMessage(message);
    await sendTelegramNotification(formattedMessage);
  } catch (error) {
    console.error('Error in reportIssue:', error);
    // Don't throw the error to prevent crashing the calling code
  }
};

export const sendTelegramNotification = async (message: any) => {
  try {
    const telegramToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

    if (!telegramToken) {
      console.error('Telegram bot token is not configured');
      return;
    }

    const chatIds = ['767616895'];
    const formattedMessage = formatMessage(message);

    if (!formattedMessage) {
      console.error('No message to send to Telegram');
      return;
    }

    // Use Promise.allSettled to handle all requests and not fail if one fails
    const promises = chatIds.map(async (chatId) => {
      try {
        await axios.post(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          {
            chat_id: chatId,
            text: `[TDF ERROR] ${
              process.env.NODE_ENV === 'development' ? '[DEV]' : '[PROD]'
            } [${new Date().toLocaleString('ru-RU', {
              hour12: false,
            })}] ${formattedMessage}`,
            parse_mode: 'Markdown',
          },
        );
      } catch (error) {
        console.error(`Error sending TG message to chat ${chatId}:`, error);
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error in sendTelegramNotification:', error);
  }
};
