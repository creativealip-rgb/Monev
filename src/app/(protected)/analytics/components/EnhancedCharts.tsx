"use client";

import { useMemo, useState } from "react";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart
} from "recharts";
import { AlertTriangle, Target, Zap, Award, ArrowUpRight, ArrowDownLeft, WalletCards } from "lucide-react";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { motion } from "framer-motion";
import type { ChartCategoryStat, IncomeStat, MonthlyStat, RecommendationData } from "./types";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function formatAxisCurrency(value: number) {
    const amount = Number(value || 0);

    if (amount >= 1_000_000_000) {
        return `Rp${(amount / 1_000_000_000).toFixed(1).replace(".0", "")}M`;
    }

    if (amount >= 1_000_000) {
        return `Rp${(amount / 1_000_000).toFixed(1).replace(".0", "")}Jt`;
    }

    if (amount >= 1_000) {
        return `Rp${(amount / 1_000).toFixed(0)}Rb`;
    }

    return `Rp${amount}`;
}

export function CategoryBreakdownChart({
    categoryStats,
    onSelectCategory,
}: {
    categoryStats: ChartCategoryStat[];
    onSelectCategory?: (category: ChartCategoryStat) => void;
}) {
    const topCategories = useMemo(() => {
        return [...(categoryStats || [])]
            .filter((item) => Number(item.total || 0) > 0)
            .sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
            .slice(0, 6);
    }, [categoryStats]);

    const [showDetails, setShowDetails] = useState(false);

    if (topCategories.length === 0) return null;

    const total = topCategories.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const topCategory = topCategories[0];
    const topShare = total > 0 ? (Number(topCategory.total || 0) / total) * 100 : 0;

    return (
        <motion.div
            className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-black text-foreground">Kategori Pengeluaran</h3>
                    <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                        Terbesar: {topCategory.categoryName} • {topShare.toFixed(0)}%
                    </p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-3 py-2 text-right text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Total</p>
                    <p className="text-sm font-black">{formatCurrency(total)}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-col items-center">
                <button
                    type="button"
                    onClick={() => onSelectCategory?.(topCategory)}
                    className="relative flex h-44 w-44 items-center justify-center rounded-full bg-slate-50 p-2 transition-transform hover:scale-[1.02] dark:bg-slate-900"
                    aria-label={`Filter kategori ${topCategory.categoryName}`}
                >
                    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                        <PieChart>
                            <Pie
                                data={topCategories}
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={76}
                                paddingAngle={3}
                                cornerRadius={8}
                                dataKey="total"
                                stroke="none"
                                onClick={(_, index) => {
                                    const selected = topCategories[index];
                                    if (selected) onSelectCategory?.(selected);
                                }}
                            >
                                {topCategories.map((_, index) => (
                                    <Cell key={`category-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: unknown) => formatCurrency(Number(value || 0))} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute max-w-[6rem] text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Top</p>
                        <p className="truncate text-xs font-black text-foreground">{topCategory.categoryName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{topShare.toFixed(0)}%</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setShowDetails((value) => !value)}
                    className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-foreground transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                    {showDetails ? "Sembunyikan detail" : "Detail pengeluaran"}
                </button>
            </div>

            {showDetails && (
                <motion.div
                    className="mt-4 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                >
                    {topCategories.map((item, index) => {
                        const percentage = total > 0 ? (Number(item.total || 0) / total) * 100 : 0;
                        const color = COLORS[index % COLORS.length];

                        return (
                            <button
                                key={item.categoryId}
                                type="button"
                                onClick={() => onSelectCategory?.(item)}
                                className="group grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="truncate text-sm font-bold text-foreground">{item.categoryName}</span>
                                </div>
                                <span className="whitespace-nowrap text-xs font-black text-foreground">{formatCurrency(item.total)}</span>
                                <span className="w-9 text-right text-[11px] font-black text-muted-foreground">{percentage.toFixed(0)}%</span>
                                <div className="col-span-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                        style={{ width: `${percentage}%`, backgroundColor: color }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </motion.div>
            )}
        </motion.div>
    );
}

export function IncomeExpenseComparison({ monthlyData }: { monthlyData: MonthlyStat[] }) {
    const data = useMemo(() => {
        return monthlyData.slice(-6).map(month => ({
            name: month.monthName || String(month.month).padStart(2, "0"),
            income: month.income,
            expense: month.expense,
            balance: month.income - month.expense
        }));
    }, [monthlyData]);

    return (
        <motion.div className="card-clean p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                Tren 6 Bulan Terakhir
            </h3>
            <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={data} margin={{ top: 20, right: 16, left: 8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis
                        stroke="#64748b"
                        width={56}
                        tickFormatter={formatAxisCurrency}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                        formatter={(value: unknown) => formatCurrency(Number(value || 0))}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
                </ComposedChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

export function TopSpendingCategories({ categoryStats }: { categoryStats: ChartCategoryStat[] }) {
    const topCategories = useMemo(() => {
        return [...categoryStats].sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 5);
    }, [categoryStats]);

    return (
        <motion.div className="card-clean p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                Top 5 Kategori Pengeluaran
            </h3>
            <div className="space-y-4">
                {topCategories.map((cat, idx) => (
                    <div key={cat.categoryId} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs text-white" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                            {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-foreground truncate">{cat.categoryName}</span>
                                <span className="text-sm font-bold text-foreground">{formatCurrency(cat.total)}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        backgroundColor: COLORS[idx % COLORS.length],
                                        width: `${topCategories[0]?.total ? (cat.total / topCategories[0].total) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}

interface MonthOverMonthGrowthProps {
    income: number;
    expense: number;
    prevIncome: number;
    prevExpense: number;
}

export function MonthOverMonthGrowth({ income, expense, prevIncome, prevExpense }: MonthOverMonthGrowthProps) {
    const incomeGrowth = prevIncome ? ((income - prevIncome) / prevIncome) * 100 : 0;
    const expenseGrowth = prevExpense ? ((expense - prevExpense) / prevExpense) * 100 : 0;

    return (
        <div className="grid grid-cols-2 gap-4">
            <motion.div className="card-clean p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                        <ArrowUpRight className="text-emerald-600 dark:text-emerald-400" size={16} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase">Pemasukan</p>
                        <p className="text-sm font-black text-foreground">{formatCurrency(income)}</p>
                    </div>
                </div>
                <div className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full w-fit",
                    incomeGrowth >= 0
                        ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                )}>
                    {incomeGrowth >= 0 ? "↗" : "↘"} {Math.abs(incomeGrowth).toFixed(1)}%
                </div>
            </motion.div>

            <motion.div className="card-clean p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/20 rounded-lg">
                        <ArrowDownLeft className="text-rose-600 dark:text-rose-400" size={16} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase">Pengeluaran</p>
                        <p className="text-sm font-black text-foreground">{formatCurrency(expense)}</p>
                    </div>
                </div>
                <div className={cn(
                    "text-xs font-bold px-2 py-1 rounded-full w-fit",
                    expenseGrowth <= 0
                        ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                )}>
                    {expenseGrowth <= 0 ? "↘" : "↗"} {Math.abs(expenseGrowth).toFixed(1)}%
                </div>
            </motion.div>
        </div>
    );
}

interface RecommendationItem {
    icon: React.ReactNode;
    color: string;
    title: string;
    description: string;
}

export function SmartRecommendations({ data }: { data: RecommendationData }) {
    const recommendations: RecommendationItem[] = [];

    // Check if spending is too high
    if (data.expense > data.income * 0.8) {
        recommendations.push({
            icon: <AlertTriangle size={16} />,
            color: "bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
            title: "Pengeluaran Tinggi",
            description: "Pengeluaranmu melebihi 80% pemasukan. Pertimbangkan untuk mengurangi pengeluaran tak perlu."
        });
    }

    // Check savings
    const savingsRate = data.income > 0 ? ((data.income - data.expense) / data.income) * 100 : 0;
    if (savingsRate > 30) {
        recommendations.push({
            icon: <Award size={16} />,
            color: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
            title: "Penghematan Bagus",
            description: `Tingkat penghematan ${savingsRate.toFixed(0)}% - Lanjutkan momentum ini! 🎉`
        });
    }

    // Check category with highest spending
    if (data.topCategory) {
        recommendations.push({
            icon: <Target size={16} />,
            color: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
            title: "Kategori Terbesar",
            description: `${data.topCategory.categoryName} adalah pengeluaran terbesarmu (${formatCurrency(data.topCategory.total)})`
        });
    }

    if (recommendations.length === 0) {
        recommendations.push({
            icon: <Zap size={16} />,
            color: "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
            title: "Status Bagus",
            description: "Keuanganmu dalam kondisi stabil. Terus pertahankan kebiasaan yang baik!"
        });
    }

    return (
        <div className="space-y-3">
            {recommendations.map((rec, idx) => (
                <motion.div
                    key={idx}
                    className="card-clean p-4 flex gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                >
                    <div className={cn("p-2 rounded-lg flex-shrink-0", rec.color)}>
                        {rec.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-foreground mb-0.5">{rec.title}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{rec.description}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function IncomeSourceBreakdown({
    incomeData,
    onSelectIncome,
}: {
    incomeData: IncomeStat[];
    onSelectIncome?: (income: IncomeStat) => void;
}) {
    const meaningfulIncome = useMemo(() => {
        return (incomeData || [])
            .filter((item) => Number(item.total || 0) > 0)
            .sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
    }, [incomeData]);

    if (meaningfulIncome.length <= 1) return null;

    const totalIncome = meaningfulIncome.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const topIncome = meaningfulIncome[0];
    const topShare = totalIncome > 0 ? (Number(topIncome.total || 0) / totalIncome) * 100 : 0;
    const colors = ["#0f766e", "#d97706", "#0284c7", "#ea580c", "#16a34a", "#be123c"];

    return (
        <motion.div
            className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        <WalletCards size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-foreground">Sumber Pemasukan</h3>
                        <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                            {meaningfulIncome.length} sumber • {topIncome.name} {topShare.toFixed(0)}%
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="text-sm font-black text-foreground">{formatCurrency(totalIncome)}</p>
                </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                {meaningfulIncome.map((item, index) => {
                    const percentage = totalIncome > 0 ? (Number(item.total || 0) / totalIncome) * 100 : 0;
                    const color = colors[index % colors.length];

                    return (
                        <button
                            key={`${item.categoryId || item.name}-${item.total}`}
                            type="button"
                            onClick={() => onSelectIncome?.(item)}
                            className="group block w-full border-b border-slate-100 bg-white px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/70"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="truncate text-sm font-bold text-foreground">{item.name}</span>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <span className="text-xs font-black text-foreground">{formatCurrency(item.total)}</span>
                                    <span className="w-9 text-right text-[11px] font-black text-muted-foreground">{percentage.toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                    style={{ width: `${percentage}%`, backgroundColor: color }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
