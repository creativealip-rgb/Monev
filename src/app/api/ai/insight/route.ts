import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMonthlyStats, getGoals, getBudgets, getTransactions, getPendingScheduledMessages, markScheduledMessageSent } from "@/backend/db/operations";
import OpenAI from "openai";
import { rateLimit } from "@/lib/rate-limit";
import { UserTier } from "@/lib/tier-gate";
import { applyRateLimit } from "@/lib/api-rate-limit";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
});

export async function GET(req: NextRequest) {
    // Centralized Rate Limiting
    const rateLimitResponse = await applyRateLimit(req, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);
        // @ts-ignore
        const userTier = (session.user.tier as UserTier) || "miskin";

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
                type: "warning" // Reconciliation is usually a warning/action item
            });
        }

        const now = new Date();
        const currentStats = await getMonthlyStats(userId, now.getFullYear(), now.getMonth() + 1);

        // Get previous month stats for anomaly detection
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevStats = await getMonthlyStats(userId, prevMonth.getFullYear(), prevMonth.getMonth() + 1);

        const goals = await getGoals(userId);
        const budgets = await getBudgets(userId, now.getMonth() + 1, now.getFullYear());
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
                    content: `Anda adalah penasihat keuangan pribadi yang cerdas dan suportif. 
                    Berdasarkan data keuangan user berikut (termasuk perbandingan dengan bulan lalu), berikan 1 insight singkat (max 2 kalimat) untuk hari ini.
                    
                    Anomaly Detection: Jika pengeluaran bulan ini (expense) sudah mendekati atau melebihi bulan lalu (previousMonthExpense) padahal baru awal/pertengahan bulan, berikan peringatan keras namun sopan.
                    
                    Insight bisa berupa pujian (jika hemat), peringatan (jika ada anomali belanja), atau tips investasi.
                    Gunakan bahasa Indonesia yang santai (panggil Bos/Alip).
                    Format JSON: { "insight": "teks insight", "type": "success|warning|info" }`
                },
                {
                    role: "user",
                    content: JSON.stringify(context)
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = JSON.parse(response.choices[0].message.content || "{}");
        return NextResponse.json({ success: true, ...content });
    } catch (error) {
        console.error("Insight Error:", error);
        return NextResponse.json({ success: false, insight: "Tetap semangat mengelola keuanganmu hari ini!", type: "info" });
    }
}
