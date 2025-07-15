// pingmate.js
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import {
  initDB,
  addURL,
  removeURL,
  getUserURLs,
  getAllURLs,
  updateURLStatus,
  getUserStats,
  setUserLanguage,
  getUserLanguage,
  toggleURLActive
} from './db.js';
import { messages } from './messages.js';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const INTERVAL = parseInt(process.env.CHECK_INTERVAL || '60000');
const statusMap = new Map(); // {url: 'up' | 'down'}

await initDB();

// --- Helper Functions ---
function formatUptime(responseTime) {
  if (responseTime === 0) return 'N/A';
  return responseTime < 1000 ? `${responseTime}ms` : `${(responseTime / 1000).toFixed(1)}s`;
}

function getStatusEmoji(status) {
  switch (status) {
    case 'up': return '✅';
    case 'down': return '❌';
    default: return '⚪';
  }
}

async function getMessage(userId, key, ...args) {
  const lang = await getUserLanguage(userId);
  const message = messages[lang][key];
  return typeof message === 'function' ? message(...args) : message;
}

// --- Commands ---
bot.onText(/\/start/, async (msg) => {
  const welcomeMessage = await getMessage(msg.from.id, 'welcome');
  bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, async (msg) => {
  const helpMessage = await getMessage(msg.from.id, 'help');
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/add (.+?) (https?:\/\/\S+)/, async (msg, match) => {
  const name = match[1].trim();
  const url = match[2];

  if (name.length > 50) {
    const errorMessage = await getMessage(msg.from.id, 'nameTooLong');
    return bot.sendMessage(msg.chat.id, errorMessage);
  }

  try {
    await addURL(msg.from.id, name, url);
    const successMessage = await getMessage(msg.from.id, 'added', name, url, INTERVAL);
    bot.sendMessage(msg.chat.id, successMessage, { parse_mode: 'Markdown' });
  } catch (e) {
    const errorMessage = await getMessage(msg.from.id, 'failedToAdd', e.message);
    bot.sendMessage(msg.chat.id, errorMessage);
  }
});

bot.onText(/\/list/, async (msg) => {
  const urls = await getUserURLs(msg.from.id);
  if (urls.length === 0) {
    const noURLsMessage = await getMessage(msg.from.id, 'noURLs');
    return bot.sendMessage(msg.chat.id, noURLsMessage);
  }

  const keyboard = {
    inline_keyboard: urls.map(u => [
      {
        text: `🗑️ Delete ${u.name}`,
        callback_data: `delete_${u.name}`
      },
      {
        text: u.active ? `⏸️ Deactivate ${u.name}` : `▶️ Activate ${u.name}`,
        callback_data: `toggle_${u.name}`
      }
    ])
  };

  const list = urls.map(u => {
    const emoji = getStatusEmoji(u.status);
    const responseTime = formatUptime(u.response_time);
    const activeStatus = u.active ? 'Active' : 'Inactive';
    return `${emoji} *${u.name}* (${activeStatus})\n🔗 ${u.url}\n⚡ ${responseTime}`;
  }).join('\n\n');

  const monitoredURLsMessage = await getMessage(msg.from.id, 'monitoredURLs');
  bot.sendMessage(msg.chat.id, `${monitoredURLsMessage}\n\n${list}`, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

bot.onText(/\/stats/, async (msg) => {
  const stats = await getUserStats(msg.from.id);

  if (stats.total === 0) {
    const noStatsMessage = await getMessage(msg.from.id, 'noStats');
    return bot.sendMessage(msg.chat.id, noStatsMessage);
  }

  const uptime = ((stats.up / stats.total) * 100).toFixed(1);
  const avgResponse = stats.avg_response_time ? formatUptime(Math.round(stats.avg_response_time)) : 'N/A';
  const statsMessage = await getMessage(msg.from.id, 'stats', stats, uptime, avgResponse);

  bot.sendMessage(msg.chat.id, statsMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, async (msg) => {
  const urls = await getUserURLs(msg.from.id);

  if (urls.length === 0) {
    const noStatusMessage = await getMessage(msg.from.id, 'noStatus');
    return bot.sendMessage(msg.chat.id, noStatusMessage);
  }

  const statusList = urls.map(u => {
    const emoji = getStatusEmoji(u.status);
    const responseTime = formatUptime(u.response_time);
    const lastCheck = u.last_check ? new Date(u.last_check).toLocaleTimeString() : 'Never';
    const activeStatus = u.active ? 'Active' : 'Inactive';
    return `${emoji} *${u.name}* (${activeStatus})\n⚡ ${responseTime} | 🕐 ${lastCheck}`;
  }).join('\n\n');

  const statusMessage = await getMessage(msg.from.id, 'status');
  bot.sendMessage(msg.chat.id, `${statusMessage}\n\n${statusList}`, { parse_mode: 'Markdown' });
});

bot.onText(/\/language (en|fa)/, async (msg, match) => {
  const language = match[1];
  await setUserLanguage(msg.from.id, language);
  const languageMessage = await getMessage(msg.from.id, 'languageSet', language);
  bot.sendMessage(msg.chat.id, languageMessage);
});

bot.onText(/\/language/, async (msg) => {
  const invalidLanguageMessage = await getMessage(msg.from.id, 'invalidLanguage');
  bot.sendMessage(msg.chat.id, invalidLanguageMessage);
});

// Handle callback queries (delete and toggle buttons)
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;

  if (data.startsWith('delete_')) {
    const name = data.replace('delete_', '');

    try {
      await removeURL(query.from.id, name);

      const urls = await getUserURLs(query.from.id);

      if (urls.length === 0) {
        const noURLsMessage = await getMessage(query.from.id, 'noURLs');
        bot.editMessageText(noURLsMessage, {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      } else {
        const keyboard = {
          inline_keyboard: urls.map(u => [
            {
              text: `🗑️ Delete ${u.name}`,
              callback_data: `delete_${u.name}`
            },
            {
              text: u.active ? `⏸️ Deactivate ${u.name}` : `▶️ Activate ${u.name}`,
              callback_data: `toggle_${u.name}`
            }
          ])
        };

        const list = urls.map(u => {
          const emoji = getStatusEmoji(u.status);
          const responseTime = formatUptime(u.response_time);
          const activeStatus = u.active ? 'Active' : 'Inactive';
          return `${emoji} *${u.name}* (${activeStatus})\n🔗 ${u.url}\n⚡ ${responseTime}`;
        }).join('\n\n');

        const monitoredURLsMessage = await getMessage(query.from.id, 'monitoredURLs');
        bot.editMessageText(`${monitoredURLsMessage}\n\n${list}`, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

      const deletedMessage = await getMessage(query.from.id, 'deleted', name);
      bot.answerCallbackQuery(query.id, { text: deletedMessage });
    } catch (e) {
      const failedMessage = await getMessage(query.from.id, 'failedToDelete', e.message);
      bot.answerCallbackQuery(query.id, { text: failedMessage });
    }
  } else if (data.startsWith('toggle_')) {
    const name = data.replace('toggle_', '');

    try {
      await toggleURLActive(query.from.id, name);
      const urls = await getUserURLs(query.from.id);
      const url = urls.find(u => u.name === name);
      const active = url.active;

      const keyboard = {
        inline_keyboard: urls.map(u => [
          {
            text: `🗑️ Delete ${u.name}`,
            callback_data: `delete_${u.name}`
          },
          {
            text: u.active ? `⏸️ Deactivate ${u.name}` : `▶️ Activate ${u.name}`,
            callback_data: `toggle_${u.name}`
          }
        ])
      };

      const list = urls.map(u => {
        const emoji = getStatusEmoji(u.status);
        const responseTime = formatUptime(u.response_time);
        const activeStatus = u.active ? 'Active' : 'Inactive';
        return `${emoji} *${u.name}* (${activeStatus})\n🔗 ${u.url}\n⚡ ${responseTime}`;
      }).join('\n\n');

      const monitoredURLsMessage = await getMessage(query.from.id, 'monitoredURLs');
      bot.editMessageText(`${monitoredURLsMessage}\n\n${list}`, {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      const toggledMessage = await getMessage(query.from.id, 'toggled', name, active);
      bot.answerCallbackQuery(query.id, { text: toggledMessage });
    } catch (e) {
      const failedMessage = await getMessage(query.from.id, 'failedToDelete', e.message);
      bot.answerCallbackQuery(query.id, { text: failedMessage });
    }
  }
});

// --- Uptime check ---
async function checkAllUrls() {
  const all = await getAllURLs();

  for (const { user_id, name, url } of all) {
    const startTime = Date.now();

    try {
      const res = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'PingMate-Bot/1.0'
        }
      });

      const responseTime = Date.now() - startTime;

      if (res.status >= 200 && res.status < 300) {
        await updateURLStatus(url, 'up', responseTime);

        if (statusMap.get(url) === 'down') {
          const lang = await getUserLanguage(user_id);
          bot.sendMessage(user_id, messages[lang].up(name, url, formatUptime(responseTime)), { parse_mode: 'Markdown' });
        }
        statusMap.set(url, 'up');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      await updateURLStatus(url, 'down', 0);

      if (statusMap.get(url) !== 'down') {
        const lang = await getUserLanguage(user_id);
        const errorMsg = err.code === 'ECONNABORTED' ? 'Timeout' :
          err.code === 'ENOTFOUND' ? 'DNS Error' :
            err.message;
        bot.sendMessage(user_id, messages[lang].down(name, url, errorMsg), { parse_mode: 'Markdown' });
        statusMap.set(url, 'down');
      }
    }
  }
}

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Initial run and interval
checkAllUrls();
setInterval(checkAllUrls, INTERVAL);

console.log('🚀 PingMate bot is running...');