/**
 * Telegram Bot Setup Script
 * 
 * Usage: 
 * 1. Create a bot with @BotFather on Telegram
 * 2. Get your bot token
 * 3. Set TELEGRAM_BOT_TOKEN in .env
 * 4. Run: npx tsx scripts/setup-telegram-bot.ts
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram-webhook`
    : null;

async function setupWebhook() {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error("❌ Error: TELEGRAM_BOT_TOKEN not set in environment");
        console.log("\nPlease set your bot token:");
        console.log("export TELEGRAM_BOT_TOKEN=your_bot_token_here");
        process.exit(1);
    }

    if (!WEBHOOK_URL) {
        console.error("❌ Error: NEXT_PUBLIC_APP_URL not set in environment");
        console.log("\nPlease set your app URL:");
        console.log("export NEXT_PUBLIC_APP_URL=https://your-domain.com");
        process.exit(1);
    }

    console.log("🔧 Setting up Telegram Bot Webhook...\n");
    console.log(`Bot Token: ${TELEGRAM_BOT_TOKEN.slice(0, 10)}...`);
    console.log(`Webhook URL: ${WEBHOOK_URL}\n`);

    try {
        // Get current webhook info
        const infoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
        const info = await infoResponse.json();
        
        console.log("📊 Current Webhook Info:");
        console.log(JSON.stringify(info.result, null, 2));
        console.log("");

        // Set new webhook
        const setResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: WEBHOOK_URL,
                allowed_updates: ["message", "callback_query", "edited_message"],
            }),
        });

        const setResult = await setResponse.json();

        if (setResult.ok) {
            console.log("✅ Webhook set successfully!");
            console.log("\n🤖 Your bot is now ready!");
            console.log("\n📱 Try these commands in Telegram:");
            console.log("  /start - Start the bot");
            console.log("  /help - Show help");
            console.log("  /record - Record transaction");
            console.log("  /balance - Check balance");
            console.log("  /recent - Recent transactions");
            console.log("  /summary - Monthly summary");
            console.log("\n💡 Quick tip: Just type '50000 makan siang' to record!");
        } else {
            console.error("❌ Failed to set webhook:", setResult.description);
        }
    } catch (error) {
        console.error("❌ Error setting up webhook:", error);
    }
}

async function removeWebhook() {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error("❌ Error: TELEGRAM_BOT_TOKEN not set");
        process.exit(1);
    }

    console.log("🗑️ Removing webhook...\n");

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
        const result = await response.json();

        if (result.ok) {
            console.log("✅ Webhook removed successfully!");
        } else {
            console.error("❌ Failed to remove webhook:", result.description);
        }
    } catch (error) {
        console.error("❌ Error removing webhook:", error);
    }
}

// Check command line arguments
const command = process.argv[2];

if (command === "remove") {
    removeWebhook();
} else {
    setupWebhook();
}