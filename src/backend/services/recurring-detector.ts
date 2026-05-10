import { getTransactions } from "@/backend/db/operations";
import type { Transaction } from "@/backend/db/schema";

export type RecurringPattern = {
    key: string;
    description: string;
    amount: number;
    type: "expense" | "income";
    categoryId: number | null;
    frequency: "weekly" | "monthly";
    confidence: number;
    occurrences: number;
    nextRunAt: Date;
    transactionIds: number[];
};

function normalizeDescription(value: string | null | undefined) {
    return String(value || "Transaksi rutin")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\b(bayar|beli|transfer|untuk|tagihan|langganan)\b/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "transaksi rutin";
}

function average(values: number[]) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function daysBetween(a: Date, b: Date) {
    return Math.abs(a.getTime() - b.getTime()) / 86400000;
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function scoreInterval(intervals: number[], target: number, tolerance: number) {
    if (intervals.length === 0) return 0;
    const matched = intervals.filter((interval) => Math.abs(interval - target) <= tolerance).length;
    return matched / intervals.length;
}

export async function detectRecurringPatterns(userId: number): Promise<RecurringPattern[]> {
    const transactions = await getTransactions(userId, 180) as Transaction[];
    const groups = new Map<string, Transaction[]>();

    for (const tx of transactions) {
        if (!tx.categoryId || tx.type === "transfer") continue;
        const description = normalizeDescription(tx.merchantName || tx.description);
        const bucket = Math.round(tx.amount / 1000) * 1000;
        const key = `${tx.type}|${tx.categoryId}|${description}|${bucket}`;
        groups.set(key, [...(groups.get(key) || []), tx]);
    }

    const patterns: RecurringPattern[] = [];
    for (const [key, group] of Array.from(groups.entries())) {
        if (group.length < 3) continue;
        const sorted = [...group].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const amounts = sorted.map((tx) => tx.amount);
        const avgAmount = average(amounts);
        const variance = average(amounts.map((amount) => Math.abs(amount - avgAmount) / avgAmount));
        if (variance > 0.1) continue;

        const intervals = sorted.slice(1).map((tx, index) => daysBetween(new Date(tx.date), new Date(sorted[index].date)));
        const weeklyScore = scoreInterval(intervals, 7, 2);
        const monthlyScore = scoreInterval(intervals, 30, 4);
        const frequency = monthlyScore >= weeklyScore ? "monthly" : "weekly";
        const intervalScore = Math.max(weeklyScore, monthlyScore);
        if (intervalScore < 0.7) continue;

        const lastDate = new Date(sorted[sorted.length - 1].date);
        const nextRunAt = addDays(lastDate, frequency === "monthly" ? 30 : 7);
        const confidence = Math.min(0.95, 0.45 + intervalScore * 0.35 + (1 - variance) * 0.2);

        patterns.push({
            key,
            description: sorted[sorted.length - 1].merchantName || sorted[sorted.length - 1].description || "Transaksi rutin",
            amount: Math.round(avgAmount),
            type: sorted[0].type === "income" ? "income" : "expense",
            categoryId: sorted[0].categoryId,
            frequency,
            confidence: Number(confidence.toFixed(2)),
            occurrences: sorted.length,
            nextRunAt,
            transactionIds: sorted.map((tx) => tx.id),
        });
    }

    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
