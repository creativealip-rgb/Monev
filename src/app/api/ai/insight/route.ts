import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMonthlyStats, getGoals, getBudgets, getTransactions, getPendingScheduledMessages, markScheduledMessageSent } from "@/backend/db/operations";
import OpenAI from "openai";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { getDb } from "@/backend/db";
import { aiInsightsCache } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
});

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours cache

async function getCachedInsight(userId: number, year: number, month: number): Promise<{ insight: string; type: string } | null> {
    try {
        const db = getDb();
        const cached = await db.select()
            .from(aiInsightsCache)
            .where(and(
                eq(aiInsightsCache.userId, userId),
                eq(aiInsightsCache.month, month),
                eq(aiInsightsCache.year, year)
            ))
            .get();

        if (!cached) return null;

        const cacheAge = Date.now() - new Date(cached.updatedAt).getTime();
        if (cacheAge > CACHE_TTL_MS) {
            return null;
        }

        const parsed = JSON.parse(cached.insights);
        return { insight: parsed.insight, type: parsed.type };
    } catch (error) {
        console.error("[getCachedInsight] Error:", error);
        return null;
    }
}

async function setCachedInsight(userId: number, year: number, month: number, insight: string, type: string): Promise<void> {
    try {
        const db = getDb();
        const existing = await db.select()
            .from(aiInsightsCache)
            .where(and(
                eq(aiInsightsCache.userId, userId),
                eq(aiInsightsCache.month, month),
                eq(aiInsightsCache.year, year)
            ))
            .get();

        const insights = JSON.stringify({ insight, type });

        if (existing) {
            await db.update(aiInsightsCache)
                .set({
                    insights,
                    updatedAt: new Date()
                })
                .where(eq(aiInsightsCache.id, existing.id))
                .run();
        } else {
            await db.insert(aiInsightsCache).values({
                userId,
                month,
                year,
                insights,
            }).run();
        }
    } catch (error) {
        console.error("[setCachedInsight] Error:", error);
    }
}

const prompts = {
    id: `Anda adalah penasihat keuangan pribadi yang cerdas dan suportif. 
    Berdasarkan data keuangan user berikut (termasuk perbandingan dengan bulan lalu), berikan 1 insight singkat (max 2 kalimat) untuk hari ini.
    
    Anomaly Detection: Jika pengeluaran bulan ini (expense) sudah mendekati atau melebihi bulan lalu (previousMonthExpense) padahal baru awal/pertengahan bulan, berikan peringatan keras namun sopan.
    
    Insight bisa berupa pujian (jika hemat), peringatan (jika ada anomali belanja), atau tips investasi.
    Gunakan bahasa Indonesia yang santai (panggil Bos/Alip).
    Format JSON: { "insight": "teks insight", "type": "success|warning|info" }`,
    en: `You are a smart and supportive personal finance advisor.
    Based on the user's financial data below (including comparison with last month), provide 1 brief insight (max 2 sentences) for today.
    
    Anomaly Detection: If this month's expenses are approaching or exceeding last month's expenses, but it's only early/mid-month, give a firm but polite warning.
    
    The insight can be praise (if frugal), a warning (if there's a spending anomaly), or an investment tip.
    Use a casual, friendly tone (call them Boss).
    Format JSON: { "insight": "insight text", "type": "success|warning|info" }`
};

export async function GET(req: NextRequest) {
    // Centralized Rate Limiting
    const rateLimitResponse = await applyRateLimit(req, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        // PRIORITY: Check for scheduled stock opname/reconciliation messages
        const scheduledMessages = await getPendingScheduledMessages();
        const userScheduled = scheduledMessages.filter(m => m.userId === userId);

        if (userScheduled.length > 0) {
            const msg = userScheduled[0];
            // Mark as sent so it doesn't reappear
            await markScheduledMessageSent(msg.id);

            return NextResponse.json({
                success: true,
                insight: msg.message,
                type: "warning"
            });
        }

        const searchParams = req.nextUrl.searchParams;
        const forceRefresh = searchParams.get("refresh") === "true";
        const localeParam = searchParams.get("locale");
        const locale = localeParam || ((session.user as { locale?: string }).locale) || "id";

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Check cache unless forced refresh
        if (!forceRefresh) {
            const cached = await getCachedInsight(userId, year, month);
            if (cached) {
                return NextResponse.json({
                    success: true,
                    insight: cached.insight,
                    type: cached.type,
                    generatedAt: new Date().toISOString(),
                    isCached: true
                });
            }
        }

        const currentStats = await getMonthlyStats(userId, year, month);

        // Get previous month stats for anomaly detection
        const prevMonth = new Date(year, now.getMonth() - 1, 1);
        const prevStats = await getMonthlyStats(userId, prevMonth.getFullYear(), prevMonth.getMonth() + 1);

        const goals = await getGoals(userId);
        const budgets = await getBudgets(userId, month, year);
        const recentTransactions = await getTransactions(userId, 5);

        const context = {
            balance: currentStats.balance,
            income: currentStats.income,
            expense: currentStats.expense,
            previousMonthExpense: prevStats.expense,
            goals: goals.map(g => ({ name: g.name, progress: (g.currentAmount / g.targetAmount) * 100 })),
            budgets: budgets.map(b => ({ category: b.category.name, percent: (b.spent / b.amount) * 100 })),
            recent: recentTransactions.map(t => ({ desc: t.description, amount: t.amount, type: t.type }))
        };

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: prompts[locale as keyof typeof prompts] || prompts.id
                },
                {
                    role: "user",
                    content: JSON.stringify(context)
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = JSON.parse(response.choices[0].message.content || "{}");
        const insight = content.insight || "Tetap semangat mengelola keuanganmu hari ini!";
        const type = content.type || "info";

        // Cache the insight
        await setCachedInsight(userId, year, month, insight, type);

        return NextResponse.json({
            success: true,
            insight,
            type,
            generatedAt: new Date().toISOString(),
            isCached: false
        });
    } catch (error) {
        console.error("Insight Error:", error);
        // Try to return last cached insight on error
        try {
            const now = new Date();
            const userId = parseInt((await auth())?.user?.id || "0");
            if (userId > 0) {
                const cached = await getCachedInsight(userId, now.getFullYear(), now.getMonth() + 1);
                if (cached) {
                    return NextResponse.json({
                        success: true,
                        insight: cached.insight,
                        type: cached.type,
                        generatedAt: new Date().toISOString(),
                        isCached: true,
                        isStale: true
                    });
                }
            }
        } catch (fallbackError) {
            console.error("Fallback cache retrieval failed:", fallbackError);
        }
        return NextResponse.json({
            success: false,
            insight: "Tetap semangat mengelola keuanganmu hari ini!",
            type: "info",
            generatedAt: new Date().toISOString(),
            isCached: false
        });
    }
}
