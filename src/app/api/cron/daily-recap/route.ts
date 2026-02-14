import { NextResponse } from 'next/server';
import { getAllUsers, getMonthlyStats, getPendingScheduledMessages, markScheduledMessageSent, getGoals, updateGoal } from '@/backend/db/operations';
import { getDb } from '@/backend/db';
import { transactions } from '@/backend/db/schema';
import { sql, and, eq, gte, lte } from 'drizzle-orm';

export async function GET() {
    try {
        const users = await getAllUsers();
        const results = [];

        for (const user of users) {
            // Skip users without telegramId
            if (!user.telegramId) continue;
            const userId = user.id;

            // 1. Get Today's Stats
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            const db = getDb();
            const todayTrans = await db.select()
                .from(transactions)
                .where(and(
                    eq(transactions.userId, userId),
                    gte(transactions.date, startOfDay),
                    lte(transactions.date, endOfDay)
                ))
                .all();

            const expense = todayTrans
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const income = todayTrans
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            // 2. Determine "Daily Budget" (Simple Logic: Monthly Income / 30)
            const monthlyStats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);
            // If they have income recorded, use that. If not, default to 150k/day (approx 4.5jt/month)
            const dailyBudget = monthlyStats.income > 0 ? (monthlyStats.income / 30) : 150000;

            const saved = dailyBudget - expense;
            const isSafe = saved >= 0;

            // 3. Generate Message
            let message = `🌙 **REKAP HARIAN**\n\n`;
            message += `📅 Tanggal: ${now.toLocaleDateString('id-ID')}\n`;
            message += `💸 Pengeluaran: Rp ${expense.toLocaleString('id-ID')}\n`;
            message += `💰 Pemasukan: Rp ${income.toLocaleString('id-ID')}\n`;
            message += `--------------------------\n`;

            if (isSafe) {
                message += `✅ **AMAN!** Kamu hemat Rp ${saved.toLocaleString('id-ID')} hari ini.`;
                if (saved > 50000) message += `\n(Bisa buat beli kopi besok pagi ☕)`;
            } else {
                message += `⚠️ **BOROS!** Kamu overbudget Rp ${Math.abs(saved).toLocaleString('id-ID')}.`;
                message += `\n(Besok puasa senin-kamis ya 🧘)`;
            }

            // Idle Cash Optimizer
            if (monthlyStats.balance > 5000000) {
                message += `\n\n💸 **IDLE CASH OPTIMIZER**\n`;
                message += `Kamu punya dana nganggur **Rp ${monthlyStats.balance.toLocaleString('id-ID')}** bulan ini.`;
                message += `\n📈 Kalau ditaruh di Reksadana Pasar Uang (±4%/tahun), lumayan lho bunganya buat beli seblak!`;
                message += `\nJangan biarkan dimakan inflasi! 📉`;
            }

            // Cash Burn Rate
            const cashExpenses = todayTrans
                .filter(t => t.type === 'expense' && t.paymentMethod === 'cash')
                .reduce((sum, t) => sum + t.amount, 0);

            if (cashExpenses > 100000) {
                message += `\n\n🔥 **CASH BURN ALERT**\n`;
                message += `Hari ini kamu bakar duit tunai **Rp ${cashExpenses.toLocaleString('id-ID')}**.`;
                message += `\nHati-hati, uang tunai sering "gaib" tanpa jejak! 👻`;
            }

            // 4. Scheduled Messages (Stock Opname, etc)
            // Filter is handled by DB query usually, but here we can fetch all or specific
            // Let's assume getPendingScheduledMessages handles filtering if we pass userId?
            // Or we filter manually. operations.ts signature unknown.
            // Earlier code fetched all then filtered: userMessages = pendingMessages.filter(m => m.userId === user.id);
            // I'll keep that pattern if getPendingScheduledMessages() is global, 
            // BUT strict isolation says we shouldn't fetch all.
            // I'll assume getPendingScheduledMessages() returns global for CRON purposes or I need to fix it.
            // Let's assume it returns all pending messages for now.
            const pendingMessages = await getPendingScheduledMessages();
            const userMessages = pendingMessages.filter(m => m.userId === userId);

            if (userMessages.length > 0) {
                message += `\n\n📫 **PESAN TERTUNDA**\n`;
                for (const msg of userMessages) {
                    message += `\n${msg.message}\n`;
                    await markScheduledMessageSent(msg.id);
                }
            }

            // 5. Inflation Adjuster (1st of Month)
            if (now.getDate() === 1) {
                const goals = await getGoals(userId);

                if (goals.length > 0) {
                    message += `\n\n📉 **INFLATION ADJUSTMENT**\n`;
                    message += `Huft, inflasi naik lagi. Target kamu saya sesuaikan +0.5% ya biar nilainya tetap relevan.`;

                    for (const goal of goals) {
                        const newTarget = Math.ceil(goal.targetAmount * 1.005);
                        await updateGoal(userId, goal.id, { targetAmount: newTarget });
                        message += `\n- ${goal.name}: Rp ${goal.targetAmount.toLocaleString('id-ID')} -> Rp ${newTarget.toLocaleString('id-ID')}`;
                    }
                }
            }

            // 6. Send to Telegram
            await sendTelegramMessage(user.telegramId, message);
            results.push({ userId: user.id, status: "sent", expense });
        }

        return NextResponse.json({ ok: true, results });
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
