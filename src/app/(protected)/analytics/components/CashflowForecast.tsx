"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";

type ForecastMonth = {
    key: string;
    label: string;
    projectedIncome: number;
    projectedExpense: number;
    projectedBalance: number;
};

type ForecastResponse = {
    averageIncome: number;
    averageExpense: number;
    averageBalance: number;
    trend: "positive" | "warning";
    summary: string;
    forecast: ForecastMonth[];
};

async function loadForecast(): Promise<ForecastResponse> {
    const response = await fetch("/api/analytics/forecast");
    const json = await response.json();
    if (!json.success) throw new Error(json.error || "Gagal memuat forecast");
    return json.data;
}

export function CashflowForecast() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["analytics", "cashflow-forecast"],
        queryFn: loadForecast,
        staleTime: 60 * 1000,
    });

    return (
        <motion.section
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="rounded-[1.75rem] border border-sky-100 bg-white p-5 shadow-sm dark:border-sky-900/40 dark:bg-slate-900"
            data-testid="cashflow-forecast"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-600 dark:text-sky-300">Cashflow Forecast</p>
                    <h2 className="text-lg font-black text-foreground">Prediksi 3 bulan ke depan</h2>
                    <p className="text-xs font-semibold text-muted-foreground">Estimasi sederhana dari rata-rata 6 bulan terakhir.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/25">
                    <Activity size={22} />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                </div>
            ) : error ? (
                <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">Gagal memuat forecast</div>
            ) : data ? (
                <>
                    <div className={cn(
                        "mb-4 rounded-2xl p-4",
                        data.trend === "positive" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200" : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                    )}>
                        <div className="flex items-center gap-2">
                            {data.trend === "positive" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <p className="text-sm font-black">{data.summary}</p>
                        </div>
                        <p className="mt-2 text-xs font-semibold opacity-80">Rata-rata surplus/bulan: {formatCurrency(data.averageBalance)}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-500">Income</p>
                            <p className="mt-1 text-sm font-black tabular-nums">{formatCurrency(data.averageIncome)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-500">Expense</p>
                            <p className="mt-1 text-sm font-black tabular-nums">{formatCurrency(data.averageExpense)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                            <p className="text-[10px] font-black uppercase text-slate-500">Balance</p>
                            <p className={cn("mt-1 text-sm font-black tabular-nums", data.averageBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(data.averageBalance)}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {data.forecast.map((item) => (
                            <div key={item.key} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-black text-foreground">{item.label}</p>
                                    <p className={cn("text-sm font-black", item.projectedBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>{formatCurrency(item.projectedBalance)}</p>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold text-muted-foreground">
                                    <span>Masuk {formatCurrency(item.projectedIncome)}</span>
                                    <span>Keluar {formatCurrency(item.projectedExpense)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : null}
        </motion.section>
    );
}
