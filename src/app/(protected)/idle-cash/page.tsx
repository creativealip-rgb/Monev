"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, TrendingUp, Shield, Landmark, Banknote, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    category?: string;
}

interface Recommendation {
    accountName: string;
    amount: number;
    suggestions: { icon: React.ReactNode; title: string; description: string }[];
}

export default function IdleCashPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [accountsRes, goalsRes] = await Promise.all([
                apiFetch("/api/accounts"),
                apiFetch("/api/goals"),
            ]);
            if (accountsRes.success) setAccounts(accountsRes.data || []);
            if (goalsRes.success) setGoals(goalsRes.data || []);
        } catch (e) {
            console.error(e);
            setError("Gagal memuat data. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    const totalAllocatedToGoals = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const cashAccounts = accounts.filter(
        (a) => a.type === "bank" || a.type === "emoney" || a.type === "cash"
    );
    const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalIdleCash = Math.max(0, totalCash - totalAllocatedToGoals);

    const emergencyFundGoal = goals.find(
        (g) => g.category === "emergency" || g.name.toLowerCase().includes("darurat")
    );
    const hasAdequateEmergencyFund = emergencyFundGoal
        ? emergencyFundGoal.currentAmount >= emergencyFundGoal.targetAmount * 0.8
        : false;

    function getRecommendations(): Recommendation[] {
        return cashAccounts
            .filter((a) => a.balance > 500000)
            .map((account) => {
                const suggestions: { icon: React.ReactNode; title: string; description: string }[] = [];

                if (!hasAdequateEmergencyFund) {
                    suggestions.push({
                        icon: <Shield size={18} className="text-blue-500" />,
                        title: "Tabungan Darurat",
                        description: "Dana darurat kamu belum mencapai 3x pengeluaran bulanan. Prioritaskan ini dulu.",
                    });
                }

                if (account.balance > 1000000) {
                    suggestions.push({
                        icon: <TrendingUp size={18} className="text-green-500" />,
                        title: "Investasi Reksadana",
                        description: "Cocok untuk dana yang tidak dipakai 1-3 tahun. Potensi return 6-12% per tahun.",
                    });
                }

                if (account.balance > 5000000) {
                    suggestions.push({
                        icon: <Landmark size={18} className="text-purple-500" />,
                        title: "Deposito",
                        description: "Aman dan stabil. Bunga 3-5% per tahun, cocok untuk dana yang tidak dipakai 6-12 bulan.",
                    });
                }

                return {
                    accountName: account.name,
                    amount: account.balance,
                    suggestions,
                };
            })
            .filter((r) => r.suggestions.length > 0);
    }

    const recommendations = getRecommendations();

    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-24 pt-safe">
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 pt-safe">
                    <div className="flex items-center gap-3">
                        <Link href="/fitur" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Idle Cash Optimizer</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">OPTIMASI DANA</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card-clean rounded-2xl p-4 animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background pb-24 pt-safe">
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 pt-safe">
                    <div className="flex items-center gap-3">
                        <Link href="/fitur" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-foreground">Idle Cash Optimizer</h1>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">OPTIMASI DANA</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-6">
                    <div className="card-clean rounded-2xl p-6 text-center">
                        <p className="text-red-500">{error}</p>
                        <button onClick={loadData} className="mt-3 text-sm text-primary font-medium">
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 pt-safe">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 pt-safe">
                <div className="flex items-center gap-3">
                    <Link href="/fitur" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Idle Cash Optimizer</h1>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">OPTIMASI DANA</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-4">
                {/* Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="card-clean rounded-2xl p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 border border-amber-200/50 dark:border-amber-700/30"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Banknote size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Dana Nganggur</p>
                            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalIdleCash)}</p>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Dana di rekening bank & e-money yang belum dialokasikan ke tujuan keuangan.
                    </p>
                </motion.div>

                {/* Idle Cash Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="card-clean rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Wallet size={18} className="text-primary" />
                        <h2 className="text-sm font-semibold text-foreground">Saldo Akun Kamu</h2>
                    </div>
                    <div className="space-y-3">
                        {cashAccounts.map((account) => (
                            <div key={account.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{account.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">{formatCurrency(account.balance)}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recommendations */}
                {recommendations.length > 0 ? (
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="flex items-center gap-2"
                        >
                            <Sparkles size={18} className="text-primary" />
                            <h2 className="text-sm font-semibold text-foreground">Rekomendasi</h2>
                        </motion.div>

                        {recommendations.map((rec, index) => (
                            <motion.div
                                key={rec.accountName}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                className="card-clean rounded-2xl p-5"
                            >
                                <p className="text-sm text-foreground mb-3">
                                    Kamu punya <span className="font-bold text-primary">{formatCurrency(rec.amount)}</span> nganggur di{" "}
                                    <span className="font-semibold">{rec.accountName}</span>. Pertimbangkan:
                                </p>
                                <div className="space-y-3">
                                    {rec.suggestions.map((suggestion, sIdx) => (
                                        <div key={sIdx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 dark:bg-muted/30">
                                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                                                {suggestion.icon}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{suggestion.title}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="card-clean rounded-2xl p-6 text-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                            <Sparkles size={24} className="text-green-500" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Dana kamu sudah teralokasi dengan baik! 🎉</p>
                        <p className="text-xs text-muted-foreground mt-1">Tidak ada dana nganggur yang perlu dioptimasi.</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
