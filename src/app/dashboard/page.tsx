"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    PiggyBank, 
    Plus, 
    Receipt,
    ArrowRight,
    Target,
    Sparkles
} from "lucide-react";
import { formatCurrency, formatDate } from "@/frontend/lib/utils";
import { TransactionForm } from "@/frontend/components/TransactionForm";

interface DashboardStats {
    monthlyStats: {
        income: number;
        expense: number;
        balance: number;
    };
    categoryStats: Array<{
        categoryId: number;
        categoryName: string;
        color: string;
        total: number;
    }>;
    goals: {
        total: number;
        completed: number;
        inProgress: number;
        list: Array<{
            id: number;
            name: string;
            targetAmount: number;
            currentAmount: number;
            icon: string;
            color: string;
        }>;
    };
    recentTransactions: Array<{
        id: number;
        amount: number;
        description: string;
        type: "income" | "expense";
        date: string;
        categoryName: string;
        categoryColor: string;
    }>;
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

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            setLoading(true);
            
            // Get current month and year
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            // Fetch dashboard stats
            const response = await fetch(`/api/dashboard?year=${year}&month=${month}`);
            const dashboardData = await response.json();

            // Fetch recent transactions
            const transResponse = await fetch("/api/transactions");
            const transData = await transResponse.json();

            // Fetch categories for mapping
            const catsResponse = await fetch("/api/categories");
            const catsData = await catsResponse.json();

            if (dashboardData && transData.success && catsData.success) {
                const categories = catsData.data;
                
                // Map recent transactions with category info
                const recentTrans = transData.data.slice(0, 5).map((t: {
                    id: number;
                    amount: number;
                    description: string;
                    type: "income" | "expense";
                    date: string;
                    categoryId: number;
                }) => {
                    const category = categories.find((c: { id: number; name: string; color: string }) => c.id === t.categoryId);
                    return {
                        ...t,
                        categoryName: category?.name || "Lainnya",
                        categoryColor: category?.color || "#6b7280",
                    };
                });

                setStats({
                    ...dashboardData,
                    recentTransactions: recentTrans,
                });
            }
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    function handleFormSuccess() {
        loadDashboardData();
    }

    const currentMonth = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-slate-500 mt-4">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    const monthly = stats?.monthlyStats || { income: 0, expense: 0, balance: 0 };
    const recentTransactions = stats?.recentTransactions || [];
    const goals = stats?.goals?.list?.slice(0, 2) || [];

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white px-6 pt-12 pb-8"
            >
                <div className="max-w-md mx-auto">
                    <p className="text-emerald-100 text-sm">Selamat datang kembali 👋</p>
                    <h1 className="text-2xl font-bold mt-1">Dashboard Keuangan</h1>
                    <p className="text-emerald-100 text-sm mt-1">{currentMonth}</p>
                </div>
            </motion.header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-md mx-auto px-6 -mt-6"
            >
                {/* Total Balance Card */}
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-emerald-600" />
                                </div>
                                <span className="text-slate-600 font-medium">Total Saldo</span>
                            </div>
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                                monthly.balance >= 0 
                                    ? "bg-emerald-100 text-emerald-700" 
                                    : "bg-rose-100 text-rose-700"
                            }`}>
                                {monthly.balance >= 0 ? "Sehat" : "Defisit"}
                            </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900">
                            {formatCurrency(monthly.balance)}
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-emerald-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs text-emerald-600 font-medium">Pemasukan</span>
                                </div>
                                <p className="text-lg font-bold text-emerald-700">{formatCurrency(monthly.income)}</p>
                            </div>
                            
                            <div className="bg-rose-50 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingDown className="w-4 h-4 text-rose-600" />
                                    <span className="text-xs text-rose-600 font-medium">Pengeluaran</span>
                                </div>
                                <p className="text-lg font-bold text-rose-700">{formatCurrency(monthly.expense)}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Monthly Summary */}
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900">Ringkasan Bulan Ini</h3>
                        <Link href="/analytics" className="text-sm text-emerald-600 hover:text-emerald-700">
                            Lihat Detail →
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600">Rasio Pengeluaran</span>
                                <span className="font-semibold text-slate-900">
                                    {monthly.income > 0 
                                        ? Math.round((monthly.expense / monthly.income) * 100) 
                                        : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div 
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                    style={{ 
                                        width: `${Math.min(
                                            monthly.income > 0 
                                                ? (monthly.expense / monthly.income) * 100 
                                                : 0, 
                                            100
                                        )}%` 
                                    }}
                                />
                            </div>
                            <p className="text-sm text-slate-500">
                                {monthly.balance > 0 
                                    ? `🎉 Kamu berhasil menabung ${formatCurrency(monthly.balance)} bulan ini!`
                                    : monthly.balance === 0
                                        ? "⚖️ Break-even - Pemasukan = Pengeluaran"
                                        : "⚠️ Pengeluaran melebihi pemasukan"
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div variants={itemVariants} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900">Transaksi Terbaru</h3>
                        <Link href="/transactions" className="text-sm text-emerald-600 hover:text-emerald-700">
                            Lihat Semua →
                        </Link>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {recentTransactions.length === 0 ? (
                            <div className="p-8 text-center">
                                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Belum ada transaksi</p>
                                <p className="text-sm text-slate-400 mt-1">Mulai catat transaksi pertamamu</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentTransactions.map((t) => (
                                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: `${t.categoryColor}20` }}
                                            >
                                                <span 
                                                    className="text-lg"
                                                    style={{ color: t.categoryColor }}
                                                >
                                                    {t.type === "income" ? "📈" : "📉"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{t.description}</p>
                                                <p className="text-sm text-slate-500">{t.categoryName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-semibold ${
                                                t.type === "income" ? "text-emerald-600" : "text-rose-600"
                                            }`}>
                                                {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                                            </p>
                                            <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Goals Preview */}
                {goals.length > 0 && (
                    <motion.div variants={itemVariants} className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-900">Goals Tabungan</h3>
                            <Link href="/budgets" className="text-sm text-emerald-600 hover:text-emerald-700">
                                Lihat Semua →
                            </Link>
                        </div>
                        
                        <div className="space-y-3">
                            {goals.map((goal) => {
                                const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                                return (
                                    <div key={goal.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div 
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: goal.color + "20" }}
                                            >
                                                <Target className="w-5 h-5" style={{ color: goal.color }} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{goal.name}</p>
                                                <p className="text-sm text-slate-500">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                                            </div>
                                            <span className="text-sm font-semibold" style={{ color: goal.color }}>{progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div 
                                                className="h-2 rounded-full transition-all duration-500"
                                                style={{ 
                                                    width: `${progress}%`,
                                                    backgroundColor: goal.color 
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Telegram Bot Promo */}
                <motion.div variants={itemVariants}>
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold mb-1">Telegram Bot Tersedia!</h4>
                                <p className="text-blue-100 text-sm mb-3">
                                    Catat transaksi langsung dari Telegram. Cukup kirim pesan ke bot!
                                </p>
                                <Link 
                                    href="/settings" 
                                    className="inline-flex items-center gap-1 text-sm font-medium text-white hover:text-blue-100"
                                >
                                    Setup Bot →
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFormOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/30 flex items-center justify-center"
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            {/* Transaction Form Modal */}
            <TransactionForm 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleFormSuccess}
            />
        </div>
    );
}
