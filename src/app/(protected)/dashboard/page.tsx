"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FeatureItem } from "@/frontend/components/FeatureItem";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { TransferModal } from "@/frontend/components/TransferModal";
import { ThemeSelector } from "@/frontend/components/ThemeSelector";
import { useHeroTheme } from "@/frontend/lib/hero-theme";
import { TransactionListSkeleton, NoTransactionsEmpty, useToast } from "@/frontend/components/UI";
import {
    Sparkles,
    PieChart,
    PiggyBank,
    Receipt,
    TrendingUp,
    Bell,
    User,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    X,
    ArrowRightLeft,
    Eye,
    EyeOff,
    Zap,
    Crown,
    Lock,
} from "lucide-react";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatCurrency } from "@/frontend/lib/utils";
import Link from "next/link";
import { fetchProfileData } from "@/app/(protected)/profile/actions";
import { cn } from "@/frontend/lib/utils";
import { UserTier, canAccessAnalytics, canAccessInvestments } from "@/lib/tier-gate";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { apiFetch } from "@/frontend/lib/api-client";

const TIER_STYLES: Record<UserTier, { label: string; color: string; bg: string; icon: any; border: string }> = {
    miskin: { label: "Miskin", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: Zap },
    kaya: { label: "Kaya", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-100 dark:border-sky-800", icon: Sparkles },
    sultan: { label: "Sultan", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800", icon: Crown },
};

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
    { label: "Analitik", icon: <PieChart size={24} />, color: "sky", href: "/analytics" },
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

interface HeroBalanceCardProps {
    stats: { income: number; expense: number; balance: number; growth?: number; totalGoals?: number; totalInvestments?: number };
    mounted: boolean;
    onBalanceClick: () => void;
    onTransferClick: () => void;
    hideBalance: boolean;
    onToggleHideBalance: () => void;
}

function HeroBalanceCard({ stats, mounted, onBalanceClick, onTransferClick, hideBalance, onToggleHideBalance }: HeroBalanceCardProps) {
    const { themeConfig } = useHeroTheme();

    return (
        <div className={cn(
            "card-clean relative overflow-hidden rounded-[32px] border border-white/10 text-white p-6 cursor-pointer",
            "bg-gradient-to-br transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:brightness-110 hover:shadow-2xl hover:shadow-sky-500/10",
            themeConfig.gradient,
            themeConfig.shadowColor
        )}>
            <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 opacity-60", themeConfig.glowColor)} />
            <div className={cn("absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl -ml-10 -mb-10 opacity-40", themeConfig.bgEffect)} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 opacity-20" />

            <div
                className="relative z-10 cursor-pointer group"
                onClick={onBalanceClick}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <p className="text-white/70 text-xs font-medium group-hover:text-white transition-colors">Total Balance</p>
                        <ChevronRight size={14} className="text-white/50 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                            <ThemeSelector />
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleHideBalance();
                            }}
                            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            title={hideBalance ? "Tampilkan saldo" : "Sembunyikan saldo"}
                        >
                            {hideBalance ? (
                                <EyeOff size={14} className="text-white/70" />
                            ) : (
                                <Eye size={14} className="text-white/70" />
                            )}
                        </button>
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
                                (stats.growth || 0) >= 0 ? "text-emerald-300" : "text-rose-300"
                            )}>
                                {(stats.growth || 0) >= 0 ? "+" : ""}{(stats.growth || 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold tracking-tight mb-6 group-hover:scale-[1.02] transition-transform origin-left tabular-nums">
                    {!mounted ? "Loading..." : hideBalance ? "******" : formatCurrency(stats.balance + (stats.totalGoals || 0) + (stats.totalInvestments || 0))}
                </h2>
            </div>

            <div className="flex gap-3">
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <ArrowDownRight size={14} className="text-emerald-300" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Income</p>
                    </div>
                    <p className="font-bold text-[13px] text-emerald-300 tabular-nums">
                        + {!mounted ? "..." : hideBalance ? "******" : formatCurrency(stats.income).replace("Rp", "")}
                    </p>
                </div>

                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                            <ArrowUpRight size={14} className="text-rose-300" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Pengeluaran</p>
                    </div>
                    <p className="font-bold text-[13px] text-rose-300 tabular-nums">
                        − {!mounted ? "..." : hideBalance ? "******" : formatCurrency(stats.expense + (stats.fees || 0)).replace("Rp", "")}
                    </p>
                </div>
            </div>

            <button
                onClick={onTransferClick}
                className="mt-4 w-full py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
                <ArrowRightLeft size={16} />
                Transfer Saldo
            </button>
        </div>
    );
}

export default function Home() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<{ income: number; expense: number; balance: number; growth?: number; totalGoals?: number; totalInvestments?: number; fees?: number }>({ income: 0, expense: 0, balance: 0, fees: 0 });
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [userTier, setUserTier] = useState<UserTier>("miskin");
    const [userImage, setUserImage] = useState<string | null>(null);
    const [showBalanceDetail, setShowBalanceDetail] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [hideBalance, setHideBalance] = useState(false);
    const toast = useToast();
    const haptics = useHaptics();

    const loadData = async () => {
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
                apiFetch(`/api/stats?year=${currentYear}&month=${currentMonth}`),
                apiFetch("/api/transactions"),
                apiFetch("/api/categories")
            ]);

            // Process profile data
            if (profileData?.user) {
                // Try firstName + lastName first, then fall back to name
                const fullName = `${profileData.user.firstName || ""} ${profileData.user.lastName || ""}`.trim();
                const displayName = fullName || profileData.user.name || "Sultan";
                setUserName(displayName);
                setUserImage(profileData.user.image || null);
                // @ts-ignore
                setUserTier(profileData.user.tier || "miskin");
            }
            // Only set hideBalance from profile if not already set from localStorage
            const localSaved = localStorage.getItem("hideBalance");
            if (localSaved === null && profileData?.settings?.hideBalance !== undefined) {
                setHideBalance(profileData.settings.hideBalance);
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
    };

    const handleRefresh = async () => {
        haptics.medium();
        await loadData();
    };

    // Load hideBalance from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("hideBalance");
        if (saved !== null) {
            setHideBalance(saved === "true");
        }
    }, []);

    // Toggle handler with persistence
    const handleToggleHideBalance = () => {
        const newValue = !hideBalance;
        setHideBalance(newValue);
        localStorage.setItem("hideBalance", String(newValue));
    };

    const today = new Date();
    const formattedDate = mounted ? format(today, "EEEE, d MMMM yyyy", { locale: id }) : "";

    useEffect(() => {
        setMounted(true);
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
        <PullToRefresh onRefresh={handleRefresh}>
            <div className="relative min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
                <header className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50">
                    <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/profile" className="flex items-center gap-3 group active:scale-95 transition-transform">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 p-[2px] shadow-lg shadow-sky-500/20"
                                >
                                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                        {userImage ? (
                                            <img src={userImage} alt={userName || "User"} className="w-full h-full object-cover" />
                                        ) : !userName ? (
                                            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                                                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-sky-100 to-cyan-50 dark:from-sky-900 dark:to-cyan-900 flex items-center justify-center text-base font-bold text-sky-700 dark:text-sky-300">
                                                {userName.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                                <div className="flex flex-col">
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{formattedDate}</p>
                                    <h1 className="text-sm font-bold text-foreground tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                                        {!userName ? (
                                            <span className="inline-block w-24 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md align-middle" />
                                        ) : (
                                            `Hello, ${userName.split(" ")[0]}! 👋`
                                        )}
                                    </h1>
                                </div>
                            </Link>

                            <div className="flex items-center gap-1.5 pt-4">
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded-md border flex items-center gap-1",
                                    TIER_STYLES[userTier].bg,
                                    TIER_STYLES[userTier].border
                                )}>
                                    {(() => {
                                        const Icon = TIER_STYLES[userTier].icon;
                                        return <Icon size={8} className={TIER_STYLES[userTier].color} />;
                                    })()}
                                    <span className={cn("text-[8px] font-black uppercase tracking-tighter", TIER_STYLES[userTier].color)}>
                                        {TIER_STYLES[userTier].label}
                                    </span>
                                </div>
                                <Link
                                    href="/fitur/upgrade"
                                    className="text-[8px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-800 pl-1.5"
                                >
                                    Ganti Paket <ChevronRight size={8} />
                                </Link>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className="relative w-8 h-8 rounded-full glass-card flex items-center justify-center text-muted-foreground dark:text-sky-300 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-700 hover:shadow-xl hover:shadow-sky-200/50 dark:hover:shadow-sky-900/50 transition-all"
                        >
                            <Bell size={18} strokeWidth={2.5} />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white animate-pulse" />
                        </motion.button>
                    </div>
                </header>

                {/* Balance Card */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="px-6 pt-4 mb-6"
                >
                    <HeroBalanceCard
                        stats={stats}
                        mounted={mounted}
                        onBalanceClick={() => setShowBalanceDetail(true)}
                        onTransferClick={() => setShowTransferModal(true)}
                        hideBalance={hideBalance}
                        onToggleHideBalance={handleToggleHideBalance}
                    />
                </motion.section>

                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="px-6 mb-8"
                >
                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
                        <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Fitur Andalan</h2>
                        <Link href="/fitur" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-1">
                            Lihat Semua
                            <ChevronRight size={14} />
                        </Link>
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="grid grid-cols-3 gap-y-8 gap-x-4 justify-items-center"
                    >
                        {mainFeatures.map((feature) => {
                            const isLocked =
                                (feature.label === "Analitik" && !canAccessAnalytics(userTier)) ||
                                (feature.label === "Investasi" && !canAccessInvestments(userTier));

                            return (
                                <Link
                                    key={feature.label}
                                    href={feature.href}
                                    className="relative group"
                                >
                                    <FeatureItem
                                        label={feature.label}
                                        icon={feature.icon}
                                        color={feature.color}
                                    />
                                    {isLocked && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                                            <Lock size={10} className="text-slate-400" />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </motion.div>
                </motion.section>

                <motion.section
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="px-6"
                >
                    <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
                        <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Riwayat Terakhir</h2>
                        <Link href="/transactions" className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
                            Lihat Semua
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-3">
                        {loading ? (
                            <TransactionListSkeleton count={3} />
                        ) : transactions.length === 0 ? (
                            <NoTransactionsEmpty />
                        ) : (
                            transactions.map((t) => (
                                <TransactionItem key={t.id} transaction={t} />
                            ))
                        )}
                    </motion.div>
                </motion.section>



                {showBalanceDetail && mounted && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md dark:bg-slate-950/80"
                            onClick={() => setShowBalanceDetail(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-[92%] max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-2xl overflow-hidden z-10 shadow-sky-200/30 dark:shadow-sky-900/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-sky-50/40 to-white/10 dark:from-sky-950/40 dark:to-slate-900/10 pointer-events-none" />

                            <div className="flex justify-end mb-2 relative z-10">
                                <button
                                    onClick={() => setShowBalanceDetail(false)}
                                    className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="text-center mb-6 relative z-10">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Total Net Worth</p>
                                <h3 className="text-3xl font-black text-foreground tracking-tight tabular-nums">
                                    {!mounted ? "..." : formatCurrency(stats.balance + (stats.totalGoals || 0) + (stats.totalInvestments || 0))}
                                </h3>
                            </div>

                            <div className="mb-8 relative z-10 px-1">
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full flex overflow-hidden ring-4 ring-sky-50 dark:ring-slate-800">
                                    {(() => {
                                        const total = stats.balance + (stats.totalGoals || 0) + (stats.totalInvestments || 0);
                                        if (total <= 0) return <div className="w-full bg-slate-200/50 dark:bg-slate-700 h-full" />;
                                        const p1 = (stats.balance / total) * 100;
                                        const p2 = ((stats.totalGoals || 0) / total) * 100;
                                        const p3 = ((stats.totalInvestments || 0) / total) * 100;
                                        return (
                                            <>
                                                <div className="h-full bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.4)]" style={{ width: `${p1}%` }} />
                                                <div className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" style={{ width: `${p2}%` }} />
                                                <div className="h-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]" style={{ width: `${p3}%` }} />
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-7 relative z-10 px-2">
                                <div className="flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-4 h-4 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] border-2 border-white dark:border-slate-900" />
                                        <div>
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Saldo Aktif</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">Liquid assets</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-foreground tabular-nums">
                                        {!mounted ? "..." : formatCurrency(stats.balance)}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-white dark:border-slate-900" />
                                        <div>
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Tabungan Goals</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">Future plans</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-foreground tabular-nums">
                                        {!mounted ? "..." : formatCurrency(stats.totalGoals || 0)}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-5">
                                        <div className="w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] border-2 border-white dark:border-slate-900" />
                                        <div>
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Investasi</p>
                                            <p className="text-[10px] text-muted-foreground font-medium">Growth assets</p>
                                        </div>
                                    </div>
                                    <p className="text-base font-bold text-foreground tabular-nums">
                                        {!mounted ? "..." : formatCurrency(stats.totalInvestments || 0)}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}

                <TransferModal
                    isOpen={showTransferModal}
                    onClose={() => setShowTransferModal(false)}
                    onSuccess={() => {
                        window.dispatchEvent(new CustomEvent("transactionAdded"));
                        toast.success("Transfer berhasil", "Saldo telah ditransfer");
                    }}
                    currentBalance={stats.balance}
                />
            </div>
        </PullToRefresh>
    );
}
