import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
    getMonthlyStats,
    getCategoryStats,
    getTransactions,
    getBudgets,
    getGoals,
} from "@/backend/db/operations";
import { getDb } from "@/backend/db";
import { transactions, recurringTransactions, aiAnomaliesCache } from "@/backend/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { checkAIRateLimit, getRateLimitHeaders, incrementAIUsage } from "@/lib/rate-limiter";
import { getUserTier } from "@/lib/tier-gate";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
});

interface Anomaly {
    type: "spending_spike" | "duplicate" | "budget_overrun" | "missing_recurring" | "ratio_warning";
    severity: "low" | "medium" | "high";
    message: string;
    category?: string;
    amount?: number;
    suggestions: string[];
}

const CACHE_TTL_MS = 3 * 60 * 60 * 1000;

async function getCachedAnomalies(
    userId: number,
    year: number,
    month: number
): Promise<{ anomalies: Anomaly[]; summary: string } | null> {
    try {
        const db = getDb();
        const cached = await db
            .select()
            .from(aiAnomaliesCache)
            .where(
                and(
                    eq(aiAnomaliesCache.userId, userId),
                    eq(aiAnomaliesCache.month, month),
                    eq(aiAnomaliesCache.year, year)
                )
            )
            .get();

        if (!cached) return null;

        const cacheAge = Date.now() - new Date(cached.updatedAt).getTime();
        if (cacheAge > CACHE_TTL_MS) return null;

        return {
            anomalies: JSON.parse(cached.anomalies),
            summary: cached.summary,
        };
    } catch (error) {
        console.error("[getCachedAnomalies] Error:", error);
        return null;
    }
}

async function setCachedAnomalies(
    userId: number,
    year: number,
    month: number,
    anomalies: Anomaly[],
    summary: string
): Promise<void> {
    try {
        const db = getDb();
        const existing = await db
            .select()
            .from(aiAnomaliesCache)
            .where(
                and(
                    eq(aiAnomaliesCache.userId, userId),
                    eq(aiAnomaliesCache.month, month),
                    eq(aiAnomaliesCache.year, year)
                )
            )
            .get();

        const anomaliesJson = JSON.stringify(anomalies);

        if (existing) {
            await db
                .update(aiAnomaliesCache)
                .set({
                    anomalies: anomaliesJson,
                    summary,
                    updatedAt: new Date(),
                })
                .where(eq(aiAnomaliesCache.id, existing.id))
                .run();
        } else {
            await db
                .insert(aiAnomaliesCache)
                .values({
                    userId,
                    month,
                    year,
                    anomalies: anomaliesJson,
                    summary,
                })
                .run();
        }
    } catch (error) {
        console.error("[setCachedAnomalies] Error:", error);
    }
}

function detectSpendingSpikes(
    currentBreakdown: Array<{ categoryId: number; categoryName: string; total: number; color: string }>,
    historicalBreakdowns: Array<Array<{ categoryId: number; categoryName: string; total: number }>>
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    const historicalAvgByCat: Record<number, { total: number; count: number }> = {};

    historicalBreakdowns.forEach((breakdown) => {
        breakdown.forEach((item) => {
            if (!historicalAvgByCat[item.categoryId]) {
                historicalAvgByCat[item.categoryId] = { total: 0, count: 0 };
            }
            historicalAvgByCat[item.categoryId].total += item.total;
            historicalAvgByCat[item.categoryId].count += 1;
        });
    });

    currentBreakdown.forEach((current) => {
        const hist = historicalAvgByCat[current.categoryId];
        if (!hist || hist.count === 0) return;

        const average = hist.total / hist.count;
        const ratio = current.total / average;

        if (ratio > 2 && current.total > 50000) {
            const percentage = Math.round((ratio - 1) * 100);
            let severity: "low" | "medium" | "high" = "medium";
            if (ratio > 3) severity = "high";
            if (ratio < 2.5) severity = "low";

            anomalies.push({
                type: "spending_spike",
                severity,
                message: `Pengeluaran di kategori ${current.categoryName} meningkat ${percentage}% dari rata-rata bulan sebelumnya`,
                category: current.categoryName,
                amount: current.total,
                suggestions: [
                    `Tinjau transaksi di kategori ${current.categoryName} untuk memastikan tidak ada pengeluaran yang tidak perlu`,
                    "Pertimbangkan untuk mengurangi pengeluaran di kategori ini bulan depan",
                    "Buat anggaran khusus untuk kategori ini jika pengeluaran tinggi berlanjut",
                ],
            });
        }
    });

    return anomalies;
}

function detectDuplicateTransactions(transactions: Array<{
    id: number;
    description: string;
    merchantName: string | null;
    amount: number;
    date: Date;
    type: string;
}>): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const seen = new Map<string, typeof transactions[number]>();

    transactions.forEach((tx) => {
        const key = `${tx.amount}-${tx.description}-${tx.merchantName || ""}-${tx.date.toISOString().split("T")[0]}`;
        const existing = seen.get(key);

        if (existing) {
            anomalies.push({
                type: "duplicate",
                severity: "medium",
                message: `Transaksi duplikat terdeteksi: ${tx.description} sebesar Rp ${tx.amount.toLocaleString("id-ID")}`,
                amount: tx.amount,
                suggestions: [
                    "Periksa apakah ini benar-benar transaksi terpisah atau kesalahan input",
                    "Hapus salah satu transaksi jika ini adalah duplikat",
                    "Gunakan fitur search sebelum menambahkan transaksi baru",
                ],
            });
        } else {
            seen.set(key, tx);
        }
    });

    return anomalies;
}

function detectBudgetOverruns(
    budgets: Array<{
        category: { name: string };
        amount: number;
        spent: number;
        percentage: number;
    }>
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    budgets.forEach((budget) => {
        if (budget.percentage > 100) {
            const overrunPercent = Math.round(budget.percentage - 100);
            anomalies.push({
                type: "budget_overrun",
                severity: budget.percentage > 120 ? "high" : "medium",
                message: `Anggaran ${budget.category.name} telah terlampaui ${overrunPercent}% (Rp ${budget.spent.toLocaleString("id-ID")} dari Rp ${budget.amount.toLocaleString("id-ID")})`,
                category: budget.category.name,
                amount: budget.spent,
                suggestions: [
                    "Tinjau pengeluaran di kategori ini untuk sisa bulan ini",
                    "Pertimbangkan untuk memindahkan anggaran dari kategori lain jika memungkinkan",
                    "Catat pembelajaran ini untuk perencanaan anggaran bulan depan",
                ],
            });
        } else if (budget.percentage > 85) {
            anomalies.push({
                type: "budget_overrun",
                severity: "low",
                message: `Anggaran ${budget.category.name} hampir habis (${Math.round(budget.percentage)}% digunakan)`,
                category: budget.category.name,
                amount: budget.spent,
                suggestions: [
                    `Sisa anggaran ${budget.category.name}: Rp ${(budget.amount - budget.spent).toLocaleString("id-ID")}`,
                    "Kurangi pengeluaran di kategori ini untuk menghindari overrun",
                    "Monitor pengeluaran harian dengan lebih ketat",
                ],
            });
        }
    });

    return anomalies;
}

async function detectMissingRecurring(
    userId: number,
    year: number,
    month: number
): Promise<Anomaly[]> {
    const db = getDb();
    const anomalies: Anomaly[] = [];

    const recurring = await db
        .select()
        .from(recurringTransactions)
        .where(
            and(
                eq(recurringTransactions.userId, userId),
                eq(recurringTransactions.isActive, true)
            )
        )
        .all();

    if (recurring.length === 0) return anomalies;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const monthlyTransactions = await db
        .select({
            description: transactions.description,
            amount: transactions.amount,
            date: transactions.date,
        })
        .from(transactions)
        .where(
            and(
                eq(transactions.userId, userId),
                eq(transactions.type, "expense"),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
            )
        )
        .all();

    recurring.forEach((recurringTx) => {
        const expectedDate = new Date(recurringTx.nextRunAt);
        const isCurrentMonth =
            expectedDate.getMonth() === month - 1 && expectedDate.getFullYear() === year;

        if (!isCurrentMonth) return;

        const found = monthlyTransactions.some(
            (tx) =>
                tx.description.toLowerCase().includes(recurringTx.description.toLowerCase()) &&
                Math.abs(tx.amount - recurringTx.amount) < 1000
        );

        if (!found) {
            anomalies.push({
                type: "missing_recurring",
                severity: "medium",
                message: `Transaksi berulang "${recurringTx.description}" sebesar Rp ${recurringTx.amount.toLocaleString("id-ID")} belum tercatat bulan ini`,
                amount: recurringTx.amount,
                suggestions: [
                    "Catat transaksi ini jika sudah dibayar",
                    "Periksa apakah pembayaran otomatis telah diproses",
                    "Update tanggal next run jika transaksi telah dicatat",
                ],
            });
        }
    });

    return anomalies;
}

function detectIncomeExpenseRatio(
    income: number,
    expense: number
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (income === 0 && expense > 0) {
        anomalies.push({
            type: "ratio_warning",
            severity: "high",
            message: "Pengeluaran tanpa pemasukan terdeteksi bulan ini",
            amount: expense,
            suggestions: [
                "Pastikan sumber pemasukan Anda tercatat dengan benar",
                "Periksa apakah ada pemasukan yang belum dicatat",
                "Monitor cash flow dengan lebih ketat",
            ],
        });
    } else if (income > 0) {
        const ratio = expense / income;
        if (ratio > 1) {
            const deficit = expense - income;
            anomalies.push({
                type: "ratio_warning",
                severity: "high",
                message: `Defisit keuangan: Pengeluaran melebihi pemasukan sebesar Rp ${deficit.toLocaleString("id-ID")}`,
                amount: deficit,
                suggestions: [
                    "Tinjau ulang pengeluaran dan identifikasi yang bisa dikurangi",
                    "Pertimbangkan untuk menambah sumber pemasukan",
                    "Gunakan dana darurat hanya untuk kebutuhan mendesak",
                ],
            });
        } else if (ratio > 0.9) {
            anomalies.push({
                type: "ratio_warning",
                severity: "medium",
                message: `Rasio pengeluaran sangat tinggi (${Math.round(ratio * 100)}% dari pemasukan)`,
                suggestions: [
                    "Usahakan rasio pengeluaran di bawah 80% dari pemasukan",
                    "Alokasikan minimal 20% untuk tabungan dan investasi",
                    "Review kebutuhan vs keinginan dalam pengeluaran Anda",
                ],
            });
        }
    }

    return anomalies;
}

export async function GET(req: NextRequest) {
    const rateLimitResponse = await applyRateLimit(req, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const userTier = getUserTier(session?.user);

        const aiRateLimit = checkAIRateLimit(userId, userTier);
        if (!aiRateLimit.allowed) {
            return NextResponse.json(
                {
                    error: "AI limit exceeded",
                    message: `You have reached your daily AI limit (${aiRateLimit.limit} requests).`,
                    used: aiRateLimit.used,
                    limit: aiRateLimit.limit,
                },
                {
                    status: 429,
                    headers: getRateLimitHeaders(aiRateLimit),
                }
            );
        }

        const searchParams = req.nextUrl.searchParams;
        const forceRefresh = searchParams.get("refresh") === "true";
        const localeParam = searchParams.get("locale");
        const locale = localeParam || ((session.user as { locale?: string }).locale) || "id";

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        if (!forceRefresh) {
            const cached = await getCachedAnomalies(userId, year, month);
            if (cached) {
                incrementAIUsage(userId);
                return NextResponse.json({
                    success: true,
                    anomalies: cached.anomalies,
                    summary: cached.summary,
                    analyzedAt: new Date().toISOString(),
                    isCached: true,
                });
            }
        }

        const currentStats = await getMonthlyStats(userId, year, month);

        const prevMonth = new Date(year, now.getMonth() - 1, 1);
        const prevStats = await getMonthlyStats(
            userId,
            prevMonth.getFullYear(),
            prevMonth.getMonth() + 1
        );

        const currentBreakdown = await getCategoryStats(userId, year, month);

        const historicalBreakdowns = [];
        for (let i = 1; i <= 3; i++) {
            const date = new Date(year, month - 1 - i, 1);
            const breakdown = await getCategoryStats(
                userId,
                date.getFullYear(),
                date.getMonth() + 1
            );
            historicalBreakdowns.push(breakdown);
        }

        const budgets = await getBudgets(userId, month, year);
        const recentTransactions = await getTransactions(userId, 50);
        const goals = await getGoals(userId);

        const allAnomalies: Anomaly[] = [
            ...detectSpendingSpikes(currentBreakdown, historicalBreakdowns),
            ...detectDuplicateTransactions(
                recentTransactions.map((t) => ({
                    id: t.id,
                    description: t.description,
                    merchantName: t.merchantName,
                    amount: t.amount,
                    date: t.date,
                    type: t.type,
                }))
            ),
            ...detectBudgetOverruns(budgets),
            ...(await detectMissingRecurring(userId, year, month)),
            ...detectIncomeExpenseRatio(currentStats.income, currentStats.expense),
        ];

        const sortedAnomalies = allAnomalies.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a financial anomaly detection expert. Analyze the transaction data and identify potential issues or unusual patterns. Respond in ${locale === "id" ? "Bahasa Indonesia" : "English"}.`,
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        monthlyStats: {
                            income: currentStats.income,
                            expense: currentStats.expense,
                            balance: currentStats.balance,
                            previousMonthIncome: prevStats.income,
                            previousMonthExpense: prevStats.expense,
                        },
                        categoryBreakdown: currentBreakdown,
                        recentTransactions: recentTransactions.slice(0, 10).map((t) => ({
                            description: t.description,
                            amount: t.amount,
                            type: t.type,
                            date: t.date.toISOString(),
                        })),
                        budgets: budgets.map((b) => ({
                            category: b.category.name,
                            amount: b.amount,
                            spent: b.spent,
                            percentage: b.percentage,
                        })),
                        goals: goals.map((g) => ({
                            name: g.name,
                            progress: (g.currentAmount / g.targetAmount) * 100,
                        })),
                        detectedAnomalies: sortedAnomalies,
                    }),
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = JSON.parse(response.choices[0].message.content || "{}");
        const summary =
            content.summary ||
            (locale === "id"
                ? "Analisis keuangan Anda telah selesai. Terdapat beberapa hal yang perlu diperhatikan."
                : "Financial analysis complete. There are several items that need attention.");

        const aiAnomalies: Anomaly[] = content.anomalies || sortedAnomalies;

        await setCachedAnomalies(userId, year, month, aiAnomalies, summary);

        incrementAIUsage(userId);

        return NextResponse.json({
            success: true,
            anomalies: aiAnomalies,
            summary,
            analyzedAt: new Date().toISOString(),
            isCached: false,
        });
    } catch (error) {
        console.error("Anomaly Analysis Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to analyze anomalies",
                anomalies: [],
                summary: "Gagal menganalisis data keuangan",
                analyzedAt: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
