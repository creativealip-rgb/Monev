"use client";

import { motion } from "framer-motion";
import {
    Camera,
    Bell,
    Mic,
    Search,
    ShieldAlert,
    TrendingUp,
    Wallet,
    Clock,
    Zap,
    Users,
    CreditCard,
    ArrowLeft,
    Sparkles,
    PieChart,
    PiggyBank,
    Receipt,
    Crown
} from "lucide-react";
import Link from "next/link";

const features = [
    {
        category: "⭐ Fitur Andalan",
        items: [
            {
                id: 101,
                icon: Sparkles,
                title: "Monev AI",
                desc: "Chat dengan AI Assistant untuk analisis keuangan",
                status: "ready",
                color: "purple",
                href: "/chat"
            },
            {
                id: 102,
                icon: PieChart,
                title: "Analisa",
                desc: "Analisis cashflow dan pengeluaran by kategori",
                status: "ready",
                color: "blue",
                href: "/analytics"
            },
            {
                id: 103,
                icon: PiggyBank,
                title: "Tabungan",
                desc: "Tracking goals dan target tabungan",
                status: "ready",
                color: "emerald",
                href: "/budgets"
            },
            {
                id: 104,
                icon: Receipt,
                title: "Tagihan",
                desc: "Kelola tagihan rutin dan utang piutang",
                status: "ready",
                color: "rose",
                href: "/transactions"
            },
            {
                id: 105,
                icon: TrendingUp,
                title: "Investasi",
                desc: "Tracking portfolio dan rekomendasi investasi",
                status: "coming",
                color: "amber",
                href: "#"
            },
            {
                id: 106,
                icon: Crown,
                title: "Upgrade",
                desc: "Upgrade ke akun Pro/Expert untuk fitur premium",
                status: "ready",
                color: "indigo",
                href: "#"
            },
        ]
    },
    {
        category: "🔍 Smart Input",
        items: [
            {
                id: 1,
                icon: Camera,
                title: "Screenshot Agent",
                desc: "Upload screenshot bukti transfer/QRIS",
                status: "ready",
                color: "emerald",
                href: "#"
            },
            {
                id: 2,
                icon: Bell,
                title: "Notification Listener",
                desc: "Auto-detect notifikasi Gojek/BCA/Tokopedia",
                status: "coming",
                color: "blue",
                href: "#"
            },
            {
                id: 3,
                icon: Mic,
                title: "Voice Memo Catcher",
                desc: "Rekam suara untuk input multi-item",
                status: "ready",
                color: "purple",
                href: "#"
            },
        ]
    },
    {
        category: "🧠 Smart Categorization",
        items: [
            {
                id: 4,
                icon: Search,
                title: "Detective Agent",
                desc: "Google search untuk merchant ambigu",
                status: "coming",
                color: "indigo",
                href: "#"
            },
            {
                id: 5,
                icon: ShieldAlert,
                title: "Reimbursable Spy",
                desc: "Deteksi pengeluaran untuk klien",
                status: "coming",
                color: "amber",
                href: "#"
            },
        ]
    },
    {
        category: "🛡️ Psychological Defense",
        items: [
            {
                id: 6,
                icon: Wallet,
                title: "Goal Defender",
                desc: "Hitung dampak pengeluaran pada goal",
                status: "ready",
                color: "rose",
                href: "/analytics"
            },
            {
                id: 7,
                icon: ShieldAlert,
                title: "Impulse Buying Judge",
                desc: "Intervensi sebelum checkout e-commerce",
                status: "coming",
                color: "orange",
                href: "#"
            },
            {
                id: 8,
                icon: Clock,
                title: "Time-Cost Translator",
                desc: "Konversi rupiah ke jam kerja",
                status: "coming",
                color: "cyan",
                href: "#"
            },
            {
                id: 9,
                icon: TrendingUp,
                title: "Freelance Reality Check",
                desc: "Bagi income besar ke gaji bulanan",
                status: "coming",
                color: "teal",
                href: "#"
            },
        ]
    },
    {
        category: "⚡ Optimization",
        items: [
            {
                id: 10,
                icon: Zap,
                title: "Subscription Hunter",
                desc: "Deteksi & tracking langganan",
                status: "coming",
                color: "violet",
                href: "#"
            },
            {
                id: 11,
                icon: TrendingUp,
                title: "Idle Cash Optimizer",
                desc: "Saran investasi untuk uang nganggur",
                status: "coming",
                color: "green",
                href: "#"
            },
            {
                id: 12,
                icon: Sparkles,
                title: "Inflation-Adjusted Saving",
                desc: "Sesuaikan target dengan inflasi",
                status: "coming",
                color: "pink",
                href: "#"
            },
        ]
    },
    {
        category: "👥 Social Finance",
        items: [
            {
                id: 13,
                icon: Users,
                title: "Split Bill Coordinator",
                desc: "Bagi pengeluaran F&B dengan teman",
                status: "coming",
                color: "sky",
                href: "#"
            },
            {
                id: 14,
                icon: CreditCard,
                title: "Social Debt Collector",
                desc: "Tracking & reminder hutang piutang",
                status: "coming",
                color: "lime",
                href: "#"
            },
        ]
    },
    {
        category: "💵 Cash Management",
        items: [
            {
                id: 15,
                icon: Wallet,
                title: "Pocket Transfer Agent",
                desc: "Track penarikan tunai ATM",
                status: "coming",
                color: "stone",
                href: "#"
            },
            {
                id: 16,
                icon: TrendingUp,
                title: "Burn Rate Check",
                desc: "Interogasi saldo tunai fisik",
                status: "coming",
                color: "neutral",
                href: "#"
            },
        ]
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

export default function FiturPage() {
    return (
        <div className="relative min-h-screen pb-28">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-40 glass border-b border-slate-200/50 px-6 pt-12 pb-4"
            >
                <div className="flex items-center gap-3 mb-4">
                    <Link
                        href="/"
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Semua Fitur</h1>
                </div>
                <p className="text-sm text-slate-500">
                    22 fitur AI untuk membantu mengelola keuanganmu
                </p>
            </motion.header>

            {/* Features List */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-6 space-y-8"
            >
                {features.map((section, sectionIndex) => (
                    <motion.section key={sectionIndex} variants={itemVariants}>
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                            {section.category}
                        </h2>
                        <div className="space-y-3">
                            {section.items.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                    <Link
                                        key={feature.id}
                                        href={feature.href || "#"}
                                        className="block"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition-all"
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${feature.color}-50`}>
                                                <Icon className={`text-${feature.color}-600`} size={24} strokeWidth={2} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                                                    {feature.status === "ready" && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full">
                                                            Ready
                                                        </span>
                                                    )}
                                                    {feature.status === "coming" && (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                                                            Soon
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.section>
                ))}
            </motion.div>
        </div>
    );
}
