"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FeatureItem } from "@/frontend/components/FeatureItem";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import {
    Sparkles,
    PieChart,
    PiggyBank,
    Receipt,
    TrendingUp,
    Crown,
    Bell,
    User,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    X,
    Coins,
    CreditCard
} from "lucide-react";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency } from "@/frontend/lib/utils";
import Link from "next/link";
import { fetchProfileData } from "@/app/(protected)/profile/actions";
import { cn } from "@/frontend/lib/utils";

interface Transaction {
    id: string;
    amount: number;
    description: string;
    category: string;
    type: "expense" | "income";
    created_at: string;
    is_verified: boolean;
}

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

const mainFeatures = [
    { label: "Monev AI", icon: <Sparkles size={24} />, color: "purple", href: "/chat" },
    { label: "Analisa", icon: <PieChart size={24} />, color: "blue", href: "/analytics" },
    { label: "Anggaran", icon: <Wallet size={24} />, color: "orange", href: "/budgets" },
    { label: "Tabungan", icon: <PiggyBank size={24} />, color: "emerald", href: "/savings" },
    { label: "Tagihan", icon: <Receipt size={24} />, color: "rose", href: "/bills" },
    { label: "Investasi", icon: <TrendingUp size={24} />, color: "amber", href: "/investments" },
];

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

export default function Home() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<{ income: number; expense: number; balance: number; growth?: number; totalGoals?: number; totalInvestments?: number }>({ income: 0, expense: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [userName, setUserName] = useState("Pengguna");
    const [showBalanceDetail, setShowBalanceDetail] = useState(false);

    const today = new Date();
    const formattedDate = mounted ? format(today, "EEEE, d MMMM yyyy", { locale: id }) : "";

    useEffect(() => {
        setMounted(true);
        async function loadData() {
            try {
                // Get current month for stats
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();

                // Fetch all data in parallel for better performance
                const [
                    profileData,
                    statsResponse,
                    transResponse,
                    catsResponse
                ] = await Promise.all([
                    fetchProfileData(),
                    fetch(`/api/stats?year=${currentYear}&month=${currentMonth}`),
                    fetch("/api/transactions"),
                    fetch("/api/categories")
                ]);

                // Process profile data
                if (profileData?.user) {
                    const fullName = `${profileData.user.firstName || ""} ${profileData.user.lastName || ""}`.trim();
                    setUserName(fullName || "Pengguna");
                }

                // Process stats
                const statsResult = await statsResponse.json();
                if (statsResult.success) {
                    setStats(statsResult.data);
                }

                // Process transactions and categories
                const [transResult, catsResult] = await Promise.all([
                    transResponse.json(),
                    catsResponse.json()
                ]);

                if (transResult.success) {
                    const categories: Category[] = catsResult.success ? catsResult.data : [];

                    // Map transactions with category names
                    const mappedTransactions = transResult.data.slice(0, 5).map((t: {
                        id: number;
                        amount: number;
                        description: string;
                        categoryId: number;
                        type: "expense" | "income";
                        date: string;
                        isVerified: boolean;
                    }) => ({
                        id: t.id.toString(),
                        amount: t.amount,
                        description: t.description,
                        category: categories.find((c: Category) => c.id === t.categoryId)?.name || "Lainnya",
                        type: t.type,
                        created_at: t.date,
                        is_verified: t.isVerified,
                    }));

                    setTransactions(mappedTransactions);
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();

        // Listen for transaction added event
        const handleTransactionAdded = () => {
            loadData();
        };
        window.addEventListener("transactionAdded", handleTransactionAdded);

        return () => {
            window.removeEventListener("transactionAdded", handleTransactionAdded);
        };
    }, []);

    return (
        <div className="relative min-h-screen pb-24">
            {/* Header */}
            <header className="px-6 pt-12 pb-6">
                <div className="flex items-center justify-between">
                    <Link href="/profile" className="flex items-center gap-4 group active:scale-95 transition-transform">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 p-[2px] shadow-lg shadow-blue-600/10"
                        >
                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                {userName === "Pengguna" ? (
                                    <User size={24} className="text-blue-600" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-50 flex items-center justify-center text-xl font-bold text-blue-700">
                                        {userName.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">{formattedDate}</p>
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                                Hello, {userName.split(" ")[0]}! 👋
                            </h1>
                        </div>
                    </Link>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        className="relative w-12 h-12 rounded-full glass-card flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                        <Bell size={22} strokeWidth={2.5} />
                        <span className="absolute top-3 right-3.5 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse" />
                    </motion.button>
                </div>
            </header>

            {/* Balance Card */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="px-6 mb-8"
            >
                <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-2xl shadow-indigo-500/10 border border-white/10 text-white p-6">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-2xl -ml-10 -mb-10 opacity-50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 opacity-30" />

                    <div
                        className="relative z-10 cursor-pointer group"
                        onClick={() => setShowBalanceDetail(true)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <p className="text-slate-300 text-xs font-medium group-hover:text-white transition-colors">Total Balance</p>
                                <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-full",
                                (stats.growth || 0) >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                            )}>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    (stats.growth || 0) >= 0 ? "bg-emerald-400" : "bg-rose-400"
                                )} />
                                <span className={cn(
                                    "text-[10px] font-semibold",
                                    (stats.growth || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {(stats.growth || 0) >= 0 ? "+" : ""}{(stats.growth || 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <h2 className="text-3xl font-semibold tracking-tight mb-8 group-hover:scale-[1.02] transition-transform origin-left tabular-nums">
                            {loading ? "Loading..." : formatCurrency(stats.balance + (stats.totalGoals || 0) + (stats.totalInvestments || 0))}
                        </h2>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <ArrowUpRight size={14} className="text-emerald-400" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Income</p>
                            </div>
                            <p className="font-semibold text-sm text-emerald-400 tabular-nums">
                                + {loading ? "..." : formatCurrency(stats.income).replace("Rp", "")}
                            </p>
                        </div>

                        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                    <ArrowDownRight size={14} className="text-rose-400" />
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expense</p>
                            </div>
                            <p className="font-semibold text-sm text-rose-400 tabular-nums">
                                − {loading ? "..." : formatCurrency(stats.expense).replace("Rp", "")}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Features Grid */}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="px-6 mb-8"
            >
                <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-slate-900">Fitur Andalan</h2>
                    <Link href="/fitur" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                        Lihat Semua
                        <ChevronRight size={14} />
                    </Link>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-3 gap-y-8 gap-x-4 justify-items-center"
                >
                    {mainFeatures.map((feature) => (
                        <Link key={feature.label} href={feature.href}>
                            <FeatureItem
                                label={feature.label}
                                icon={feature.icon}
                                color={feature.color}
                            />
                        </Link>
                    ))}
                </motion.div>
            </motion.section>

            {/* Recent Transactions */}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="px-6"
            >
                <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-slate-900">Riwayat Terbaru</h2>
                    <Link href="/transactions" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                        Lihat Semua
                    </Link>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-3">
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-28 bg-slate-100 rounded-full" />
                                            <div className="h-3 w-16 bg-slate-50 rounded-full" />
                                        </div>
                                        <div className="h-5 w-20 bg-slate-100 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 glass-card border-dashed border-slate-300/50">
                            <p className="text-slate-500 font-bold">Belum ada transaksi</p>
                            <p className="text-xs text-slate-400 mt-1">Transaksi akan muncul di sini</p>
                        </div>
                    ) : (
                        transactions.map((t) => (
                            <TransactionItem key={t.id} transaction={t} />
                        ))
                    )}
                </motion.div>
            </motion.section>



            {/* Balance Detail Modal */}
            {showBalanceDetail && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
                        onClick={() => setShowBalanceDetail(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-[92%] max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl overflow-hidden z-10 shadow-slate-200/50"
                    >
                        {/* Clean Backdrop Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 to-white/10 pointer-events-none" />

                        {/* Modal Header & Close */}
                        <div className="flex justify-end mb-2 relative z-10">
                            <button
                                onClick={() => setShowBalanceDetail(false)}
                                className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="text-center mb-6 relative z-10">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Total Net Worth</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                                {formatCurrency(stats.balance + (stats.totalGoals || 0) + (stats.totalInvestments || 0))}
                            </h3>
                        </div>

                        {/* Distribution Bar */}
                        <div className="mb-8 relative z-10 px-1">
                            <div className="w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden ring-4 ring-slate-50">
                                {(() => {
                                    const total = stats.balance + (stats.totalGoals || 0) + (stats.totalInvestments || 0);
                                    if (total <= 0) return <div className="w-full bg-slate-200/50 h-full" />;
                                    const p1 = (stats.balance / total) * 100;
                                    const p2 = ((stats.totalGoals || 0) / total) * 100;
                                    const p3 = ((stats.totalInvestments || 0) / total) * 100;
                                    return (
                                        <>
                                            <div className="h-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.3)]" style={{ width: `${p1}%` }} />
                                            <div className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" style={{ width: `${p2}%` }} />
                                            <div className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]" style={{ width: `${p3}%` }} />
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Minimalist Breakdown List */}
                        <div className="space-y-7 relative z-10 px-2">
                            {/* Saldo Aktif */}
                            <div className="flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-4 h-4 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] border-2 border-white" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Saldo Aktif</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Liquid assets</p>
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-slate-800 tabular-nums">
                                    {formatCurrency(stats.balance)}
                                </p>
                            </div>

                            {/* Tabungan Goals */}
                            <div className="flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-white" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tabungan Goals</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Future plans</p>
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-slate-800 tabular-nums">
                                    {formatCurrency(stats.totalGoals || 0)}
                                </p>
                            </div>

                            {/* Investasi */}
                            <div className="flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] border-2 border-white" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Investasi</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Growth assets</p>
                                    </div>
                                </div>
                                <p className="text-base font-bold text-slate-900 tabular-nums">
                                    {formatCurrency(stats.totalInvestments || 0)}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

        </div>
    );
}
