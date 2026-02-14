"use client";

import { StatsCard } from "@/frontend/components/StatsCard";
import { ChevronLeft, TrendingUp, Wallet, PieChart, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { useEffect, useState } from "react";

interface Allocation {
    name: string;
    amount: number;
    percentage: number;
    target: number;
    color: string;
}

interface AnalysisData {
    income: number;
    expense: number;
    balance: number;
    allocations: Allocation[];
    categoryBreakdown: {
        expense: { name: string; amount: number; color: string; icon: string }[];
        income: { name: string; amount: number; color: string; icon: string }[];
    };
    insights?: string;
}

function AIInsights({ content }: { content: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-[2rem] p-[1.5px] bg-gradient-to-br from-blue-400 via-purple-400 to-rose-400 shadow-xl shadow-blue-500/10"
        >
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[1.95rem] p-6 h-full">
                <div className="absolute top-0 right-0 p-4">
                    <Sparkles size={24} className="text-blue-500/30 animate-pulse" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Sparkles size={18} className="text-blue-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Saran AI</h3>
                </div>

                <div className="relative">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {content || "Sedang menganalisa data kamu... ⏳"}
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Monev AI</span>
                    <Link href="/chat" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">
                        Tanya Lebih Lanjut →
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}

function CategoryPieChart({ data, title }: { data: { name: string; amount: number; color: string }[], title: string }) {
    const total = data.reduce((sum, item) => sum + item.amount, 0);
    let cumulativePercent = 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-blue-500/5 mt-4"
        >
            <h3 className="text-center font-bold text-slate-900 mb-6">{title}</h3>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* SVG Donut */}
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {data.map((item, i) => {
                            const percent = (item.amount / total) * 100;
                            const startPercent = cumulativePercent;
                            cumulativePercent += percent;

                            const x1 = Math.cos(2 * Math.PI * (startPercent / 100));
                            const y1 = Math.sin(2 * Math.PI * (startPercent / 100));
                            const x2 = Math.cos(2 * Math.PI * (cumulativePercent / 100));
                            const y2 = Math.sin(2 * Math.PI * (cumulativePercent / 100));

                            const largeArcFlag = percent > 50 ? 1 : 0;
                            const pathData = `M 50 50 L ${50 + 40 * x1} ${50 + 40 * y1} A 40 40 0 ${largeArcFlag} 1 ${50 + 40 * x2} ${50 + 40 * y2} Z`;

                            return (
                                <motion.path
                                    key={i}
                                    d={pathData}
                                    fill={item.color}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                                />
                            );
                        })}
                        {/* Inner Hole */}
                        <circle cx="50" cy="50" r="25" fill="white" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                        <span className="text-sm font-bold text-slate-900">{formatRp(total).replace(",00", "").replace("Rp", "")}</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2 w-full">
                    {data.sort((a, b) => b.amount - a.amount).map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-900">{Math.round((item.amount / total) * 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

function formatRp(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

const iconMap: Record<string, any> = {
    "Kebutuhan": TrendingUp,
    "Keinginan": ArrowUpRight,
    "Tabungan": Wallet
};

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewType, setViewType] = useState<"expense" | "income" | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/analytics");
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 pb-28">
                {/* Header skeleton */}
                <div className="sticky top-0 z-40 glass border-b border-slate-200/50">
                    <div className="flex items-center gap-3 px-6 py-4 pt-12">
                        <div className="w-10 h-10 rounded-xl bg-slate-100" />
                        <div className="h-6 w-20 bg-slate-200 rounded-full" />
                    </div>
                </div>

                <div className="px-6 pt-6 space-y-6 animate-pulse">
                    {/* Stats cards skeleton */}
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100">
                                <div className="h-3 w-14 bg-slate-100 rounded-full mb-2" />
                                <div className="h-5 w-full bg-slate-100 rounded-full" />
                            </div>
                        ))}
                    </div>

                    {/* Allocation bars skeleton */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                        <div className="h-4 w-32 bg-slate-100 rounded-full mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i}>
                                    <div className="flex justify-between mb-2">
                                        <div className="h-3 w-20 bg-slate-100 rounded-full" />
                                        <div className="h-3 w-16 bg-slate-100 rounded-full" />
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart skeleton */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                        <div className="h-4 w-40 bg-slate-100 rounded-full mx-auto mb-6" />
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-48 h-48 rounded-full bg-slate-100" />
                            <div className="w-full space-y-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-slate-100" />
                                            <div className="h-3 w-20 bg-slate-100 rounded-full" />
                                        </div>
                                        <div className="h-3 w-8 bg-slate-100 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI Insights skeleton */}
                    <div className="rounded-[2rem] p-6 border border-slate-100 bg-white">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-100" />
                            <div className="h-4 w-16 bg-slate-100 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-slate-50 rounded-full" />
                            <div className="h-3 w-4/5 bg-slate-50 rounded-full" />
                            <div className="h-3 w-3/5 bg-slate-50 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 font-medium">Gagal memuat data analitik. 😅</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-50 pb-28">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-40 glass border-b border-slate-200/50"
            >
                <div className="flex items-center gap-3 px-6 py-4 pt-12">
                    <Link
                        href="/"
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analitik</h1>
                </div>
            </motion.header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 pt-6 space-y-6"
            >
                {/* Stats Card */}
                <motion.div variants={itemVariants}>
                    <StatsCard
                        label="Total Tabungan & Sisa Saldo"
                        amount={data.allocations.find(a => a.name === "Tabungan")?.amount || 0}
                        type="income"
                        trend={0}
                    />
                </motion.div>

                {/* Summary Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white shadow-2xl shadow-slate-900/20"
                >
                    <h3 className="font-semibold text-xs mb-4 text-slate-400 uppercase tracking-widest">Ringkasan Bulan Ini</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewType(viewType === "income" ? null : "income")}
                            className={cn(
                                "rounded-2xl p-4 transition-all border",
                                viewType === "income" ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total Pemasukan</p>
                            <p className="font-bold text-emerald-400 text-lg">{formatRp(data.income).replace(",00", "")}</p>
                            <div className="mt-2 text-[10px] text-slate-500 font-medium">Klik untuk rincian</div>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setViewType(viewType === "expense" ? null : "expense")}
                            className={cn(
                                "rounded-2xl p-4 transition-all border",
                                viewType === "expense" ? "bg-rose-500/20 border-rose-500/50" : "bg-white/5 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total Pengeluaran</p>
                            <p className="font-bold text-rose-400 text-lg">{formatRp(data.expense).replace(",00", "")}</p>
                            <div className="mt-2 text-[10px] text-slate-500 font-medium">Klik untuk rincian</div>
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {viewType && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <CategoryPieChart
                                    title={viewType === "income" ? "Rincian Pemasukan" : "Rincian Pengeluaran"}
                                    data={viewType === "income" ? data.categoryBreakdown.income : data.categoryBreakdown.expense}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* AI Insights Section */}
                {data.insights && (
                    <motion.div variants={itemVariants}>
                        <AIInsights content={data.insights} />
                    </motion.div>
                )}

                {/* Monthly Overview */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-900">Alokasi Dana (Rule 50/30/20)</h2>
                        <button className="text-xs font-semibold text-blue-600">Ideal vs Aktual</button>
                    </div>

                    <div className="space-y-3">
                        {data.allocations.map((item, index) => {
                            const Icon = iconMap[item.name] || PieChart;
                            const colors: Record<string, { bg: string; text: string; bar: string }> = {
                                orange: { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-500" },
                                blue: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
                                rose: { bg: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500" },
                            };
                            const color = colors[item.color] || colors.blue;
                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm card-lift"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color.bg, color.text)}>
                                            <Icon size={24} strokeWidth={2} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold text-slate-800 text-sm">{item.name}</h3>
                                                <span className={cn("font-bold text-sm", color.text)}>
                                                    {item.percentage}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, item.percentage)}%` }}
                                                    transition={{ duration: 1, delay: index * 0.15 }}
                                                    className={cn("h-full rounded-full", color.bar)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400">
                                                    Target Ideal: {item.target}%
                                                </span>
                                                <span className="text-xs font-medium text-slate-600">
                                                    {formatRp(item.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}
