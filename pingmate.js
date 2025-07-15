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
  getUserStats
} from './db.js';

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

// --- Commands ---
bot.onText(/\/start/, (msg) => {
  const welcomeMessage = `👋 Welcome to PingMate!

🔍 *Monitor your websites 24/7*

*Available Commands:*
/add <name> <url> - Add a website to monitor
/list - View all your monitored URLs
/stats - View monitoring statistics
/status - Check current status of all URLs
/help - Show this help message

*Example:*
\`/add Google https://google.com\``;

  bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `🔧 *PingMate Commands*

/add <name> <url> - Add website to monitor
/list - View monitored URLs with delete buttons
/stats - View your monitoring statistics
/status - Check current status of all URLs
/help - Show this help

*Features:*
• Real-time uptime monitoring
• Instant notifications when sites go down/up
• Response time tracking
• Easy management with inline buttons

*Supported URL formats:*
• https://example.com
• http://example.com
• https://subdomain.example.com/path`;

  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/add (.+?) (https?:\/\/\S+)/, async (msg, match) => {
  const name = match[1].trim();
  const url = match[2];

  if (name.length > 50) {
    return bot.sendMessage(msg.chat.id, '⚠️ Name too long. Please use less than 50 characters.');
  }

  try {
    await addURL(msg.from.id, name, url);
    bot.sendMessage(msg.chat.id, `✅ Added *${name}*\n🔗 ${url}\n\n⏱️ Monitoring will start within ${INTERVAL / 1000} seconds.`, { parse_mode: 'Markdown' });
  } catch (e) {
    bot.sendMessage(msg.chat.id, `⚠️ Failed to add: ${e.message}`);
  }
});

bot.onText(/\/list/, async (msg) => {
  const urls = await getUserURLs(msg.from.id);
  if (urls.length === 0) {
    return bot.sendMessage(msg.chat.id, '📭 You have no monitored URLs.\n\nUse /add <name> <url> to start monitoring!');
  }

  const keyboard = {
    inline_keyboard: urls.map(u => [
      {
        text: `🗑️ Delete ${u.name}`,
        callback_data: `delete_${u.name}`
      }
    ])
  };

  const list = urls.map(u => {
    const emoji = getStatusEmoji(u.status);
    const responseTime = formatUptime(u.response_time);
    return `${emoji} *${u.name}*\n🔗 ${u.url}\n⚡ ${responseTime}`;
  }).join('\n\n');

  bot.sendMessage(msg.chat.id, `📋 *Your monitored URLs:*\n\n${list}`, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

bot.onText(/\/stats/, async (msg) => {
  const stats = await getUserStats(msg.from.id);

  if (stats.total === 0) {
    return bot.sendMessage(msg.chat.id, '📊 No statistics available yet.\n\nAdd some URLs to monitor first!');
  }

  const uptime = ((stats.up / stats.total) * 100).toFixed(1);
  const avgResponse = stats.avg_response_time ? formatUptime(Math.round(stats.avg_response_time)) : 'N/A';

  const statsMessage = `📊 *Your Monitoring Stats*

📈 *Total URLs:* ${stats.total}
✅ *Online:* ${stats.up}
❌ *Offline:* ${stats.down}
📊 *Uptime:* ${uptime}%
⚡ *Avg Response:* ${avgResponse}

Last updated: ${new Date().toLocaleString()}`;

  bot.sendMessage(msg.chat.id, statsMessage, { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, async (msg) => {
  const urls = await getUserURLs(msg.from.id);

  if (urls.length === 0) {
    return bot.sendMessage(msg.chat.id, '📭 No URLs to check.\n\nUse /add <name> <url> to start monitoring!');
  }

  const statusList = urls.map(u => {
    const emoji = getStatusEmoji(u.status);
    const responseTime = formatUptime(u.response_time);
    const lastCheck = u.last_check ?
      new Date(u.last_check).toLocaleTimeString() : 'Never';

    return `${emoji} *${u.name}*\n⚡ ${responseTime} | 🕐 ${lastCheck}`;
  }).join('\n\n');

  bot.sendMessage(msg.chat.id, `🔍 *Current Status:*\n\n${statusList}`, { parse_mode: 'Markdown' });
});

// Handle callback queries (delete buttons)
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;

  if (data.startsWith('delete_')) {
    const name = data.replace('delete_', '');

    try {
      await removeURL(query.from.id, name);

      // Update the message
      const urls = await getUserURLs(query.from.id);

      if (urls.length === 0) {
        bot.editMessageText('📭 All URLs removed!\n\nUse /add <name> <url> to start monitoring again.', {
          chat_id: chatId,
          message_id: query.message.message_id
        });
      } else {
        const keyboard = {
          inline_keyboard: urls.map(u => [
            {
              text: `🗑️ Delete ${u.name}`,
              callback_data: `delete_${u.name}`
            }
          ])
        };

        const list = urls.map(u => {
          const emoji = getStatusEmoji(u.status);
          const responseTime = formatUptime(u.response_time);
          return `${emoji} *${u.name}*\n🔗 ${u.url}\n⚡ ${responseTime}`;
        }).join('\n\n');

        bot.editMessageText(`📋 *Your monitored URLs:*\n\n${list}`, {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

      bot.answerCallbackQuery(query.id, { text: `✅ Deleted ${name}` });
    } catch (e) {
      bot.answerCallbackQuery(query.id, { text: `❌ Failed to delete: ${e.message}` });
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
          bot.sendMessage(user_id, `✅ *${name}* is back up!\n🔗 ${url}\n⚡ Response time: ${formatUptime(responseTime)}`, { parse_mode: 'Markdown' });
        }
        statusMap.set(url, 'up');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      await updateURLStatus(url, 'down', 0);

      if (statusMap.get(url) !== 'down') {
        const errorMsg = err.code === 'ECONNABORTED' ? 'Timeout' :
          err.code === 'ENOTFOUND' ? 'DNS Error' :
            err.message;

        bot.sendMessage(user_id, `❌ *${name}* is DOWN!\n🔗 ${url}\n🚨 Reason: ${errorMsg}`, { parse_mode: 'Markdown' });
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