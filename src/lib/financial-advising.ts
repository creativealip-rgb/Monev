export function calculateRunway(balance: number, avgMonthlyExpense: number): number {
    if (avgMonthlyExpense <= 0) return 999; // Assume infinite/safe if no expense
    if (balance <= 0) return 0;
    return Number((balance / avgMonthlyExpense).toFixed(1));
}

export function calculateIdleCash(balance: number, avgMonthlyExpense: number, bufferMonths: number = 3): number {
    const requiredBuffer = avgMonthlyExpense * bufferMonths;
    return Math.max(0, balance - requiredBuffer);
}

export function calculateFutureValue(presentValue: number, years: number, inflationRate: number = 0.05): number {
    return Math.round(presentValue * Math.pow(1 + inflationRate, years));
}

export function getRunwayStatus(months: number): { status: "critical" | "warning" | "safe" | "wealthy", message: string, color: string } {
    if (months < 1) return { status: "critical", message: "Darurat! Cashflow kritis.", color: "rose" };
    if (months < 3) return { status: "warning", message: "Hati-hati, dana darurat tipis.", color: "orange" };
    if (months < 6) return { status: "safe", message: "Aman terkendali.", color: "emerald" };
    return { status: "wealthy", message: "Cashflow sangat sehat! 🚀", color: "blue" };
}
