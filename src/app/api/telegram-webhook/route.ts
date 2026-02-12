import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();

    // 1. Validasi Pesan
    if (!body.message) return NextResponse.json({ ok: true });

    const chatId = body.message.chat.id;
    const text = body.message.text;
    const photo = body.message.photo;

    console.log(`Received message from ${chatId}: ${text || '[Photo]'}`);

    // 2. Logic Router
    try {
        if (photo) {
            // Handle Image (Vision Agent)
            await sendTelegramMessage(chatId, "Received photo! Logic not implemented yet.");
        } else if (text) {
            // Handle Text/Command
            const expenseRegex = /(.+?)\s+(\d+)$/;
            const match = text.trim().match(expenseRegex);

            if (match) {
                const item = match[1].trim();
                const amount = parseInt(match[2]);

                await sendTelegramMessage(chatId, `✅ Catat: ${item} seharga Rp ${amount}`);
            } else if (text.toLowerCase() === 'test') {
                await sendTelegramMessage(chatId, "Halo! Bot is working. Kirim pesan 'Kopi 20000' untuk catat pengeluaran.");
            } else {
                await sendTelegramMessage(chatId, `Saya tidak mengerti. Coba format: 'NamaBarang Harga' (contoh: Bakso 15000)`);
            }
        }
    } catch (error) {
        console.error(error);
        await sendTelegramMessage(chatId, "Waduh, otak saya error sebentar. Coba lagi ya!");
    }

    return NextResponse.json({ ok: true });
}

// Helper: Kirim Pesan Balik ke Telegram
async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error("TELEGRAM_BOT_TOKEN not set");
        return;
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text })
        });
        if (!res.ok) {
            const err = await res.text();
            console.error("Telegram API Error:", err);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}
