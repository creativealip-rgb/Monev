/**
 * Financial Health Score Calculator
 * Returns a 0–100 score based on multiple financial health factors.
 */

export interface HealthScoreData {
    income: number;
    expense: number;
    streakDays: number;
    budgets: Array<{ amount: number; spent: number }>;
    goalsCount: number;
    totalOwed: number;   // piutang (others owe user)
    totalOwe: number;    // hutang (user owes others)
}

export interface HealthScoreBreakdown {
    savings: { score: number; max: number; label: string };
    streak: { score: number; max: number; label: string };
    budgets: { score: number; max: number; label: string };
    goals: { score: number; max: number; label: string };
    debt: { score: number; max: number; label: string };
}

export interface HealthScoreResult {
    score: number;
    label: "Belum Ada Data" | "Kritis" | "Perlu Perhatian" | "Sehat" | "Istimewa";
    color: string;
    emoji: string;
    breakdown: HealthScoreBreakdown;
    tip: string;
}

export function calculateHealthScore(data: HealthScoreData): HealthScoreResult {
    const hasAnyData = data.income > 0 || data.expense > 0 || data.streakDays > 0 || data.budgets.length > 0 || data.goalsCount > 0 || data.totalOwe > 0 || data.totalOwed > 0;
    const breakdown: HealthScoreBreakdown = {
        savings: { score: 0, max: 30, label: "Tingkat Tabungan" },
        streak: { score: 0, max: 25, label: "Konsistensi" },
        budgets: { score: 0, max: 25, label: "Disiplin Anggaran" },
        goals: { score: 0, max: 10, label: "Tujuan Keuangan" },
        debt: { score: 0, max: 10, label: "Manajemen Hutang" },
    };

    if (!hasAnyData) {
        return {
            score: 0,
            label: "Belum Ada Data",
            color: "#64748b",
            emoji: "✨",
            breakdown,
            tip: "Tambahkan akun, pemasukan, atau transaksi pertama agar Monev bisa menghitung kesehatan keuanganmu.",
        };
    }

    // 1. Savings Rate (0–30 pts)
    if (data.income > 0) {
        const savingsRate = (data.income - data.expense) / data.income;
        if (savingsRate >= 0.3) breakdown.savings.score = 30;
        else if (savingsRate >= 0.2) breakdown.savings.score = 25;
        else if (savingsRate >= 0.1) breakdown.savings.score = 15;
        else if (savingsRate >= 0) breakdown.savings.score = 5;
        else breakdown.savings.score = 0; // Deficit
    }

    // 2. Streak Consistency (0–25 pts)
    if (data.streakDays >= 30) breakdown.streak.score = 25;
    else if (data.streakDays >= 14) breakdown.streak.score = 20;
    else if (data.streakDays >= 7) breakdown.streak.score = 15;
    else if (data.streakDays >= 3) breakdown.streak.score = 8;
    else if (data.streakDays >= 1) breakdown.streak.score = 3;

    // 3. Budget Discipline (0–25 pts)
    if (data.budgets.length === 0) {
        breakdown.budgets.score = 10; // Neutral — no budgets set
    } else {
        const overBudgetCount = data.budgets.filter(b => b.spent / b.amount > 1.0).length;
        const nearBudgetCount = data.budgets.filter(b => b.spent / b.amount > 0.85 && b.spent / b.amount <= 1.0).length;
        const ratio = (data.budgets.length - overBudgetCount) / data.budgets.length;
        if (overBudgetCount === 0 && nearBudgetCount === 0) breakdown.budgets.score = 25;
        else if (overBudgetCount === 0) breakdown.budgets.score = 18;
        else breakdown.budgets.score = Math.round(ratio * 15);
    }

    // 4. Goals (0–10 pts)
    if (data.goalsCount >= 3) breakdown.goals.score = 10;
    else if (data.goalsCount >= 1) breakdown.goals.score = 7;

    // 5. Debt Net (0–10 pts)
    const netDebt = data.totalOwe - data.totalOwed;
    if (netDebt <= 0) breakdown.debt.score = 10; // Owed more than owes → healthy
    else if (data.totalOwe < 500_000) breakdown.debt.score = 7;
    else if (data.totalOwe < 2_000_000) breakdown.debt.score = 4;

    const total = Object.values(breakdown).reduce((sum, b) => sum + b.score, 0);

    let label: HealthScoreResult["label"];
    let color: string;
    let emoji: string;
    let tip: string;

    if (total >= 81) {
        label = "Istimewa"; color = "#10b981"; emoji = "🏆";
        tip = "Luar biasa! Keuanganmu sangat sehat. Pertahankan konsistensi ini!";
    } else if (total >= 61) {
        label = "Sehat"; color = "#3b82f6"; emoji = "💪";
        tip = "Keuanganmu dalam kondisi baik. Tingkatkan tabungan untuk mencapai level Istimewa!";
    } else if (total >= 31) {
        label = "Perlu Perhatian"; color = "#f59e0b"; emoji = "⚠️";
        tip = breakdown.savings.score < 15
            ? "Coba hemat lebih banyak — targetkan tabungan 20% dari pemasukan."
            : "Jaga disiplin anggaran dan catat transaksi setiap hari untuk streak yang lebih baik.";
    } else {
        label = "Kritis"; color = "#ef4444"; emoji = "🚨";
        tip = "Pengeluaranmu melebihi pemasukan. Buat anggaran ketat dan kurangi hutang segera.";
    }

    return { score: total, label, color, emoji, breakdown, tip };
}
