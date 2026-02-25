import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategoryStats } from "@/backend/db/operations";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // 1. Get current month breakdown
        const currentBreakdown = await getCategoryStats(userId, currentYear, currentMonth);
        if (currentBreakdown.length === 0) {
            return NextResponse.json({ anomalies: [] });
        }

        // 2. Get past 3 months for average
        const historicalBreakdowns = [];
        for (let i = 1; i <= 3; i++) {
            const date = new Date(currentYear, currentMonth - 1 - i, 1);
            const histBreakdown = await getCategoryStats(userId, date.getFullYear(), date.getMonth() + 1);
            historicalBreakdowns.push(histBreakdown);
        }

        // 3. Calculate Averages and Detect Anomalies
        const historicalTotalByCat: Record<number, number> = {};
        const historicalCountByCat: Record<number, number> = {};

        historicalBreakdowns.forEach(breakdown => {
            breakdown.forEach((item: any) => {
                historicalTotalByCat[item.categoryId] = (historicalTotalByCat[item.categoryId] || 0) + item.total;
                historicalCountByCat[item.categoryId] = (historicalCountByCat[item.categoryId] || 0) + 1;
            });
        });

        const anomalies = currentBreakdown.map((current: any) => {
            const histTotal = historicalTotalByCat[current.categoryId];
            const histCount = historicalCountByCat[current.categoryId];

            if (!histTotal || histCount === 0) return null; // New category or no history

            const average = histTotal / histCount;
            const spikePercentage = ((current.total - average) / average) * 100;

            // Threshold: > 20% spike and absolute amount > 50,000 (to avoid noise in small amounts)
            if (spikePercentage > 20 && current.total > 50000) {
                return {
                    categoryId: current.categoryId,
                    categoryName: current.categoryName,
                    currentAmount: current.total,
                    averageAmount: average,
                    spikePercentage: Math.round(spikePercentage),
                    color: current.color
                };
            }
            return null;
        }).filter(Boolean);

        return NextResponse.json({ anomalies });

    } catch (error) {
        console.error("Anomaly Detection Error:", error);
        return NextResponse.json({ error: "Failed to analyze anomalies" }, { status: 500 });
    }
}
