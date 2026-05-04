import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, userSettings, transactions, categories } from "@/backend/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendPushToUser } from "@/lib/send-push";

const CRON_SECRET = process.env.CRON_SECRET || "monev-cron-secret";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        if (process.env.NODE_ENV === "development") {
            console.log("[weekly-insight] Development mode - skipping auth");
        } else {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const db = getDb();
        const now = new Date();
        
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - daysUntilMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const usersWithSettings = await db.select({
            user: users,
            settings: userSettings,
        })
        .from(users)
        .leftJoin(userSettings, eq(userSettings.userId, users.id))
        .where(and(
            eq(users.isActive, true),
            eq(userSettings.weeklyInsightTelegram, true),
            eq(userSettings.telegramEnabled, true)
        ))
        .all();

        const results = [];

        for (const { user, settings } of usersWithSettings) {
            if (!user.telegramId) continue;

            try {
                const weeklyTransactions = await db.select()
                    .from(transactions)
                    .where(and(
                        eq(transactions.userId, user.id),
                        eq(transactions.type, "expense"),
                        gte(transactions.date, startOfWeek),
                        lte(transactions.date, endOfWeek)
                    ))
                    .all();

                const totalExpense = weeklyTransactions.reduce((sum, t) => sum + t.amount, 0);
                const transactionCount = weeklyTransactions.length;
                
                const categoryBreakdown: Record<number, number> = {};
                weeklyTransactions.forEach(t => {
                    if (t.categoryId) {
                        categoryBreakdown[t.categoryId] = (categoryBreakdown[t.categoryId] || 0) + t.amount;
                    }
                });

                const topCategoryId = Object.entries(categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)[0]?.[0];

                let topCategoryName = "Umum";
                if (topCategoryId) {
                    const topCategory = await db.select()
                        .from(categories)
                        .where(eq(categories.id, parseInt(topCategoryId)))
                        .get();
                    topCategoryName = topCategory?.name || "Umum";
                }

                const prevWeekStart = new Date(startOfWeek);
                prevWeekStart.setDate(prevWeekStart.getDate() - 7);
                const prevWeekEnd = new Date(endOfWeek);
                prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

                const prevWeekTransactions = await db.select()
                    .from(transactions)
                    .where(and(
                        eq(transactions.userId, user.id),
                        eq(transactions.type, "expense"),
                        gte(transactions.date, prevWeekStart),
                        lte(transactions.date, prevWeekEnd)
                    ))
                    .all();

                const prevWeekExpense = prevWeekTransactions.reduce((sum, t) => sum + t.amount, 0);
                const changePercent = prevWeekExpense > 0 
                    ? ((totalExpense - prevWeekExpense) / prevWeekExpense * 100).toFixed(1)
                    : "0";

                const locale = settings?.reportLocale === "en" ? "en" : "id";
                const insight = generateWeeklyInsight({
                    totalExpense,
                    transactionCount,
                    topCategoryName,
                    changePercent: parseFloat(changePercent),
                    locale,
                });

                const message = formatWeeklyInsight({
                    userName: user.firstName || user.name || "User",
                    startDate: startOfWeek,
                    endDate: endOfWeek,
                    totalExpense,
                    transactionCount,
                    topCategoryName,
                    changePercent: parseFloat(changePercent),
                    insight,
                    locale,
                });

                await sendTelegramMessage(user.telegramId, message);

                // Send push notification (privacy-safe, no financial data)
                try {
                    await sendPushToUser(user.id, {
                        title: "Ringkasan Monev",
                        body: "Ringkasan mingguan kamu sudah siap.",
                        url: "/analytics",
                        tag: "weekly-insight",
                    }, "weekly_summary");
                } catch (pushError) {
                    console.error(`[weekly-insight] Push failed for user ${user.id}:`, pushError);
                }

                results.push({
                    userId: user.id,
                    telegramId: user.telegramId,
                    status: "sent",
                    expense: totalExpense,
                });

            } catch (error) {
                console.error(`[weekly-insight] Failed for user ${user.id}:`, error);
                results.push({
                    userId: user.id,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            weekStart: startOfWeek.toISOString(),
            weekEnd: endOfWeek.toISOString(),
            totalUsers: usersWithSettings.length,
            processed: results.length,
            results,
        });

    } catch (error) {
        console.error("[weekly-insight] Cron job error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Cron job failed" },
            { status: 500 }
        );
    }
}

function generateWeeklyInsight(data: {
    totalExpense: number;
    transactionCount: number;
    topCategoryName: string;
    changePercent: number;
    locale: "id" | "en";
}): string {
    const { totalExpense, transactionCount, topCategoryName, changePercent, locale } = data;
    
    const insights = {
        id: [
            {
                condition: changePercent < -20,
                text: `Hebat! Pengeluaranmu turun ${Math.abs(changePercent)}% dari minggu lalu. Pertahankan! 💪`,
            },
            {
                condition: changePercent > 20,
                text: `Waduh, pengeluaran naik ${changePercent}% dari minggu lalu. Lebih hemat lagi ya! 🧘`,
            },
            {
                condition: transactionCount > 15,
                text: `Kamu cukup aktif belanja minggu ini (${transactionCount} transaksi). Coba review apakah semua perlu? 🤔`,
            },
            {
                condition: totalExpense > 5000000,
                text: `Pengeluaran minggumu cukup besar. Apakah ada kebutuhan khusus minggu ini? 💭`,
            },
            {
                condition: topCategoryName === "Makanan & Minuman" || topCategoryName === "Makan",
                text: `Pengeluaran terbesar di ${topCategoryName}. Coba masak di rumah lebih sering untuk hemat! 🍳`,
            },
            {
                default: true,
                text: `Pengeluaranmu stabil minggu ini. Bagus! Terus pantau agar tetap sesuai budget. 👍`,
            },
        ],
        en: [
            {
                condition: changePercent < -20,
                text: `Great! Your expenses decreased by ${Math.abs(changePercent)}% from last week. Keep it up! 💪`,
            },
            {
                condition: changePercent > 20,
                text: `Oops, expenses increased by ${changePercent}% from last week. Try to be more frugal! 🧘`,
            },
            {
                condition: transactionCount > 15,
                text: `You've been quite active this week (${transactionCount} transactions). Review if all were necessary? 🤔`,
            },
            {
                condition: totalExpense > 5000000,
                text: `Your weekly expenses are quite high. Any special needs this week? 💭`,
            },
            {
                condition: topCategoryName.includes("Food") || topCategoryName.includes("Makan"),
                text: `Biggest expense is ${topCategoryName}. Try cooking at home more often to save! 🍳`,
            },
            {
                default: true,
                text: `Your expenses are stable this week. Good! Keep monitoring to stay within budget. 👍`,
            },
        ],
    };

    const selectedInsight = insights[locale].find(i => {
        if (i.default) return true;
        return i.condition;
    });

    return selectedInsight?.text || "";
}

function formatWeeklyInsight(data: {
    userName: string;
    startDate: Date;
    endDate: Date;
    totalExpense: number;
    transactionCount: number;
    topCategoryName: string;
    changePercent: number;
    insight: string;
    locale: "id" | "en";
}): string {
    const { userName, startDate, endDate, totalExpense, transactionCount, topCategoryName, changePercent, insight, locale } = data;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const t = {
        id: {
            title: "📊 *INSIGHT MINGGUAN*",
            period: "📅 *Periode:*",
            greeting: "Halo",
            expense: "💸 *Total Pengeluaran:*",
            transactions: "📝 *Jumlah Transaksi:*",
            topCategory: "🏆 *Kategori Terbesar:*",
            change: "📈 *Perubahan:*",
            insight: "💡 *Insight:*",
            footer: "Semangat mengatur keuangan! 🚀",
            up: "naik",
            down: "turun",
        },
        en: {
            title: "📊 *WEEKLY INSIGHT*",
            period: "📅 *Period:*",
            greeting: "Hi",
            expense: "💸 *Total Expense:*",
            transactions: "📝 *Transaction Count:*",
            topCategory: "🏆 *Top Category:*",
            change: "📈 *Change:*",
            insight: "💡 *Insight:*",
            footer: "Keep managing your finances! 🚀",
            up: "up",
            down: "down",
        },
    };

    const labels = t[locale];
    const changeDirection = changePercent > 0 ? labels.up : labels.down;
    const changeEmoji = changePercent > 0 ? "🔴" : "🟢";

    const periodStr = `${startDate.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { day: 'numeric', month: 'short', year: 'numeric' })}`;

    let message = `${labels.title}\n\n`;
    message += `${labels.greeting} ${userName}!\n\n`;
    message += `${labels.period} ${periodStr}\n\n`;
    message += `─────────────────\n\n`;
    message += `${labels.expense} Rp ${formatCurrency(totalExpense)}\n`;
    message += `${labels.transactions} ${transactionCount}\n`;
    message += `${labels.topCategory} ${topCategoryName}\n`;
    message += `${labels.change} ${changeEmoji} ${Math.abs(changePercent)}% ${changeDirection}\n\n`;
    message += `─────────────────\n\n`;
    message += `${labels.insight}\n${insight}\n\n`;
    message += `${labels.footer}`;

    return message;
}
