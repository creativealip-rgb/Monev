"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";

type CategoryTrend = {
    categoryId: number;
    categoryName: string;
    color: string;
    monthly: number[];
    total: number;
    average: number;
    forecastNextMonth: number;
    direction: "up" | "down" | "stable";
    changePercent: number;
};

type CategoryTrendResponse = {
    categories: CategoryTrend[];
    chartData: Array<Record<string, string | number>>;
};

async function loadCategoryTrend(): Promise<CategoryTrendResponse> {
    const response = await fetch("/api/analytics/category-trend");
    const json = await response.json();
    if (!json.success) throw new Error(json.error || "Gagal memuat tren kategori");
    return json.data;
}

function TrendIcon({ direction }: { direction: CategoryTrend["direction"] }) {
    if (direction === "up") return <ArrowUpRight size={15} />;
    if (direction === "down") return <ArrowDownRight size={15} />;
    return <ArrowRight size={15} />;
}

function formatAxis(value: number) {
    if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}jt`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}rb`;
    return String(value);
}

export function CategoryTrendChart() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["analytics", "category-trend"],
        queryFn: loadCategoryTrend,
        staleTime: 60 * 1000,
    });

    return (
        <motion.section
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="rounded-[1.75rem] border border-indigo-100 bg-white p-5 shadow-sm dark:border-indigo-900/40 dark:bg-slate-900"
            data-testid="category-trend-chart"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-300">Category Trend</p>
                    <h2 className="text-lg font-black text-foreground">Tren kategori 6 bulan</h2>
                    <p className="text-xs font-semibold text-muted-foreground">Top kategori pengeluaran, arah tren, dan forecast bulan depan.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/25">
                    <TrendingUp size={22} />
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-72 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                    {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />)}
                </div>
            ) : error ? (
                <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-300">Gagal memuat tren kategori</div>
            ) : data && data.categories.length > 0 ? (
                <>
                    <div className="h-72 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                            <LineChart data={data.chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                                {data.categories.map((category) => (
                                    <Line
                                        key={category.categoryId}
                                        type="monotone"
                                        dataKey={category.categoryName}
                                        stroke={category.color}
                                        strokeWidth={3}
                                        dot={{ r: 3, fill: category.color }}
                                        activeDot={{ r: 5 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 space-y-2">
                        {data.categories.map((category) => (
                            <div key={category.categoryId} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                                        <div>
                                            <p className="text-sm font-black text-foreground">{category.categoryName}</p>
                                            <p className="text-[11px] font-bold text-muted-foreground">Rata-rata {formatCurrency(category.average)} / bulan</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black",
                                        category.direction === "up" && "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300",
                                        category.direction === "down" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300",
                                        category.direction === "stable" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                                    )}>
                                        <TrendIcon direction={category.direction} />
                                        {category.changePercent}%
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold text-muted-foreground">
                                    <span>Total {formatCurrency(category.total)}</span>
                                    <span>Forecast {formatCurrency(category.forecastNextMonth)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-muted-foreground dark:bg-slate-800">Belum ada cukup data pengeluaran untuk tren kategori.</div>
            )}
        </motion.section>
    );
}
