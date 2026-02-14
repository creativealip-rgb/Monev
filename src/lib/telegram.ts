
export async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn("TELEGRAM_BOT_TOKEN is not set");
        return;
    }

    // Check if chatId is valid
    if (!chatId) {
        console.error("Invalid chatId for Telegram message");
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown' // Enable markdown by default for nice formatting
            })
        });

        const data = await response.json();
        if (!data.ok) {
            console.error("Telegram API Error:", data);
        }
    } catch (error) {
        console.error("Failed to send Telegram message:", error);
    }
}
