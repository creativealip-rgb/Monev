"use client";

import { useMemo } from "react";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart
} from "recharts";
import { AlertTriangle, Target, Zap, Award, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
    if (!categoryStats || categoryStats.length === 0) return null;

    return (
        <motion.div className="card-clean p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                Kategori Pengeluaran
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => String((entry as Partial<ChartCategoryStat>).categoryName ?? "")}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total"
                        onClick={(_, index) => {
                            const selected = categoryStats[index];
                            if (selected && onSelectCategory) {
                                onSelectCategory(selected);
                            }
                        }}
                    >
                        {categoryStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: unknown) => formatCurrency(Number(value || 0))} />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-3 mt-6">
                {categoryStats.slice(0, 4).map((item, idx) => (
                    <button
                        key={item.categoryId}
                        type="button"
                        onClick={() => onSelectCategory?.(item)}
                        className="flex w-full items-center gap-2 text-left"
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-xs text-muted-foreground truncate">{item.categoryName}</span>
                        <span className="text-xs font-bold text-foreground ml-auto">{formatCurrency(item.total)}</span>
                    </button>
                ))}
            </div>
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
    if (!incomeData || incomeData.length === 0) return null;

    return (
        <motion.div className="card-clean p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                Sumber Pemasukan
            </h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={incomeData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis
                        stroke="#64748b"
                        width={56}
                        tickFormatter={formatAxisCurrency}
                    />
                    <Tooltip formatter={(value: unknown) => formatCurrency(Number(value || 0))} />
                    <Bar
                        dataKey="total"
                        fill="#10b981"
                        radius={[8, 8, 0, 0]}
                        onClick={(entry) => {
                            const payload = (entry as { payload?: IncomeStat } | undefined)?.payload;
                            if (payload && onSelectIncome) {
                                onSelectIncome(payload);
                            }
                        }}
                    />
                </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
                {incomeData.map((item) => (
                    <button
                        key={`${item.categoryId || item.name}-${item.total}`}
                        type="button"
                        onClick={() => onSelectIncome?.(item)}
                        className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                        <span className="text-xs font-bold text-foreground">{formatCurrency(item.total)}</span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
