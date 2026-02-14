"use client";

import { useState, useEffect } from "react";
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
    ArrowDownRight
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency } from "@/frontend/lib/utils";
import Link from "next/link";

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
    { label: "Tabungan", icon: <PiggyBank size={24} />, color: "emerald", href: "/budgets" },
    { label: "Tagihan", icon: <Receipt size={24} />, color: "rose", href: "#" },
    { label: "Investasi", icon: <TrendingUp size={24} />, color: "amber", href: "#" },
    { label: "Upgrade", icon: <Crown size={24} />, color: "indigo", href: "#" },
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
    const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const today = new Date();
    const formattedDate = mounted ? format(today, "EEEE, d MMMM yyyy", { locale: id }) : "";

    useEffect(() => {
        setMounted(true);
        async function loadData() {
            try {
                // Get current month stats
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();

                const statsResponse = await fetch(`/api/stats?year=${currentYear}&month=${currentMonth}`);
                const statsResult = await statsResponse.json();
                if (statsResult.success) {
                    setStats(statsResult.data);
                }

                // Get recent transactions
                const transResponse = await fetch("/api/transactions");
                const transResult = await transResponse.json();

                if (transResult.success) {
                    // Get categories for lookup
                    const catsResponse = await fetch("/api/categories");
                    const catsResult = await catsResponse.json();
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
        <div className="relative min-h-screen pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-12 pb-4"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 overflow-hidden flex items-center justify-center shadow-lg shadow-blue-600/25"
                        >
                            <User size={22} className="text-white" />
                        </motion.div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{formattedDate}</p>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Mochamad Alif Prayogo</h1>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all"
                    >
                        <Bell size={20} />
                    </motion.button>
                </div>
            </motion.header>

            {/* Balance Card */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="px-6 mb-8"
            >
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-6 shadow-2xl shadow-slate-900/20">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-slate-300 text-xs font-medium">Total Balance</p>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="text-[10px] font-semibold text-emerald-400">+12.5%</span>
                            </div>
                        </div>

                        <h2 className="text-4xl font-bold tracking-tight mb-8">
                            {loading ? "Loading..." : formatCurrency(stats.balance)}
                        </h2>

                        <div className="flex gap-3">
                            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <ArrowUpRight size={14} className="text-emerald-400" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Income</p>
                                </div>
                                <p className="font-bold text-sm text-emerald-400">
                                    + {loading ? "..." : formatCurrency(stats.income).replace("Rp", "")}
                                </p>
                            </div>

                            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                                        <ArrowDownRight size={14} className="text-rose-400" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expense</p>
                                </div>
                                <p className="font-bold text-sm text-rose-400">
                                    − {loading ? "..." : formatCurrency(stats.expense).replace("Rp", "")}
                                </p>
                            </div>
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
                        <p className="text-center text-slate-500 py-4">Loading...</p>
                    ) : transactions.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">Belum ada transaksi</p>
                    ) : (
                        transactions.map((t) => (
                            <TransactionItem key={t.id} transaction={t} />
                        ))
                    )}
                </motion.div>
            </motion.section>
        </div>
    );
}
