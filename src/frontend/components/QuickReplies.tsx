"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Wallet, Target, Calculator } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface QuickReply {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    query: string;
}

interface QuickRepliesProps {
    onSelect: (query: string) => void;
    context?: "general" | "budget" | "transaction" | "goal" | "analysis";
}

const quickRepliesByContext: Record<string, QuickReply[]> = {
    general: [
        { id: "check_balance", label: "Cek Saldo", icon: Wallet, color: "emerald", query: "Berapa saldo saya sekarang?" },
        { id: "today_transactions", label: "Transaksi Hari Ini", icon: TrendingUp, color: "sky", query: "Ada transaksi apa hari ini?" },
        { id: "spending_analysis", label: "Analisis Pengeluaran", icon: Sparkles, color: "violet", query: "Analisis pengeluaran bulan ini" },
        { id: "budget_status", label: "Status Budget", icon: Target, color: "orange", query: "Bagaimana status budget saya?" },
    ],
    budget: [
        { id: "remaining_budget", label: "Sisa Budget", icon: Wallet, color: "emerald", query: "Berapa sisa budget minggu ini?" },
        { id: "overspending", label: "Cek Over Budget", icon: Target, color: "rose", query: "Kategori apa yang over budget?" },
        { id: "budget_tips", label: "Tips Hemat", icon: Sparkles, color: "amber", query: "Kasih tips hemat dong" },
    ],
    transaction: [
        { id: "record_transaction", label: "Catat Transaksi", icon: TrendingUp, color: "sky", query: "Saya mau catat transaksi" },
        { id: "view_history", label: "Lihat Riwayat", icon: Wallet, color: "violet", query: "Lihat riwayat transaksi" },
        { id: "categorize", label: "Kategori Transaksi", icon: Target, color: "emerald", query: "Kategori transaksi apa saja?" },
    ],
    goal: [
        { id: "goal_progress", label: "Progress Goal", icon: Target, color: "emerald", query: "Cek progress goal saya" },
        { id: "add_savings", label: "Tambah Tabungan", icon: Wallet, color: "sky", query: "Saya mau nabung" },
        { id: "goal_tips", label: "Tips Menabung", icon: Sparkles, color: "amber", query: "Tips mencapai goal lebih cepat" },
    ],
    analysis: [
        { id: "monthly_report", label: "Laporan Bulanan", icon: TrendingUp, color: "violet", query: "Laporan keuangan bulan ini" },
        { id: "top_spending", label: "Pengeluaran Terbesar", icon: Wallet, color: "rose", query: "Kategori pengeluaran terbesar?" },
        { id: "saving_potential", label: "Potensi Tabungan", icon: Calculator, color: "emerald", query: "Berapa potensi tabungan saya?" },
    ],
};

export function QuickReplies({ onSelect, context = "general" }: QuickRepliesProps) {
    const replies = quickRepliesByContext[context] || quickRepliesByContext.general;

    const colorClasses: Record<string, { bg: string; text: string; border: string; hover: string }> = {
        emerald: {
            bg: "bg-emerald-50 dark:bg-emerald-900/20",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-200 dark:border-emerald-800",
            hover: "hover:bg-emerald-100 dark:hover:bg-emerald-900/30",
        },
        sky: {
            bg: "bg-sky-50 dark:bg-sky-900/20",
            text: "text-sky-600 dark:text-sky-400",
            border: "border-sky-200 dark:border-sky-800",
            hover: "hover:bg-sky-100 dark:hover:bg-sky-900/30",
        },
        violet: {
            bg: "bg-violet-50 dark:bg-violet-900/20",
            text: "text-violet-600 dark:text-violet-400",
            border: "border-violet-200 dark:border-violet-800",
            hover: "hover:bg-violet-100 dark:hover:bg-violet-900/30",
        },
        orange: {
            bg: "bg-orange-50 dark:bg-orange-900/20",
            text: "text-orange-600 dark:text-orange-400",
            border: "border-orange-200 dark:border-orange-800",
            hover: "hover:bg-orange-100 dark:hover:bg-orange-900/30",
        },
        rose: {
            bg: "bg-rose-50 dark:bg-rose-900/20",
            text: "text-rose-600 dark:text-rose-400",
            border: "border-rose-200 dark:border-rose-800",
            hover: "hover:bg-rose-100 dark:hover:bg-rose-900/30",
        },
        amber: {
            bg: "bg-amber-50 dark:bg-amber-900/20",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-200 dark:border-amber-800",
            hover: "hover:bg-amber-100 dark:hover:bg-amber-900/30",
        },
    };

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            {replies.map((reply) => {
                const colors = colorClasses[reply.color];
                const Icon = reply.icon;
                
                return (
                    <motion.button
                        key={reply.id}
                        onClick={() => onSelect(reply.query)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            colors.bg,
                            colors.text,
                            colors.border,
                            colors.hover
                        )}
                    >
                        <Icon size={12} />
                        {reply.label}
                    </motion.button>
                );
            })}
        </div>
    );
}
