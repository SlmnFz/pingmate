# PingMate 🚦

**PingMate** is a Telegram bot that helps you monitor the uptime of your personal URLs or services. It sends alerts when your services go down or come back online.

## ✨ Features

- ✅ Add your own URLs to monitor.
- ❌ Get notified when a service goes down.
- 🔁 Get notified when it's back up.
- 💾 URLs are stored per-user using SQLite.
- 📎 Easy Telegram commands to manage your links.

---

## 📦 Setup

### 1. Clone the repository

```bash
git clone https://github.com/SlmnFz/pingmate.git
cd pingmate
```

### 2. Create `.env` file

```env
BOT_TOKEN=your_telegram_bot_token
CHECK_INTERVAL=60000  # Interval in milliseconds (e.g. 60000 = 1 min)
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run the bot

```bash
npm start
```

---

## 💬 Telegram Bot Commands

| Command             | Description                                    |
|---------------------|-----------------------------------------------|
| `/start`            | Start the bot and show welcome message        |
| `/add <name> <url>` | Add a URL to monitor (supports HTTP/HTTPS)   |
| `/list`             | Show monitored URLs with delete buttons      |
| `/stats`            | View monitoring statistics and uptime data   |
| `/status`           | Check current status of all monitored URLs   |
| `/help`             | Show detailed help and usage examples        |

## ✨ Features

- **Interactive Management**: Delete URLs using inline buttons in `/list`
- **Real-time Monitoring**: Instant notifications when sites go up/down
- **Performance Tracking**: Response time measurement and statistics
- **Uptime Analytics**: Track uptime percentage and average response times
- **Smart Error Detection**: Categorized error messages (timeout, DNS, HTTP errors)
- **User-friendly Interface**: Clean formatting with status emojis and timestamps

---

## 🗄 Tech Stack

- **Node.js**
- **SQLite** via `sqlite3` npm package
- **Telegram Bot API** via `node-telegram-bot-api`

---

## 📄 License

MIT © [SlmnFz](https://github.com/SlmnFz)

> Contributions and suggestions welcome! Open an issue or PR 🙌
