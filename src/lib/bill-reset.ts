import type { Bill } from "@/types";

/**
 * Calculate the next due date based on bill frequency and current due date
 */
export function getNextDueDate(bill: Bill): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDay = bill.dueDate;

    switch (bill.frequency) {
        case "weekly": {
            // For weekly, dueDate represents day of week (0-6)
            const currentDayOfWeek = today.getDay();
            const daysUntilDue = dueDay - currentDayOfWeek;
            const nextDue = new Date(today);

            if (daysUntilDue <= 0) {
                // Due day has passed this week, move to next week
                nextDue.setDate(today.getDate() + (7 + daysUntilDue));
            } else {
                // Due day is still this week
                nextDue.setDate(today.getDate() + daysUntilDue);
            }
            return nextDue;
        }

        case "yearly": {
            // For yearly, we need to store the month somewhere
            // For now, use createdAt month or default to January
            const dueMonth = bill.createdAt
                ? new Date(bill.createdAt).getMonth()
                : 0; // Default to January if not set

            let nextDue = new Date(today.getFullYear(), dueMonth, dueDay);

            // If this year's due date has passed, move to next year
            if (nextDue < today) {
                nextDue = new Date(today.getFullYear() + 1, dueMonth, dueDay);
            }
            return nextDue;
        }

        case "monthly":
        default: {
            // Monthly - same day each month
            let nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay);

            // If this month's due date has passed or is today, move to next month
            if (nextDue <= today) {
                nextDue = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
            }
            return nextDue;
        }
    }
}

/**
 * Calculate reset trigger date (H-7 for monthly, H-3 for weekly, H-30 for yearly)
 */
export function getResetTriggerDate(nextDueDate: Date, frequency: string): Date {
    const triggerDate = new Date(nextDueDate);

    switch (frequency) {
        case "weekly":
            // H-3 for weekly (3 days before next due date)
            triggerDate.setDate(triggerDate.getDate() - 3);
            break;
        case "yearly":
            // H-30 for yearly (30 days before next due date)
            triggerDate.setDate(triggerDate.getDate() - 30);
            break;
        case "monthly":
        default:
            // H-7 for monthly (7 days before next due date)
            triggerDate.setDate(triggerDate.getDate() - 7);
            break;
    }

    return triggerDate;
}

/**
 * Check if a bill should be reset based on H-7/H-3/H-30 rules
 *
 * Rules:
 * - Monthly: Reset H-7 (7 hari sebelum jatuh tempo bulan depan)
 * - Weekly: Reset H-3 (3 hari sebelum jatuh tempo minggu depan)
 * - Yearly: Reset H-30 (30 hari sebelum jatuh tempo tahun depan)
 */
export function shouldResetBill(bill: Bill): boolean {
    // Only reset if bill is paid
    if (!bill.isPaid) return false;

    // If no lastPaidAt, we can't determine reset - default to not resetting
    if (!bill.lastPaidAt) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDueDate = getNextDueDate(bill);
    const resetTriggerDate = getResetTriggerDate(nextDueDate, bill.frequency);

    // Reset if today >= trigger date
    return today >= resetTriggerDate;
}

/**
 * Get reset info for display purposes
 */
export function getResetInfo(bill: Bill): {
    shouldReset: boolean;
    nextDueDate: Date;
    resetTriggerDate: Date;
    daysUntilReset: number;
} {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDueDate = getNextDueDate(bill);
    const resetTriggerDate = getResetTriggerDate(nextDueDate, bill.frequency);

    const diffTime = resetTriggerDate.getTime() - today.getTime();
    const daysUntilReset = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
        shouldReset: bill.isPaid && today >= resetTriggerDate,
        nextDueDate,
        resetTriggerDate,
        daysUntilReset,
    };
}

/**
 * Get human readable reset message
 */
export function getResetMessage(bill: Bill): string | null {
    const { shouldReset, daysUntilReset } = getResetInfo(bill);

    if (shouldReset) {
        return `Tagihan akan direset untuk periode ${bill.frequency === 'monthly' ? 'bulan' : bill.frequency === 'weekly' ? 'minggu' : 'tahun'} depan`;
    }

    if (daysUntilReset > 0 && daysUntilReset <= 10) {
        return `Akan direset dalam ${daysUntilReset} hari`;
    }

    return null;
}
