import { Transaction } from "@/types";

/**
 * SubscriptionDetector
 * Logic to identify recurring transactions in history.
 */

export interface SubscriptionPattern {
    merchantName: string;
    avgAmount: number;
    frequency: "monthly" | "weekly" | "yearly";
    confidence: number;
    lastDate: Date;
}

export function detectSubscriptions(transactions: Transaction[]): SubscriptionPattern[] {
    const patterns: Record<string, { dates: Date[], amounts: number[] }> = {};

    // 1. Group by merchant
    transactions.forEach(t => {
        const merchant = t.description?.toLowerCase() || "";
        if (!merchant) return;

        // Simple cleanup for better matching
        const cleanMerchant = merchant.replace(/\d+/g, '').trim();

        if (!patterns[cleanMerchant]) {
            patterns[cleanMerchant] = { dates: [], amounts: [] };
        }
        patterns[cleanMerchant].dates.push(new Date(t.createdAt));
        patterns[cleanMerchant].amounts.push(t.amount);
    });

    const results: SubscriptionPattern[] = [];

    // 2. Analyze frequency
    Object.entries(patterns).forEach(([merchant, data]) => {
        if (data.dates.length < 2) return;

        // Sort dates
        data.dates.sort((a, b) => b.getTime() - a.getTime());

        // Check intervals (in days)
        const intervals: number[] = [];
        for (let i = 0; i < data.dates.length - 1; i++) {
            const diff = (data.dates[i].getTime() - data.dates[i + 1].getTime()) / (1000 * 60 * 60 * 24);
            intervals.push(diff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const avgAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;

        let frequency: "monthly" | "weekly" | "yearly" | null = null;
        let confidence = 0;

        if (avgInterval >= 25 && avgInterval <= 35) {
            frequency = "monthly";
            confidence = data.dates.length >= 3 ? 0.9 : 0.7;
        } else if (avgInterval >= 6 && avgInterval <= 8) {
            frequency = "weekly";
            confidence = data.dates.length >= 4 ? 0.8 : 0.6;
        } else if (avgInterval >= 360 && avgInterval <= 370) {
            frequency = "yearly";
            confidence = 0.9;
        }

        if (frequency && confidence > 0.5) {
            results.push({
                merchantName: merchant.charAt(0).toUpperCase() + merchant.slice(1),
                avgAmount,
                frequency,
                confidence,
                lastDate: data.dates[0]
            });
        }
    });

    return results;
}
