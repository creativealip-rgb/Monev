

import https from 'https';
import { createLogger } from "./logger";

const logger = createLogger("Telegram");

export async function sendMonthlyReportTelegram(
    chatId: number,
    data: {
        userName: string;
        month: string;
        year: number;
        locale?: "id" | "en";
        stats: {
            income: number;
            expense: number;
            balance: number;
        };
        previousMonthStats?: {
            income: number;
            expense: number;
        };
        expenseCategories?: Array<{ name: string; amount: number }>;
        goalsWithProgress?: Array<{ name: string; current: number; target: number }>;
        aiInsight: string;
    }
) {
    const locale = data.locale || "id";
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const t = {
        id: {
            title: "🌙 *LAPORAN BULANAN*",
            period: "📅 *Periode:*",
            greeting: "Halo",
            income: "💰 *Pemasukan:*",
            expense: "💸 *Pengeluaran:*",
            balance: "📊 *Saldo Bersih:*",
            change: "perubahan",
            up: "naik",
            down: "turun",
            topExpenses: "📈 *Top Pengeluaran:*",
            goalsProgress: "🎯 *Progress Tabungan:*",
            aiInsight: "💡 *Insight:*",
            footer: "Laporan lengkap telah dikirim ke email Anda. 📧",
        },
        en: {
            title: "🌙 *MONTHLY REPORT*",
            period: "📅 *Period:*",
            greeting: "Hi",
            income: "💰 *Income:*",
            expense: "💸 *Expense:*",
            balance: "📊 *Net Balance:*",
            change: "change",
            up: "up",
            down: "down",
            topExpenses: "📈 *Top Expenses:*",
            goalsProgress: "🎯 *Savings Progress:*",
            aiInsight: "💡 *Insight:*",
            footer: "Full report has been sent to your email. 📧",
        },
    };

    const labels = t[locale];
    
    const expenseChangePercent = data.previousMonthStats 
        ? ((data.stats.expense - data.previousMonthStats.expense) / data.previousMonthStats.expense * 100)
        : 0;
    const expenseChangeFormatted = expenseChangePercent.toFixed(1);
    const expenseChangeEmoji = expenseChangePercent > 0 ? "🔴" : "🟢";

    const topExpenses = data.expenseCategories 
        ? [...data.expenseCategories].sort((a, b) => b.amount - a.amount).slice(0, 5)
        : [];
    
    const maxExpense = topExpenses.length > 0 ? topExpenses[0].amount : 1;
    
    const expensesText = topExpenses.map((cat, i) => {
        const percentage = ((cat.amount / maxExpense) * 100).toFixed(0);
        const bars = "█".repeat(Math.floor(parseInt(percentage) / 10));
        const spaces = "░".repeat(10 - Math.floor(parseInt(percentage) / 10));
        return `${i + 1}. ${cat.name}${bars}${spaces} ${formatCurrency(cat.amount)}`;
    }).join("\n");

    const goalsText = data.goalsWithProgress && data.goalsWithProgress.length > 0
        ? data.goalsWithProgress.slice(0, 3).map(goal => {
            const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100);
            const bars = "█".repeat(Math.floor(progress / 10));
            const spaces = "░".repeat(10 - Math.floor(progress / 10));
            return `${goal.name}: ${bars}${spaces} ${progress}%`;
        }).join("\n")
        : "";

    let message = `${labels.title}\n\n`;
    message += `${labels.period} ${data.month} ${data.year}\n\n`;
    message += `${labels.greeting} ${data.userName}! Berikut ringkasan keuangan kamu:\n\n`;
    message += `─────────────────\n\n`;
    
    message += `${labels.income} Rp ${formatCurrency(data.stats.income)}\n`;
    message += `${labels.expense} Rp ${formatCurrency(data.stats.expense)} ${expenseChangeEmoji} ${Math.abs(parseFloat(expenseChangeFormatted))}% ${labels.change}\n`;
    message += `${labels.balance} Rp ${formatCurrency(data.stats.balance)}\n\n`;
    
    message += `─────────────────\n\n`;
    
    if (topExpenses.length > 0) {
        message += `${labels.topExpenses}\n${expensesText}\n\n`;
        message += `─────────────────\n\n`;
    }
    
    if (data.goalsWithProgress && data.goalsWithProgress.length > 0) {
        message += `${labels.goalsProgress}\n${goalsText}\n\n`;
        message += `─────────────────\n\n`;
    }
    
    message += `${labels.aiInsight}\n${data.aiInsight}\n\n`;
    message += `${labels.footer}`;

    await sendTelegramMessage(chatId, message);
}

export async function sendTelegramMessage(chatId: number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        logger.warn("TELEGRAM_BOT_TOKEN is not set");
        return;
    }

    // Check if chatId is valid
    if (!chatId) {
        logger.error("Invalid chatId for Telegram message");
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

    return new Promise<void>((resolve) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseBody);
                    if (!parsedData.ok) {
                        logger.error("Telegram API Error:", parsedData);
                    }
                    resolve();
                } catch (e) {
                    logger.error("Failed to parse Telegram response:", e);
                    resolve(); // Don't crash on parse error
                }
            });
        });

        req.on('error', (e) => {
            logger.error("Failed to send Telegram message:", e);
            resolve(); // Resolve anyway to prevent blocking
        });

        req.write(data);
        req.end();
    });
}

