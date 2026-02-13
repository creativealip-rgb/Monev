import { NextResponse } from 'next/server';
import { getAllUsers, analyzeSubscriptions } from '@/backend/db/operations';

export async function GET() {
    try {
        const users = await getAllUsers();
        const subs = await analyzeSubscriptions(3); // Look back 3 months

        if (subs.length === 0) {
            return NextResponse.json({ ok: true, message: "No subscriptions found" });
        }

        const totalPotential = subs.reduce((sum, s) => sum + s.amount, 0);

        let message = `🕵️ **SUBSCRIPTION HUNTER**\n\n`;
        message += `Saya menemukan **${subs.length}** potensi tagihan berulang/langganan yang mungkin bisa dievaluasi:\n\n`;

        subs.forEach(s => {
            message += `🔹 **${s.merchant}**\n`;
            message += `   Rp ${s.amount.toLocaleString('id-ID')} (x${s.frequency} kali)\n`;
            message += `   📅 Terakhir: ${new Date(s.lastDate).toLocaleDateString('id-ID')}\n`;
        });

        message += `\n💰 Total beban bulanan: **Rp ${totalPotential.toLocaleString('id-ID')}**\n`;
        message += `Masih rajin pake semua ini? Kalau jarang, mending unsubs aja lumayan buat tabungan! 🛑`;

        for (const user of users) {
            await sendTelegramMessage(user.telegramId, message);
        }

        return NextResponse.json({ ok: true, found: subs.length });
    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}

async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
    });
}
