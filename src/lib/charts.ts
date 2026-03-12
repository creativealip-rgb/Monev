import { Chart, registerables, ChartConfiguration, Color } from "chart.js";
import { createCanvas } from "canvas";

Chart.register(...registerables);

const BRAND_COLORS = {
    primary: "#8B5CF6",
    success: "#10B981",
    danger: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    purple: "#A78BFA",
    pink: "#EC4899",
    blue: "#60A5FA",
    green: "#34D399",
    orange: "#FB923C",
};

const LABELS = {
    id: {
        income: "Pemasukan",
        expense: "Pengeluaran",
        currentMonth: "Bulan Ini",
        previousMonth: "Bulan Lalu",
        dailySpending: "Pengeluaran Harian",
        goalsProgress: "Progress Tujuan",
        needs: "Kebutuhan",
        wants: "Keinginan",
        savings: "Tabungan",
        noData: "Tidak ada data",
    },
    en: {
        income: "Income",
        expense: "Expense",
        currentMonth: "This Month",
        previousMonth: "Last Month",
        dailySpending: "Daily Spending",
        goalsProgress: "Goals Progress",
        needs: "Needs",
        wants: "Wants",
        savings: "Savings",
        noData: "No data",
    },
};

function formatCurrency(amount: number, locale: "id" | "en"): string {
    const formatted = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);

    return locale === "id" ? formatted : formatted.replace("Rp", "Rp ");
}

export async function generateIncomeExpenseChart(
    currentMonth: { income: number; expense: number },
    previousMonth: { income: number; expense: number },
    locale: "id" | "en"
): Promise<string> {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    const labels = [LABELS[locale].previousMonth, LABELS[locale].currentMonth];
    const t = LABELS[locale];

    const config: ChartConfiguration<"bar"> = {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: t.income,
                    data: [previousMonth.income, currentMonth.income],
                    backgroundColor: BRAND_COLORS.success,
                    borderRadius: 8,
                    barThickness: 60,
                },
                {
                    label: t.expense,
                    data: [previousMonth.expense, currentMonth.expense],
                    backgroundColor: BRAND_COLORS.danger,
                    borderRadius: 8,
                    barThickness: 60,
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: { size: 14, family: "system-ui" },
                        usePointStyle: true,
                        pointStyle: "rect",
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y ?? 0;
                            return `${context.dataset.label}: ${formatCurrency(value, locale)}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            const num = typeof value === "number" ? value : 0;
                            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}Jt`;
                            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
                            return num.toString();
                        },
                        font: { size: 12 },
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                    },
                },
                x: {
                    ticks: { font: { size: 12 } },
                    grid: { display: false },
                },
            },
        },
    };

    const chart = new Chart(ctx as unknown as import("chart.js").ChartItem, config);
    await chart.render();
    return canvas.toDataURL("image/png");
}

export async function generateExpenseBreakdownChart(
    categories: Array<{ name: string; amount: number; color: string }>,
    locale: "id" | "en"
): Promise<string> {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    const hasData = categories.length > 0 && categories.some((c) => c.amount > 0);

    if (!hasData) {
        ctx.fillStyle = "#F9FAFB";
        ctx.fillRect(0, 0, 800, 400);
        ctx.fillStyle = "#6B7280";
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(LABELS[locale].noData, 400, 200);
        return canvas.toDataURL("image/png");
    }

    const config: ChartConfiguration<"doughnut"> = {
        type: "doughnut",
        data: {
            labels: categories.map((c) => c.name),
            datasets: [
                {
                    data: categories.map((c) => c.amount),
                    backgroundColor: categories.map((c) => c.color) as Color[],
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            cutout: "50%",
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        font: { size: 13, family: "system-ui" },
                        padding: 15,
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed as number;
                            const dataset = context.dataset.data;
                            const total = dataset.reduce(
                                (sum, v) => sum + (typeof v === "number" ? v : 0),
                                0
                            );
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                            return `${context.label}: ${formatCurrency(value, locale)} (${percentage}%)`;
                        },
                    },
                },
            },
        },
    };

    const chart = new Chart(ctx as unknown as import("chart.js").ChartItem, config);
    await chart.render();
    return canvas.toDataURL("image/png");
}

export async function generateDailySpendingChart(
    dailyData: Array<{ date: string; amount: number }>,
    locale: "id" | "en"
): Promise<string> {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    const hasData = dailyData.length > 0 && dailyData.some((d) => d.amount > 0);

    if (!hasData) {
        ctx.fillStyle = "#F9FAFB";
        ctx.fillRect(0, 0, 800, 400);
        ctx.fillStyle = "#6B7280";
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(LABELS[locale].noData, 400, 200);
        return canvas.toDataURL("image/png");
    }

    const config: ChartConfiguration<"line"> = {
        type: "line",
        data: {
            labels: dailyData.map((d) => d.date),
            datasets: [
                {
                    label: LABELS[locale].dailySpending,
                    data: dailyData.map((d) => d.amount),
                    borderColor: BRAND_COLORS.primary,
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: BRAND_COLORS.primary,
                    pointBorderColor: "#FFFFFF",
                    pointBorderWidth: 2,
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y ?? 0;
                            return `${LABELS[locale].dailySpending}: ${formatCurrency(value, locale)}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => {
                            const num = typeof value === "number" ? value : 0;
                            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}Jt`;
                            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
                            return num.toString();
                        },
                        font: { size: 12 },
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                    },
                },
                x: {
                    ticks: {
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45,
                    },
                    grid: { display: false },
                },
            },
        },
    };

    const chart = new Chart(ctx as unknown as import("chart.js").ChartItem, config);
    await chart.render();
    return canvas.toDataURL("image/png");
}

export async function generateGoalsProgressChart(
    goals: Array<{ name: string; current: number; target: number; color: string }>,
    locale: "id" | "en"
): Promise<string> {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    const hasData = goals.length > 0 && goals.some((g) => g.target > 0);

    if (!hasData) {
        ctx.fillStyle = "#F9FAFB";
        ctx.fillRect(0, 0, 800, 400);
        ctx.fillStyle = "#6B7280";
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(LABELS[locale].noData, 400, 200);
        return canvas.toDataURL("image/png");
    }

    const config: ChartConfiguration<"bar"> = {
        type: "bar",
        data: {
            labels: goals.map((g) => g.name),
            datasets: [
                {
                    label: LABELS[locale].goalsProgress,
                    data: goals.map((g) => g.current),
                    backgroundColor: goals.map((g) => g.color) as Color[],
                    borderRadius: 8,
                    barThickness: 40,
                },
            ],
        },
        options: {
            indexAxis: "y",
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.x ?? 0;
                            const goal = goals[context.dataIndex];
                            const percentage =
                                goal.target > 0 ? ((goal.current / goal.target) * 100).toFixed(1) : "0";
                            return `${context.label}: ${formatCurrency(value, locale)} / ${formatCurrency(goal.target, locale)} (${percentage}%)`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: Math.max(...goals.map((g) => g.target)),
                    ticks: {
                        callback: (value) => {
                            const num = typeof value === "number" ? value : 0;
                            if (num >= 1000000) return `${(num / 1000000).toFixed(1)}Jt`;
                            if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
                            return num.toString();
                        },
                        font: { size: 12 },
                    },
                    grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                    },
                },
                y: {
                    ticks: { font: { size: 12 } },
                    grid: { display: false },
                },
            },
        },
    };

    const chart = new Chart(ctx as unknown as import("chart.js").ChartItem, config);
    await chart.render();
    return canvas.toDataURL("image/png");
}

export async function generate503020Gauge(
    needs: { actual: number; target: number },
    wants: { actual: number; target: number },
    savings: { actual: number; target: number },
    locale: "id" | "en"
): Promise<string> {
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext("2d");

    const totalActual = needs.actual + wants.actual + savings.actual;
    const hasData = totalActual > 0;

    if (!hasData) {
        ctx.fillStyle = "#F9FAFB";
        ctx.fillRect(0, 0, 400, 400);
        ctx.fillStyle = "#6B7280";
        ctx.font = "14px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(LABELS[locale].noData, 200, 200);
        return canvas.toDataURL("image/png");
    }

    const t = LABELS[locale];

    const config: ChartConfiguration<"pie"> = {
        type: "pie",
        data: {
            labels: [t.needs, t.wants, t.savings],
            datasets: [
                {
                    data: [needs.actual, wants.actual, savings.actual],
                    backgroundColor: [BRAND_COLORS.blue, BRAND_COLORS.pink, BRAND_COLORS.green] as Color[],
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                },
            ],
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        font: { size: 12, family: "system-ui" },
                        padding: 12,
                    },
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed as number;
                            const targetPct =
                                context.dataIndex === 0 ? 50 : context.dataIndex === 1 ? 30 : 20;
                            const targetAmount = (totalActual * targetPct) / 100;
                            const diff = value - targetAmount;
                            const status =
                                diff > 0
                                    ? `+${formatCurrency(diff, locale)} (melebihi)`
                                    : diff < 0
                                      ? `${formatCurrency(diff, locale)} (kurang)`
                                      : "sesuai target";
                            return `${context.label}: ${formatCurrency(value, locale)} (${status})`;
                        },
                    },
                },
            },
        },
    };

    const chart = new Chart(ctx as unknown as import("chart.js").ChartItem, config);
    await chart.render();
    return canvas.toDataURL("image/png");
}
