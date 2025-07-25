// messages.js
export const messages = {
    en: {
        welcome: `👋 Welcome to PingMate!\n\n🔍 *Monitor your websites 24/7*\n\n*Available Commands:*\n/add <name> <url> - Add a website to monitor\n/list - View all your monitored URLs\n/stats - View monitoring statistics\n/status - Check current status of all URLs\n/language <en|fa> - Set language\n/help - Show this help message\n\n*Example:*\n\`/add Google https://google.com\``,
        help: `🔧 *PingMate Commands*\n\n/add <name> <url> - Add website to monitor\n/list - View monitored URLs with delete and toggle buttons\n/stats - View your monitoring statistics\n/status - Check current status of all URLs\n/language <en|fa> - Set language\n/help - Show this help\n\n*Features:*\n• Real-time uptime monitoring\n• Instant notifications when sites go down/up\n• Response time tracking\n• Language support (English/Farsi)\n• Enable/disable URL monitoring\n\n*Supported URL formats:*\n• https://example.com\n• http://example.com\n• https://subdomain.example.com/path`,
        nameTooLong: '⚠️ Name too long. Please use less than 50 characters.',
        added: (name, url, interval) => `✅ Added *${name}*\n🔗 ${url}\n\n� ⏱️ Monitoring will start within ${interval / 1000} seconds.`,
        failedToAdd: (error) => `⚠️ Failed to add: ${error}`,
        noURLs: '📭 You have no monitored URLs.\n\nUse /add <name> <url> to start monitoring!',
        monitoredURLs: '📋 *Your monitored URLs:*',
        noStats: '📊 No statistics available yet.\n\nAdd some URLs to monitor first!',
        stats: (stats, uptime, Lilliputian, avgResponse) => `📊 *Your Monitoring Stats*\n\n📈 *Total URLs:* ${stats.total}\n✅ *Online:* ${stats.up}\n❌ *Offline:* ${stats.down}\n📊 *Uptime:* ${uptime}%\n⚡ *Avg Response:* ${avgResponse}\n\nLast updated: ${new Date().toLocaleString()}`,
        noStatus: '📭 No URLs to check.\n\nUse /add <name> <url> to start monitoring!',
        status: '🔍 *Current Status:*',
        deleted: (name) => `✅ Deleted ${name}`,
        failedToDelete: (error) => `❌ Failed to delete: ${error}`,
        languageSet: (lang) => `✅ Language set to ${lang === 'en' ? 'English' : 'Farsi'}`,
        invalidLanguage: '⚠️ Please use /language <en|fa>',
        toggled: (name, active) => `✅ ${name} is now ${active ? 'active' : 'inactive'}`,
        up: (name, url, responseTime) =>
            `✅ *${name}* is back *online!*\n🔗 ${url}\n⚡ Response time: ${responseTime}`,
        down: (name, url, error) =>
            `❌ *${name}* is *down!*\n🔗 ${url}\n⚠️ Error: ${error}`,
    },
    fa: {
        welcome: `👋 به PingMate خوش آمدید!\n\n🔍 *وب‌سایت‌های خود را 24/7 نظارت کنید*\n\n*دستورات موجود:*\n/add <نام> <آدرس> - افزودن وب‌سایت برای نظارت\n/list - نمایش تمام آدرس‌های تحت نظارت\n/stats - مشاهده آمار نظارت\n/status - بررسی وضعیت فعلی تمام آدرس‌ها\n/language <en|fa> - تنظیم زبان\n/help - نمایش این راهنما\n\n*مثال:*\n\`/add Google https://google.com\``,
        help: `🔧 *دستورات PingMate*\n\n/add <نام> <آدرس> - افزودن وب‌سایت برای نظارت\n/list - نمایش آدرس‌های تحت نظارت با دکمه‌های حذف و تغییر وضعیت\n/stats34 - مشاهده آمار نظارت\n/status - بررسی وضعیت فعلی تمام آدرس‌ها\n/language <en|fa> - تنظیم زبان\n/help - نمایش این راهنما\n\n*ویژگی‌ها:*\n• نظارت بر زمان کارکرد در زمان واقعی\n• اعلان‌های فوری هنگام قطع یا وصل شدن سایت‌ها\n• ردیابی زمان پاسخ\n• پشتیبانی از زبان (انگلیسی/فارسی)\n• فعال/غیرفعال کردن نظارت آدرس\n\n*فرمت‌های آدرس پشتیبانی‌شده:*\n• https://example.com\n• http://example.com\n• https://subdomain.example.com/path`,
        nameTooLong: '⚠️ نام بیش از حد طولانی است. لطفاً از کمتر از 50 کار inteCharacter استفاده کنید.',
        added: (name, url, interval) => `✅ *${name}* اضافه شد\n🔗 ${url}\n\n⏱️ نظارت ظرف ${interval / 1000} ثانیه آغاز می‌شود.`,
        failedToAdd: (error) => `⚠️ خطا در افزودن: ${error}`,
        noURLs: '📭 هیچ آدرس تحت نظارتی ندارید.\n\nاز /add <نام> <آدرس> برای شروع نظارت استفاده کنید!',
        monitoredURLs: '📋 *آدرس‌های تحت نظارت شما:*',
        noStats: '📊 هنوز هیچ آماری در دسترس نیست.\n\nابتدا چند آدرس برای نظارت اضافه کنید!',
        stats: (stats, uptime, avgResponse) => `📊 *آمار نظارت شما*\n\n📈 *تعداد کل آدرس‌ها:* ${stats.total}\n✅ *آنلاین:* ${stats.up}\n❌ *آفلاین:* ${stats.down}\n📊 *درصد زمان کارکرد:* ${uptime}%\n⚡ *میانگین زمان پاسخ:* ${avgResponse}\n\nآخرین به‌روزرسانی: ${new Date().toLocaleString()}`,
        noStatus: '📭 هیچ آدرسی برای بررسی وجود ندارد.\n\nاز /add <نام> <آدرس> برای شروع نظارت استفاده کنید!',
        status: '🔍 *وضعیت فعلی:*',
        deleted: (name) => `✅ ${name} حذف شد`,
        failedToDelete: (error) => `❌ خطا در حذف: ${error}`,
        languageSet: (lang) => `✅ زبان به ${lang === 'en' ? 'انگلیسی' : 'فارسی'} تنظیم شد`,
        invalidLanguage: '⚠️ لطفاً از /language <en|fa> استفاده کنید',
        toggled: (name, active) => `✅ ${name} اکنون ${active ? 'فعال' : 'غیرفعال'} است`,
        up: (name, url, responseTime) =>
            `✅ *${name}* دوباره *آنلاین* شد!\n🔗 ${url}\n⚡ زمان پاسخ: ${responseTime}`,
        down: (name, url, error) =>
            `❌ *${name}* *آفلاین* شده است!\n🔗 ${url}\n⚠️ خطا: ${error}`,
    }
};