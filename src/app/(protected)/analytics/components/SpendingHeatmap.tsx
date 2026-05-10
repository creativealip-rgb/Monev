"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
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
    0: "bg-slate-100 dark:bg-slate-800",
    1: "bg-emerald-100 dark:bg-emerald-950",
    2: "bg-emerald-300 dark:bg-emerald-800",
    3: "bg-emerald-500 dark:bg-emerald-600",
    4: "bg-emerald-700 dark:bg-emerald-400",
};

async function loadHeatmap(month: number, year: number): Promise<HeatmapResponse> {
    const response = await fetch(`/api/analytics/heatmap?month=${month}&year=${year}`);
    const json = await response.json();
    if (!json.success) throw new Error(json.error || "Gagal memuat heatmap");
    return json.data;
}

type LegacyDailyStat = { date: string; totalAmount?: number; amount?: number };

export function SpendingHeatmap({ data }: { data: LegacyDailyStat[] }) {
    const max = Math.max(...data.map(item => Number(item.totalAmount || item.amount || 0)), 0);
    return (
        <div className="grid grid-cols-7 gap-1.5 rounded-3xl bg-white p-4 dark:bg-slate-900">
            {data.map((item) => {
                const amount = Number(item.totalAmount || item.amount || 0);
                const intensity = max > 0 ? Math.ceil((amount / max) * 4) : 0;
                return <div key={item.date} title={`${item.date}: ${formatCurrency(amount)}`} className={cn("aspect-square rounded-lg", intensityClass[intensity] || intensityClass[0])} />;
            })}
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
