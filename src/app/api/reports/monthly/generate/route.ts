import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users, userSettings, scheduledReports, goals, accounts, categories, transactions } from "@/backend/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { generateWealthReport } from "@/lib/report-generator";
import { sendMonthlyReportEmail } from "@/lib/mailer";
import { sendMonthlyReportTelegram } from "@/lib/telegram";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { month, year, sendEmail = true, sendTelegram = true } = body;

        if (!month || !year) {
            return NextResponse.json(
                { error: "Month and year are required" },
                { status: 400 }
            );
        }

        if (month < 1 || month > 12) {
            return NextResponse.json(
                { error: "Month must be between 1 and 12" },
                { status: 400 }
            );
        }

        const db = getDb();

        const settings = await db.select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .get();

        const user = await db.select()
            .from(users)
            .where(eq(users.id, userId))
            .get();

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const emailEnabled = sendEmail && settings?.monthlyReportEmail !== false && user.email;
        const telegramEnabled = sendTelegram && settings?.monthlyReportTelegram !== false && user.telegramId;

        let locale: "id" | "en" = "id";
        if (settings?.reportLocale === "en") {
            locale = "en";
        } else if (settings?.reportLocale === "id") {
            locale = "id";
        }

        const reportRecord = await db.insert(scheduledReports).values({
            userId,
            reportMonth: month,
            reportYear: year,
            locale,
            status: "generating",
        }).returning().get();

        const { getMonthlyStats } = await import("@/backend/db/operations");
        const stats = await getMonthlyStats(userId, year, month);
        
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthStats = await getMonthlyStats(userId, prevYear, prevMonth);

        const dailySpending = await getDailySpendingData(userId, year, month);

        const categoryBreakdown = await getCategoryBreakdown(userId, year, month);

        const userGoals = await db.select()
            .from(goals)
            .where(and(eq(goals.userId, userId)))
            .all();

        const userAccounts = await db.select()
            .from(accounts)
            .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)))
            .all();

        const reportData = {
            userName: user.firstName || user.name || user.email || "User",
            month: new Date(year, month - 1, 1).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", { month: "long" }),
            year,
            locale,
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
            expenseCategories: categoryBreakdown.expenses.map((c: any) => ({
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
            allocations: [],
            investments: [],
            aiInsight: "Laporan Anda telah berhasil dibuat. Silakan unduh untuk melihat detail lengkap.",
        };

        const pdfDoc = await generateWealthReport(reportData);
        const pdfBuffer = pdfDoc.output("arraybuffer");
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

        let emailSent = false;
        if (emailEnabled) {
            try {
                await sendMonthlyReportEmail(user.email!, reportData, pdfBase64);
                emailSent = true;
            } catch (emailError) {
                console.error("Failed to send email:", emailError);
            }
        }

        let telegramSent = false;
        if (telegramEnabled) {
            try {
                await sendMonthlyReportTelegram(user.telegramId!, reportData);
                telegramSent = true;
            } catch (telegramError) {
                console.error("Failed to send Telegram:", telegramError);
            }
        }

        await db.update(scheduledReports)
            .set({
                status: "sent",
                emailSentAt: emailSent ? new Date() : null,
                telegramSentAt: telegramSent ? new Date() : null,
                pdfData: pdfBase64,
                updatedAt: new Date(),
            })
            .where(eq(scheduledReports.id, reportRecord.id));

        return NextResponse.json({
            success: true,
            reportId: reportRecord.id,
            downloadUrl: `/api/reports/monthly/${reportRecord.id}/download`,
            emailSent,
            telegramSent,
            message: `Report for ${reportData.month} ${year} generated successfully`,
        });

    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Failed to generate report" },
            { status: 500 }
        );
    }
}

async function getDailySpendingData(userId: number, year: number, month: number) {
    const db = getDb();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const txns = await db.select()
        .from(transactions)
        .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, "expense"),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
        ))
        .all();

    const dailyData: Record<string, number> = {};
    for (let d = 1; d <= endDate.getDate(); d++) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        dailyData[dateKey] = 0;
    }

    txns.forEach(t => {
        const dateKey = new Date(t.date!).toISOString().split('T')[0];
        if (dailyData[dateKey] !== undefined) {
            dailyData[dateKey] += t.amount;
        }
    });

    return Object.entries(dailyData).map(([date, amount]) => ({ date, amount }));
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

    const categoryData = await db.select()
        .from(categories)
        .where(eq(categories.id, Object.keys(categoryTotals).map(Number)))
        .all();

    return {
        expenses: categoryData.map(c => ({
            category: c,
            total: categoryTotals[c.id] || 0,
        })),
    };
}
