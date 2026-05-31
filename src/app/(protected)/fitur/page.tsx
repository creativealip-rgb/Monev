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
    Lock,
    RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserTier, isTierSufficient } from "@/lib/tier-gate";

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
                href: "/chat",
                requiredTier: undefined as UserTier | undefined
            },
            {
                id: 102,
                icon: PieChart,
                title: "Analisa",
                desc: "Analisis cashflow dan pengeluaran by kategori",
                status: "ready",
                color: "blue",
                href: "/analytics",
                requiredTier: "pro" as UserTier
            },
            {
                id: 107,
                icon: Wallet,
                title: "Anggaran",
                desc: "Kontrol batas pengeluaran bulanan",
                status: "ready",
                color: "orange",
                href: "/budgets"
            },
            {
                id: 103,
                icon: PiggyBank,
                title: "Tabungan",
                desc: "Tracking goals dan target tabungan",
                status: "ready",
                color: "emerald",
                href: "/savings"
            },
            {
                id: 104,
                icon: Zap,
                title: "Simulasi",
                desc: "Uji skenario keuangan sebelum ambil keputusan",
                status: "ready",
                color: "purple",
                href: "/simulations"
            },
            {
                id: 105,
                icon: Receipt,
                title: "Tagihan",
                desc: "Catat & ingatkan tagihan sebelum jatuh tempo",
                status: "ready",
                color: "rose",
                href: "/bills"
            },
            {
                id: 106,
                icon: TrendingUp,
                title: "Investasi",
                desc: "Tracking portfolio dan rekomendasi investasi",
                status: "coming",
                color: "amber",
                href: "#"
            },
            {
                id: 107,
                icon: Users,
                title: "Hutang",
                desc: "Catat dan track utang piutang dengan mudah",
                status: "ready",
                color: "rose",
                href: "/debts"
            },
            {
                id: 108,
                icon: RefreshCw,
                title: "Berulang",
                desc: "Otomatis catat gaji atau pengeluaran fix bulanan",
                status: "ready",
                color: "emerald",
                href: "/recurring"
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
                href: "#",
                requiredTier: "pro" as UserTier
            },
            {
                id: 2,
                icon: Bell,
                title: "Notification Listener",
                desc: "Auto-detect notifikasi via OCR/Text Bot",
                status: "ready",
                color: "blue",
                href: "/fitur/notification-guide"
            },
            {
                id: 3,
                icon: Mic,
                title: "Voice Memo Catcher",
                desc: "Rekam suara untuk input multi-item",
                status: "ready",
                color: "purple",
                href: "#",
                requiredTier: "pro" as UserTier
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
                status: "ready",
                color: "indigo",
                href: "#"
            },
            {
                id: 5,
                icon: ShieldAlert,
                title: "Reimbursable Spy",
                desc: "Deteksi pengeluaran untuk klien",
                status: "ready",
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
                status: "ready",
                color: "orange",
                href: "#"
            },
            {
                id: 8,
                icon: Clock,
                title: "Time-Cost Translator",
                desc: "Konversi rupiah ke jam kerja",
                status: "ready",
                color: "cyan",
                href: "#"
            },
            {
                id: 9,
                icon: TrendingUp,
                title: "Freelance Reality Check",
                desc: "Bagi income besar ke gaji bulanan",
                status: "ready",
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
                status: "ready",
                color: "sky",
                href: "#"
            },
            {
                id: 14,
                icon: CreditCard,
                title: "Social Debt Collector",
                desc: "Tracking & reminder hutang piutang",
                status: "ready",
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
                status: "ready",
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

import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/frontend/components/LanguageSelector";

export default function FiturPage() {
    const { data: session } = useSession();
    const { t } = useI18n();
    const userTier: UserTier = session?.user?.tier || "starter";

    return (
        <div className="min-h-screen pb-20 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                            >
                                <ArrowLeft size={20} strokeWidth={2.5} />
                            </Link>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-foreground tracking-tight">{t("features.allFeatures")}</h1>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Simple untuk harian, Advanced untuk kendali penuh</p>
                            </div>
                        </div>

                        <LanguageSelector variant="minimal" />
                    </div>
            </motion.header>

            <section className="px-6 pt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-500">Simple Mode</p>
                        <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">Catat transaksi tanpa distraksi</h2>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">Dashboard, transaksi, saldo, dan profil tetap jadi jalur utama untuk pemakaian harian.</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-amber-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-500">Advanced Mode</p>
                        <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">Buka semua alat finansial</h2>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">Budget, tabungan, tagihan, laporan, AI, dan analitik tersedia saat kamu butuh kontrol lebih detail.</p>
                    </div>
                </div>
            </section>

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
                                const isUnavailable = feature.status === "coming" || feature.href === "#";
                                const card = (
                                    <motion.div
                                        whileHover={!isUnavailable ? { scale: 1.02 } : undefined}
                                        whileTap={!isUnavailable ? { scale: 0.98 } : undefined}
                                        className={`card-clean p-3 flex items-center gap-4 transition-all ${isUnavailable ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-emerald-200"}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${feature.color}-50`}>
                                            <Icon className={`text-${feature.color}-600`} size={18} strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[13px] font-bold text-slate-700 tracking-tight">{feature.title}</h3>
                                                {feature.status === "ready" && !isUnavailable && !feature.requiredTier && (
                                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-md border border-emerald-100 tracking-tighter uppercase">
                                                        Siap
                                                    </span>
                                                )}
                                                {feature.status === "ready" && !isUnavailable && feature.requiredTier && !isTierSufficient(userTier, feature.requiredTier) && (
                                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded-md border border-amber-100 tracking-tighter uppercase flex items-center gap-0.5">
                                                        <Lock size={8} /> {feature.requiredTier === "pro" ? "Pro" : "Sultan"}
                                                    </span>
                                                )}
                                                {feature.status === "ready" && !isUnavailable && feature.requiredTier && isTierSufficient(userTier, feature.requiredTier) && (
                                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-md border border-emerald-100 tracking-tighter uppercase">
                                                        Siap
                                                    </span>
                                                )}
                                                {isUnavailable && (
                                                    <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded-md border border-slate-200 tracking-tighter uppercase">
                                                        Segera
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{feature.desc}</p>
                                        </div>
                                    </motion.div>
                                );

                                if (isUnavailable) {
                                    return (
                                        <div key={feature.id} className="block" aria-disabled="true">
                                            {card}
                                        </div>
                                    );
                                }

                                return (
                                    <Link key={feature.id} href={feature.href} className="block">
                                        {card}
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
