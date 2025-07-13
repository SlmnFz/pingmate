import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import {
  initDB,
  addURL,
  removeURL,
  getUserURLs,
  getAllURLs
} from './db.js';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const INTERVAL = parseInt(process.env.CHECK_INTERVAL || '60000');
const statusMap = new Map(); // {url: 'up' | 'down'}

await initDB();

// --- Commands ---
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `👋 Welcome to PingMate!\nUse /add <name> <url>, /remove <url>, /list`);
});

bot.onText(/\/add (.+?) (https?:\/\/\S+)/, async (msg, match) => {
  const name = match[1];
  const url = match[2];
  try {
    await addURL(msg.from.id, name, url);
    bot.sendMessage(msg.chat.id, `✅ Added [${name}] ${url}`);
  } catch (e) {
    bot.sendMessage(msg.chat.id, `⚠️ Failed to add: ${e.message}`);
  }
});

bot.onText(/\/remove (https?:\/\/\S+)/, async (msg, match) => {
  const url = match[1];
  await removeURL(msg.from.id, url);
  bot.sendMessage(msg.chat.id, `🗑 Removed ${url}`);
});

bot.onText(/\/list/, async (msg) => {
  const urls = await getUserURLs(msg.from.id);
  if (urls.length === 0) {
    return bot.sendMessage(msg.chat.id, '📭 You have no monitored URLs.');
  }
  const list = urls.map(u => `• [${u.name}] ${u.url}`).join('\n');
  bot.sendMessage(msg.chat.id, `📋 Your monitored URLs:\n${list}`);
});

// --- Uptime check ---
async function checkAllUrls() {
  const all = await getAllURLs();
  for (const { user_id, name, url } of all) {
    try {
      const res = await axios.get(url, { timeout: 8000 });
      if (res.status >= 200 && res.status < 300) {
        if (statusMap.get(url) === 'down') {
          bot.sendMessage(user_id, `✅ ${name} is back up!`);
        }
        statusMap.set(url, 'up');
      } else {
        throw new Error(`Status ${res.status}`);
      }
    } catch (err) {
      if (statusMap.get(url) !== 'down') {
        bot.sendMessage(user_id, `❌ ${name} is DOWN!\n${url}\nReason: ${err.message}`);
        statusMap.set(url, 'down');
      }
    }
  }
}

checkAllUrls(); // Initial run
setInterval(checkAllUrls, INTERVAL);
