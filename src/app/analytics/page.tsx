"use client";

import { StatsCard } from "@/frontend/components/StatsCard";
import { ChevronLeft, TrendingUp, Wallet, PieChart, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

const allocations = [
    { 
        name: "Kebutuhan", 
        percentage: 42, 
        target: 50,
        icon: TrendingUp,
        color: "orange",
        amount: 5250000
    },
    { 
        name: "Tabungan", 
        percentage: 25, 
        target: 20,
        icon: Wallet,
        color: "blue",
        amount: 3125000
    },
    { 
        name: "Investasi", 
        percentage: 18, 
        target: 20,
        icon: PieChart,
        color: "purple",
        amount: 2250000
    },
    { 
        name: "Hiburan", 
        percentage: 15, 
        target: 10,
        icon: ArrowUpRight,
        color: "rose",
        amount: 1875000
    },
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

function formatRp(amount: number) {
    return new Intl.NumberFormat("id-ID", { 
        style: "currency", 
        currency: "IDR", 
        maximumFractionDigits: 0 
    }).format(amount);
}

export default function AnalyticsPage() {
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
                        label="Tabungan Bulan Ini" 
                        amount={8250000} 
                        type="income" 
                        trend={15}
                    />
                </motion.div>

                {/* Monthly Overview */}
                <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-slate-900">Alokasi Dana</h2>
                        <button className="text-xs font-semibold text-blue-600">Lihat Detail</button>
                    </div>

                    <div className="space-y-3">
                        {allocations.map((item, index) => {
                            const Icon = item.icon;
                            const colors: Record<string, { bg: string; text: string; bar: string }> = {
                                orange: { bg: "bg-orange-50", text: "text-orange-600", bar: "bg-orange-500" },
                                blue: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
                                purple: { bg: "bg-purple-50", text: "text-purple-600", bar: "bg-purple-500" },
                                rose: { bg: "bg-rose-50", text: "text-rose-600", bar: "bg-rose-500" },
                            };
                            const color = colors[item.color];
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
                                                    animate={{ width: `${item.percentage}%` }}
                                                    transition={{ duration: 1, delay: index * 0.15 }}
                                                    className={cn("h-full rounded-full", color.bar)}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-400">
                                                    Target: {item.target}%
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

                {/* Summary Card */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white"
                >
                    <h3 className="font-semibold text-sm mb-3 text-slate-300">Ringkasan Bulan Ini</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Pemasukan</p>
                            <p className="font-bold text-emerald-400">Rp 12.5jt</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Pengeluaran</p>
                            <p className="font-bold text-rose-400">Rp 4.2jt</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
