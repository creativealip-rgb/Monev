import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, userSettings, scheduledReports, goals, categories, transactions } from "@/backend/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { getMonthlyStats } from "@/backend/db/operations";
import { generateWealthReport, type ReportData } from "@/lib/report-generator";
import { sendMonthlyReportEmail } from "@/lib/mailer";
import { sendMonthlyReportTelegram } from "@/lib/telegram";

const CRON_SECRET = process.env.CRON_SECRET || "monev-cron-secret";

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        if (process.env.NODE_ENV === "development") {
            console.log("[monthly-report] Development mode - skipping auth");
        } else {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const db = getDb();
        const now = new Date();
        
        const prevMonth = now.getMonth();
        const prevYear = now.getFullYear();
        
        const allUsers = await db.select()
            .from(users)
            .where(eq(users.isActive, true))
            .all();

        const results = [];

        for (const user of allUsers) {
            const settings = await db.select()
                .from(userSettings)
                .where(eq(userSettings.userId, user.id))
                .get();

            if (!settings) continue;

            const emailEnabled = settings.monthlyReportEmail !== false;
            const telegramEnabled = settings.monthlyReportTelegram !== false;
            
            if (!emailEnabled && !telegramEnabled) continue;
            if (!user.email && !user.telegramId) continue;

            let locale: "id" | "en" = "id";
            if (settings.reportLocale === "en") {
                locale = "en";
            } else if (settings.reportLocale === "id") {
                locale = "id";
            }

            try {
                const reportRecord = await db.insert(scheduledReports).values({
                    userId: user.id,
                    reportMonth: prevMonth,
                    reportYear: prevYear,
                    locale,
                    status: "generating",
                }).returning().get();

                const stats = await getMonthlyStats(user.id, prevYear, prevMonth);
                const prevMonthStats = await getMonthlyStats(user.id, prevYear, prevMonth - 1);
                
                const categoryBreakdown = await getCategoryBreakdown(user.id, prevYear, prevMonth);
                const dailySpending = await getDailySpendingData(user.id, prevYear, prevMonth);
                
                const userGoals = await db.select()
                    .from(goals)
                    .where(and(eq(goals.userId, user.id)))
                    .all();

                const totalGoals = userGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

                const reportData: ReportData = {
                    userName: user.firstName || user.name || user.email || "User",
                    month: new Date(prevYear, prevMonth - 1, 1).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { month: "long" }),
                    year: prevYear,
                    stats: {
                        income: stats.income,
                        expense: stats.expense,
                        balance: stats.balance,
                    },
                    previousMonthStats: {
                        income: prevMonthStats?.income || 0,
                        expense: prevMonthStats?.expense || 0,
                    },
                    dailySpending,
                    expenseCategories: categoryBreakdown.expenses.map((c) => ({
                        name: c.category.name,
                        amount: c.total,
                        color: c.category.color,
                    })),
                    goalsWithProgress: userGoals.map(g => ({
                        name: g.name,
                        current: g.currentAmount,
                        target: g.targetAmount,
                        color: g.color,
                    })),
                    allocations: [
                        {
                            name: "Kebutuhan",
                            amount: 0,
                            percentage: 0,
                            target: 50,
                        },
                        {
                            name: "Keinginan",
                            amount: 0,
                            percentage: 0,
                            target: 30,
                        },
                        {
                            name: "Tabungan",
                            amount: totalGoals,
                            percentage: stats.income > 0 ? Math.round((totalGoals / stats.income) * 100) : 0,
                            target: 20,
                        },
                    ],
                    investments: [],
                    aiInsight: "Laporan Anda telah berhasil dibuat. Silakan unduh untuk melihat detail lengkap.",
                    categories: categoryBreakdown.expenses.map(c => ({
                        name: c.category.name,
                        amount: c.total,
                        type: "expense" as const,
                    })),
                };

                const pdfDoc = await generateWealthReport(reportData, locale);
                const pdfBuffer = pdfDoc.output("arraybuffer");
                const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

                let emailSent = false;
                if (emailEnabled && user.email) {
                    try {
                        await sendMonthlyReportEmail(user.email, reportData, pdfBase64);
                        emailSent = true;
                    } catch (emailError) {
                        console.error(`[monthly-report] Failed to send email to ${user.email}:`, emailError);
                    }
                }

                let telegramSent = false;
                if (telegramEnabled && user.telegramId) {
                    try {
                        await sendMonthlyReportTelegram(user.telegramId, reportData);
                        telegramSent = true;
                    } catch (telegramError) {
                        console.error(`[monthly-report] Failed to send Telegram to ${user.telegramId}:`, telegramError);
                    }
                }

                await db.update(scheduledReports)
                    .set({
                        status: "sent",
                        emailSentAt: emailSent ? new Date() : null,
                        telegramSentAt: telegramSent ? new Date() : null,
                        pdfData: emailSent ? null : pdfBase64,
                        updatedAt: new Date(),
                    })
                    .where(eq(scheduledReports.id, reportRecord.id));

                results.push({
                    userId: user.id,
                    email: user.email,
                    emailSent,
                    telegramSent,
                    status: "success",
                });

            } catch (error) {
                console.error(`[monthly-report] Failed for user ${user.id}:`, error);
                
                await db.update(scheduledReports)
                    .set({
                        status: "failed",
                        errorMessage: error instanceof Error ? error.message : "Unknown error",
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(scheduledReports.userId, user.id),
                            eq(scheduledReports.reportMonth, prevMonth),
                            eq(scheduledReports.reportYear, prevYear)
                        )
                    );

                results.push({
                    userId: user.id,
                    email: user.email,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            reportMonth: prevMonth,
            reportYear: prevYear,
            totalUsers: allUsers.length,
            processed: results.length,
            results,
        });

    } catch (error) {
        console.error("[monthly-report] Cron error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Cron job failed" },
            { status: 500 }
        );
    }
}

async function getDailySpendingData(userId: number, year: number, month: number) {
    const db = getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const daysInMonth = endDate.getDate();
    
    const transactionsList = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .all();

    const dailyData: Record<string, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        dailyData[dateKey] = 0;
    }

    transactionsList.forEach(t => {
        if (t.date) {
            const dateKey = new Date(t.date).toISOString().split('T')[0];
            if (dailyData[dateKey] !== undefined) {
                dailyData[dateKey] += t.amount;
            }
        }
    });

    return Object.entries(dailyData).map(([date, amount]) => ({
        date,
        amount,
    }));
}

async function getCategoryBreakdown(userId: number, year: number, month: number) {
    const db = getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const expenses = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .all();

    const categoryTotals: Record<number, number> = {};
    expenses.forEach(t => {
        if (t.categoryId) {
            categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
        }
    });

    const categoryIds = Object.keys(categoryTotals).map(Number);
    if (categoryIds.length === 0) {
        return { expenses: [] };
    }

    const categoryData = await db.select()
        .from(categories)
        .where(inArray(categories.id, categoryIds))
        .all();

    return {
        expenses: categoryData.map(c => ({
            category: c,
            total: categoryTotals[c.id] || 0,
        })),
    };
}

