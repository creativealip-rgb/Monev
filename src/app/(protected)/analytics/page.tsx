"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/frontend/lib/utils";
import {
    PieChart, Wallet, TrendingUp, AlertTriangle, ArrowRight,
    Target, CreditCard, Calendar, Activity, Zap, Brain,
    ChevronRight, Gauge, LayoutDashboard, History, Sparkles,
    ArrowLeft, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import Link from "next/link";
import { ErrorEmpty } from "@/frontend/components/EmptyState";
import { useSession } from "next-auth/react";
import { UserTier, hasFullAnalytics } from "@/lib/tier-gate";
import { useToast } from "@/frontend/components/UI";

// New Components
import { NetWorthCard } from "./components/NetWorthCard";
import { CalendarHeatmap } from "./components/CalendarHeatmap";
import { MonthComparison } from "./components/MonthComparison";
import { SpendingHeatmap } from "./components/SpendingHeatmap";
import { AnalyticsTabs } from "./components/AnalyticsTabs";

// Types
interface CategoryBreakdown {
    name: string;
    amount: number;
    color: string;
    icon: string;
}

interface Budget {
    id: number;
    amount: number;
    spent: number;
    category: {
        id: number;
        name: string;
        color: string;
        icon: string;
    };
}

interface DailyStat {
    date: string;
    count: number;
    total: number;
}

interface AnalyticsData {
    income: number;
    expense: number;
    balance: number;
    allocations: {
        name: string;
        amount: number;
        percentage: number;
        target: number;
        color: string;
    }[];
    categoryBreakdown: {
        expense: CategoryBreakdown[];
        income: CategoryBreakdown[];
    };
    healthScore: {
        totalScore: number;
        metrics: {
            savingsRate: { score: number; value: number; status: string };
            emergencyFund: { score: number; value: number; status: string };
            debtToIncome: { score: number; value: number; status: string };
            discretionarySpending: { score: number; value: number; status: string };
        };
        insights: string[];
    };
    cashflowPrediction: {
        nextMonth: number;
        trend: "up" | "down" | "stable";
        confidence: number;
    };
    budgets: Budget[];
    goalsProgress: any[]; // Extended as needed
    budgetAlerts: any[];
    financialHealth: any; // Legacy
    dailyStats: DailyStat[];
    totalInvestments: number;
    aiInsights: string[];
    monthlyComparison?: Array<{ month: string; income: number; expense: number }>;
    spendingPatterns?: { averageDailySpending: number; highestSpendingDay: string; anomalies: any[] };
}

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();
    // @ts-ignore
    const userTier = (session?.user?.tier as UserTier) || "miskin";
    const toast = useToast();
    const canSeeFullAnalytics = hasFullAnalytics(userTier);

    const tabs = [
        { id: "overview", label: "Ringkasan" },
        { id: "trends", label: "Tren", locked: !canSeeFullAnalytics },
        { id: "insights", label: "Insight", locked: !canSeeFullAnalytics }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/analytics?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
            if (!res.ok) throw new Error("Gagal memuat data");
            const jsonData = await res.json();
            setData(jsonData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (!data || error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <ErrorEmpty
                    title="Gagal memuat data"
                    description={error || "Data analitik tidak tersedia"}
                    onRetry={fetchData}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Standardized Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-safe pt-3 pb-4"
            >
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Statistik</h1>
                    </div>

                    {/* Month Selector Mini */}
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-2 py-1 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                            <ChevronRight className="rotate-180 w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <span className="text-[10px] font-bold px-2 min-w-[80px] text-center text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                            {currentDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    </div>
                </div>
            </motion.header>

            <div className="p-6 space-y-6">
                <NetWorthCard
                    balance={data.balance}
                    investments={data.totalInvestments || 0}
                    goals={data.goalsProgress?.reduce((acc: any, g: any) => acc + g.currentAmount, 0) || 0}
                />

                <div className="sticky top-20 z-30 -mx-6 px-6 py-2 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
                    <div className="flex gap-2 mb-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (tab.locked) {
                                        toast.error("Fitur Terkunci", "Upgrade ke Kaya atau Sultan untuk akses fitur ini! 🚀");
                                        return;
                                    }
                                    setActiveTab(tab.id);
                                }}
                                className={cn(
                                    "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                    activeTab === tab.id
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                        : "bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-800"
                                )}
                            >
                                {tab.label}
                                {tab.locked && <Lock size={10} className="opacity-60" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <motion.div
                className="p-6 space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={activeTab} // Animate on tab change
            >
                {activeTab === "overview" && <OverviewTab data={data} itemVariants={itemVariants} />}
                {activeTab === "trends" && <TrendsTab data={data} itemVariants={itemVariants} />}
                {activeTab === "insights" && <InsightsTab data={data} itemVariants={itemVariants} />}
            </motion.div>
        </div>
    );
}

// --- Sub-Components ---

function OverviewTab({ data, itemVariants }: { data: AnalyticsData, itemVariants: any }) {
    return (
        <div className="flex flex-col gap-6">
            {/* Financial Health & Monthly Stats */}
            <div className="grid grid-cols-2 gap-4">
                <FinancialHealthScore healthData={data.healthScore} />
                <div className="flex flex-col gap-4">
                    <StatsCard
                        title="Pemasukan"
                        value={data.income}
                        icon={<TrendingUp size={16} className="text-emerald-500" />}
                        subtitle="Bulan ini"
                        trend="up"
                    />
                    <StatsCard
                        title="Pengeluaran"
                        value={data.expense}
                        icon={<TrendingUp size={16} className="text-rose-500 rotate-180" />}
                        subtitle="Bulan ini"
                        trend="down"
                    />
                </div>
            </div>

            {/* Calendar Heatmap */}
            <CalendarHeatmap data={data.dailyStats} />

            {/* Budget Alerts */}
            {data.budgetAlerts && data.budgetAlerts.length > 0 && (
                <BudgetAlertsWidget alerts={data.budgetAlerts} />
            )}

            {/* Allocations (50/30/20) */}
            <motion.div variants={itemVariants} className="card-clean p-5">
                <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Alokasi Dana</h3>
                <div className="space-y-4">
                    {data.allocations.map((item) => (
                        <div key={item.name} className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-foreground">{item.name}</span>
                                <span className={cn(
                                    item.percentage > item.target ? "text-rose-500" : "text-emerald-500"
                                )}>{item.percentage}% / {item.target}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    className={cn("h-full rounded-full",
                                        item.color === "blue" && "bg-blue-500",
                                        item.color === "rose" && "bg-rose-500",
                                        item.color === "orange" && "bg-orange-500"
                                    )}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">{formatCurrency(item.amount)}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function TrendsTab({ data, itemVariants }: { data: AnalyticsData, itemVariants: any }) {
    // Get current and previous month from monthlyComparison
    const comparison = data.monthlyComparison || [];
    const currentMonth = comparison.length > 0 ? comparison[comparison.length - 1] : null;
    const previousMonth = comparison.length > 1 ? comparison[comparison.length - 2] : null;

    return (
        <div className="flex flex-col gap-6">
            {/* Month Comparison */}
            {currentMonth && previousMonth && (
                <motion.div variants={itemVariants}>
                    <MonthComparison
                        currentIncome={currentMonth.income}
                        currentExpense={currentMonth.expense}
                        previousIncome={previousMonth.income}
                        previousExpense={previousMonth.expense}
                        currentMonthLabel={currentMonth.month}
                        previousMonthLabel={previousMonth.month}
                    />
                </motion.div>
            )}

            {/* Spending Heatmap */}
            <motion.div variants={itemVariants}>
                <SpendingHeatmap data={data.dailyStats} />
            </motion.div>

            {/* Top Categories */}
            <motion.div variants={itemVariants} className="card-clean p-6">
                <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-6">Top Kategori Pengeluaran</h3>
                <div className="space-y-5">
                    {data.categoryBreakdown.expense.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-100 dark:border-slate-800">
                                    {cat.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">{cat.name}</p>
                                    <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 dark:bg-slate-50 rounded-full"
                                            style={{ width: `${(cat.amount / data.expense) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-foreground">{formatCurrency(cat.amount)}</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {Math.round((cat.amount / data.expense) * 100)}%
                                </p>
                            </div>
                        </div>
                    ))}
                    {data.categoryBreakdown.expense.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Belum ada data pengeluaran.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function InsightsTab({ data, itemVariants }: { data: AnalyticsData, itemVariants: any }) {
    return (
        <div className="flex flex-col gap-6">
            {/* AI Insights - New Section */}
            <motion.div variants={itemVariants} className="card-clean p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center gap-2 mb-4">
                    <Brain className="text-indigo-500" size={18} />
                    <h3 className="text-[13px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">AI Financial Insights</h3>
                </div>
                <div className="space-y-3">
                    {data.aiInsights && data.aiInsights.length > 0 ? (
                        data.aiInsights.map((insight, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-slate-500">Belum ada insight yang cukup untuk dianalisis.</p>
                    )}
                </div>
            </motion.div>

            {/* Cashflow Prediction */}
            <motion.div variants={itemVariants} className="card-clean p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Prediksi Cashflow</h3>
                        <p className="text-xs text-muted-foreground mt-1">Estimasi saldo akhir bulan depan</p>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black text-foreground">
                        {formatCurrency(data.cashflowPrediction.nextMonth)}
                    </span>
                    {data.cashflowPrediction.trend === 'up' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Naik ↗</span>}
                    {data.cashflowPrediction.trend === 'down' && <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">Turun ↘</span>}
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-slate-900 dark:bg-slate-400 rounded-full"
                            style={{ width: `${data.cashflowPrediction.confidence}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{data.cashflowPrediction.confidence}% confidence</span>
                </div>
            </motion.div>
        </div>
    );
}

// --- Helper Components ---
function FinancialHealthScore({ healthData }: { healthData: any }) {
    const score = healthData.totalScore;
    const getScoreInfo = (s: number) => {
        if (s >= 80) return { label: "Sangat Sehat", color: "emerald", emoji: "💪" };
        if (s >= 60) return { label: "Sehat", color: "green", emoji: "✅" };
        if (s >= 40) return { label: "Cukup", color: "yellow", emoji: "⚠️" };
        if (s >= 20) return { label: "Perlu Perhatian", color: "orange", emoji: "😰" };
        return { label: "Kritis", color: "red", emoji: "🚨" };
    };
    const info = getScoreInfo(score);
    const circumference = 2 * Math.PI * 30; // Reduced size slightly
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const colorClasses: Record<string, string> = {
        emerald: "stroke-emerald-500 text-emerald-600",
        green: "stroke-green-500 text-green-600",
        yellow: "stroke-yellow-500 text-yellow-600",
        orange: "stroke-orange-500 text-orange-600",
        red: "stroke-red-500 text-red-600"
    };

    return (
        <motion.div className="card-clean p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
                <Gauge size={16} className="text-slate-400" />
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Health Score</h3>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <span className={cn("text-xl font-black block", colorClasses[info.color].split(" ")[1])}>{score}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{info.label}</span>
                </div>
                <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                        <motion.circle
                            cx="50" cy="50" r="30"
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className={colorClasses[info.color].split(" ")[0]}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            style={{ strokeDasharray: circumference }}
                        />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
}

function StatsCard({ title, value, icon, subtitle, trend }: any) {
    return (
        <motion.div className="card-clean p-4 flex flex-col justify-center flex-1 cursor-pointer transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
            </div>
            <p className="text-lg font-black text-foreground">{formatCurrency(value)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
        </motion.div>
    );
}

function BudgetAlertsWidget({ alerts }: { alerts: any[] }) {
    if (!alerts || alerts.length === 0) return null;
    return (
        <div className="space-y-3">
            {alerts.map((alert, i) => (
                <motion.div key={i} className="card-clean p-4 flex items-start gap-3 bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/20">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full shrink-0">
                        <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-0.5">Over Budget: {alert.category}</h4>
                        <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                            Terpakai {formatCurrency(alert.spent)} dari budget {formatCurrency(alert.limit)}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
            <div className="sticky top-0 z-40 glass border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="px-6 py-4 pt-12 space-y-6">
                    <div className="flex justify-between">
                        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                    </div>
                    <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 rounded-[2rem] animate-pulse" />
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                </div>
            </div>
            <div className="p-6 space-y-6">
                <div className="h-64 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse" />
                <div className="h-40 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse" />
            </div>
        </div>
    );
}