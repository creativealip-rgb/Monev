

import https from 'https';

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

    const data = JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        },
        family: 4 // Force IPv4 to avoid VPS timeout/network unreachable errors
    };

    return new Promise<void>((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseBody);
                    if (!parsedData.ok) {
                        console.error("Telegram API Error:", parsedData);
                    }
                    resolve();
                } catch (e) {
                    console.error("Failed to parse Telegram response:", e);
                    resolve(); // Don't crash on parse error
                }
            });
        });

        req.on('error', (e) => {
            console.error("Failed to send Telegram message:", e);
            resolve(); // Resolve anyway to prevent blocking
        });

        req.write(data);
        req.end();
    });
}

