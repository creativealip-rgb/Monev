import { Debt } from "./types";

export function parseOriginalAmount(description: string): number | null {
    const match = description?.match(/\[ORIG:(\d+(?:\.\d+)?)\]/);
    return match ? parseFloat(match[1]) : null;
}

export function stripOrigTag(description: string): string {
    return (description || "").replace(/\s*\[ORIG:\d+(?:\.\d+)?\]/, "").trim();
}

export function addOrigTag(description: string, originalAmount: number): string {
    if (/\[ORIG:\d+(?:\.\d+)?\]/.test(description || "")) return description;
    return `${description || ""} [ORIG:${originalAmount}]`.trim();
}

export function getDebtAmounts(debt: Debt): {
    originalAmount: number;
    remainingAmount: number;
    paidAmount: number;
    hasPartialPayment: boolean;
} {
    const orig = parseOriginalAmount(debt.description);
    const originalAmount = orig ?? debt.amount;
    const remainingAmount = debt.amount;
    const paidAmount = originalAmount - remainingAmount;
    return {
        originalAmount,
        remainingAmount,
        paidAmount,
        hasPartialPayment: orig !== null && paidAmount > 0,
    };
}