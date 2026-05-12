"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Flame, Moon, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";

type HeatmapDay = {
    date: string;
    day: number;
    weekday: number;
    amount: number;
    intensity: number;
};

type HeatmapResponse = {
    year: number;
    month: number;
    totalAmount: number;
    maxAmount: number;
    activeDays: number;
    days: HeatmapDay[];
};

const intensityClass: Record<number, string> = {
    0: "bg-emerald-50 dark:bg-emerald-950/20",
    1: "bg-emerald-100 dark:bg-emerald-950/50",
    2: "bg-emerald-200 dark:bg-emerald-900/70",
    3: "bg-emerald-400 dark:bg-emerald-700",
    4: "bg-emerald-600 dark:bg-emerald-500",
};

async function loadHeatmap(month: number, year: number): Promise<HeatmapResponse> {
    const response = await fetch(`/api/analytics/heatmap?month=${month}&year=${year}`);
    const json = await response.json();
    if (!json.success) throw new Error(json.error || "Gagal memuat heatmap");
    return json.data;
}

type LegacyDailyStat = { date: string; count?: number; total?: number; totalAmount?: number; amount?: number };

function normalizeDailyStats(data: LegacyDailyStat[]) {
    return data.map((item) => {
        const date = new Date(item.date);
        return {
            date,
            rawDate: item.date,
            count: Number(item.count ?? 0),
            amount: Number(item.total ?? item.totalAmount ?? item.amount ?? 0),
        };
    }).filter((item) => !Number.isNaN(item.date.getTime()));
}

function buildSpendingSummary(data: LegacyDailyStat[]) {
    const days = normalizeDailyStats(data);
    const total = days.reduce((sum, item) => sum + item.amount, 0);
    const activeDays = days.filter((item) => item.amount > 0);
    const topDay = activeDays.reduce<typeof activeDays[number] | null>((top, item) => {
        if (!top || item.amount > top.amount) return item;
        return top;
    }, null);
    const averageDaily = days.length > 0 ? total / days.length : 0;
    const noSpendDays = days.length - activeDays.length;
    const weeklyTotals = Array.from({ length: 7 }, (_, day) => ({ day, total: 0 }));

    days.forEach((item) => {
        const mondayFirstDay = (item.date.getDay() + 6) % 7;
        weeklyTotals[mondayFirstDay].total += item.amount;
    });

    const busiestWeekday = weeklyTotals.reduce((top, item) => item.total > top.total ? item : top, weeklyTotals[0]);

    return { days, total, activeDays, topDay, averageDaily, noSpendDays, weeklyTotals, busiestWeekday };
}

const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function SpendingHeatmap({ data }: { data: LegacyDailyStat[] }) {
    const summary = buildSpendingSummary(data);
    const maxCount = Math.max(...summary.days.map(item => item.count), 0);
    const firstDayOffset = summary.days[0] ? (summary.days[0].date.getDay() + 6) % 7 : 0;
    const calendarCells = [
        ...Array.from({ length: firstDayOffset }, (_, index) => ({ type: "blank" as const, id: `blank-${index}` })),
        ...summary.days.map((item) => ({ type: "day" as const, item })),
    ];
    const insight = summary.topDay
        ? `Pengeluaran tertinggi terjadi pada ${summary.topDay.date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}. ${weekdayLabels[summary.busiestWeekday.day]} jadi hari paling padat.`
        : "Belum ada pola pengeluaran yang terbaca di periode ini.";

    return (
        <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-3 shadow-sm dark:border-emerald-950/40 dark:bg-slate-950">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-black text-foreground">Peta Kebiasaan Belanja</h3>
                    <p className="mt-1 max-w-xl text-[11px] font-semibold leading-snug text-muted-foreground">{insight}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CalendarDays size={17} />
                </div>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-1.5">
                <div className="rounded-xl bg-emerald-50/70 p-2 dark:bg-emerald-950/20">
                    <TrendingUp size={13} className="mb-1 text-emerald-600 dark:text-emerald-300" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Rata-rata</p>
                    <p className="mt-0.5 truncate text-xs font-black text-foreground">{formatCurrency(summary.averageDaily)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50/70 p-2 dark:bg-emerald-950/20">
                    <Flame size={13} className="mb-1 text-emerald-600 dark:text-emerald-300" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Terboros</p>
                    <p className="mt-0.5 truncate text-xs font-black text-foreground">{formatCurrency(summary.topDay?.amount || 0)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50/70 p-2 dark:bg-emerald-950/20">
                    <Moon size={13} className="mb-1 text-emerald-600 dark:text-emerald-300" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Hari hemat</p>
                    <p className="mt-0.5 text-xs font-black text-foreground">{summary.noSpendDays} hari</p>
                </div>
            </div>

            <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-b from-emerald-50/70 to-white p-2.5 dark:border-emerald-950/40 dark:from-emerald-950/20 dark:to-slate-950">
                <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Heatmap transaksi</span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                        <span>rendah</span>
                        {[1, 2, 3, 4].map((level) => <span key={level} className={cn("h-2 w-2 rounded-full", intensityClass[level])} />)}
                        <span>tinggi</span>
                    </div>
                </div>
                <div className="grid w-full grid-cols-7 gap-1">
                    {weekdayLabels.map((label) => (
                        <span key={label} className="mb-0.5 text-center text-[8px] font-black text-emerald-500 dark:text-emerald-300/70">
                            {label}
                        </span>
                    ))}
                    {calendarCells.map((cell) => {
                        if (cell.type === "blank") return <div key={cell.id} className="aspect-square" />;
                        const { item } = cell;
                        const intensity = maxCount > 0 ? Math.ceil((item.count / maxCount) * 4) : 0;
                        return (
                            <div
                                key={item.rawDate}
                                title={`${item.rawDate}: ${item.count} transaksi, ${formatCurrency(item.amount)}`}
                                className={cn(
                                    "flex aspect-square items-center justify-center rounded-lg border border-white/80 text-[10px] font-black tabular-nums shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform hover:scale-105 dark:border-slate-950 sm:text-[11px]",
                                    intensityClass[intensity] || intensityClass[0],
                                    intensity >= 3 ? "text-white" : "text-emerald-700 dark:text-emerald-100"
                                )}
                            >
                                {item.date.getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}

export function MonthlySpendingHeatmap({ data }: { data: LegacyDailyStat[] }) {
    return <SpendingHeatmap data={data} />;
}

export function SpendingHeatmapPanel({ month, year }: { month: number; year: number }) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["analytics", "heatmap", month, year],
        queryFn: () => loadHeatmap(month, year),
        staleTime: 60 * 1000,
    });

    const leadingBlanks = data?.days[0]?.weekday ?? 0;
    const cells = data ? [...Array.from({ length: leadingBlanks }, (_, index) => ({ blank: true, id: `blank-${index}` })), ...data.days] : [];

    return (
        <motion.section
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-900/40 dark:bg-slate-900"
            data-testid="spending-heatmap"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-300">Spending Heatmap</p>
                    <h2 className="text-lg font-black text-foreground">Pola pengeluaran harian</h2>
                    <p className="text-xs font-semibold text-muted-foreground">Semakin gelap, semakin tinggi pengeluaran hari itu.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                    <CalendarDays size={22} />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 35 }, (_, index) => <div key={index} className="aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : error ? (
                <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">Gagal memuat heatmap</div>
            ) : data ? (
                <>
                    <div className="mb-3 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
                            <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">Total</p>
                            <p className="mt-1 text-sm font-black tabular-nums">{formatCurrency(data.totalAmount)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-500">Hari aktif</p>
                            <p className="mt-1 text-sm font-black tabular-nums">{data.activeDays} hari</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-500">Tertinggi</p>
                            <p className="mt-1 text-sm font-black tabular-nums">{formatCurrency(data.maxAmount)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                        {cells.map((cell) => {
                            if ("blank" in cell) return <div key={cell.id} className="aspect-square" />;
                            return (
                                <div
                                    key={cell.date}
                                    title={`${cell.date}: ${formatCurrency(cell.amount)}`}
                                    className={cn(
                                        "aspect-square rounded-lg border border-white/60 transition-transform hover:scale-110 dark:border-slate-900",
                                        intensityClass[cell.intensity] || intensityClass[0]
                                    )}
                                >
                                    <span className="sr-only">{cell.date}: {formatCurrency(cell.amount)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <span>Rendah</span>
                        {[0, 1, 2, 3, 4].map(level => <span key={level} className={cn("h-3 w-3 rounded", intensityClass[level])} />)}
                        <span>Tinggi</span>
                    </div>
                </>
            ) : null}
        </motion.section>
    );
}
