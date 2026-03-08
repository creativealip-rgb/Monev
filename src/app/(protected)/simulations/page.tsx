"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap, ArrowLeft, CheckCircle2, Info,
    TrendingUp, PiggyBank, Receipt, Wallet, Clock, Trash2,
    ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/frontend/lib/api-client";
import { cn, formatCurrency } from "@/frontend/lib/utils";

interface SimulationHistoryItem {
    id: string;
    scenario: string;
    amount: number;
    type: string;
    result: {
        impact: string;
        advice: string;
        riskLevel: string;
        runwayImpact?: string;
        goalImpact?: string;
    };
    timestamp: number;
}

const TEMPLATES = [
    {
        label: "Beli iPhone baru",
        scenario: "Beli iPhone baru",
        type: "one_time_expense",
        amount: 20000000,
        icon: Wallet,
        color: "rose",
    },
    {
        label: "Langganan gym",
        scenario: "Langganan gym bulanan",
        type: "recurring_expense",
        amount: 500000,
        icon: Receipt,
        color: "amber",
    },
    {
        label: "Naik gaji 20%",
        scenario: "Naik gaji 20% dari gaji saat ini",
        type: "recurring_income",
        amount: 0,
        icon: TrendingUp,
        color: "emerald",
    },
    {
        label: "Terima bonus",
        scenario: "Terima bonus tahunan dari kantor",
        type: "one_time_income",
        amount: 5000000,
        icon: PiggyBank,
        color: "sky",
    },
] as const;

const MAX_HISTORY = 20;

const TYPE_LABELS: Record<string, string> = {
    one_time_expense: "Pengeluaran Sekali",
    recurring_expense: "Cicilan/Rutin",
    one_time_income: "Bonus/Sekali",
    recurring_income: "Kenaikan Gaji",
};

const RISK_BADGE: Record<string, { bg: string; text: string }> = {
    high: { bg: "bg-rose-500", text: "Tinggi" },
    medium: { bg: "bg-amber-500", text: "Sedang" },
    low: { bg: "bg-emerald-500", text: "Rendah" },
};

function getStorageKey(userId: string) {
    return `monev_simulation_history_${userId}`;
}

function loadHistory(userId: string): SimulationHistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(getStorageKey(userId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveHistory(userId: string, history: SimulationHistoryItem[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(getStorageKey(userId), JSON.stringify(history));
}

export default function SimulationsPage() {
    const { data: session } = useSession();
    const userId = session?.user?.id ?? "anonymous";

    const [scenario, setScenario] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("one_time_expense");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"simulasi" | "riwayat">("simulasi");
    const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Load history on mount / userId change
    useEffect(() => {
        setHistory(loadHistory(userId));
    }, [userId]);

    const addToHistory = useCallback(
        (sim: Omit<SimulationHistoryItem, "id" | "timestamp">) => {
            const item: SimulationHistoryItem = {
                ...sim,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
            };
            const updated = [item, ...loadHistory(userId)].slice(0, MAX_HISTORY);
            saveHistory(userId, updated);
            setHistory(updated);
        },
        [userId]
    );

    const clearHistory = useCallback(() => {
        saveHistory(userId, []);
        setHistory([]);
    }, [userId]);

    const handleSimulate = async () => {
        if (!scenario || !amount) return;
        setLoading(true);
        try {
            const res = await apiFetch("/api/ai/simulate", {
                method: "POST",
                body: JSON.stringify({
                    scenario,
                    amount: parseFloat(amount),
                    type
                })
            });
            const data = await res.json();
            setResult(data);

            // Persist to history
            addToHistory({
                scenario,
                amount: parseFloat(amount),
                type,
                result: {
                    impact: data.impact ?? "",
                    advice: data.advice ?? "",
                    riskLevel: data.riskLevel ?? "medium",
                    runwayImpact: data.runwayImpact,
                    goalImpact: data.goalImpact,
                },
            });
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyTemplate = (tpl: typeof TEMPLATES[number]) => {
        setScenario(tpl.scenario);
        setAmount(tpl.amount > 0 ? String(tpl.amount) : "");
        setType(tpl.type);
        setActiveTab("simulasi");
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <main className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
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
                            <h1 className="text-xl font-bold text-foreground tracking-tight">Simulasi</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">What-If Simulator</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    {[
                        { key: "simulasi" as const, label: "Simulasi", icon: Zap },
                        { key: "riwayat" as const, label: "Riwayat", icon: Clock },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
                                activeTab === tab.key
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                    : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                            {tab.key === "riwayat" && history.length > 0 && (
                                <span className={cn(
                                    "ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                    activeTab === tab.key
                                        ? "bg-white/20 text-white"
                                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                )}>
                                    {history.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </motion.header>

            <div className="px-6 py-8">
                <AnimatePresence mode="wait">
                    {activeTab === "simulasi" ? (
                        <motion.div
                            key="simulasi"
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -10 }}
                            variants={containerVariants}
                            className="max-w-md mx-auto space-y-6"
                        >
                            {/* Scenario Templates */}
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    visible: { opacity: 1, y: 0 },
                                }}
                            >
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Sparkles size={14} className="text-purple-500" />
                                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Template Cepat
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {TEMPLATES.map((tpl) => (
                                        <button
                                            key={tpl.label}
                                            onClick={() => applyTemplate(tpl)}
                                            className={cn(
                                                "p-3 rounded-xl border bg-white dark:bg-slate-900",
                                                "border-slate-200 dark:border-slate-800",
                                                "hover:border-purple-300 dark:hover:border-purple-700",
                                                "hover:shadow-md hover:shadow-purple-500/5",
                                                "active:scale-95 transition-all text-left"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                                                tpl.color === "rose" && "bg-rose-50 dark:bg-rose-900/20",
                                                tpl.color === "amber" && "bg-amber-50 dark:bg-amber-900/20",
                                                tpl.color === "emerald" && "bg-emerald-50 dark:bg-emerald-900/20",
                                                tpl.color === "sky" && "bg-sky-50 dark:bg-sky-900/20",
                                            )}>
                                                <tpl.icon
                                                    size={16}
                                                    className={cn(
                                                        tpl.color === "rose" && "text-rose-500",
                                                        tpl.color === "amber" && "text-amber-500",
                                                        tpl.color === "emerald" && "text-emerald-500",
                                                        tpl.color === "sky" && "text-sky-500",
                                                    )}
                                                />
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {tpl.label}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {tpl.amount > 0
                                                    ? formatCurrency(tpl.amount)
                                                    : "Sesuai konteks"}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Input Card */}
                            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Skenario Keputusan</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase ml-1">Deskripsi Skenario</label>
                                        <textarea
                                            value={scenario}
                                            onChange={(e) => setScenario(e.target.value)}
                                            placeholder="Contoh: Beli iPhone 15 Pro, Naik gaji 5jt, Cicilan Mobil Baru..."
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm resize-none h-24"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase ml-1">Nominal (IDR)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border-transparent focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all text-sm font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase ml-1">Tipe Keputusan</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: "one_time_expense", label: "Pengeluaran Sekali", icon: Wallet },
                                                { id: "recurring_expense", label: "Cicilan/Rutin", icon: Receipt },
                                                { id: "one_time_income", label: "Bonus/Sekali", icon: TrendingUp },
                                                { id: "recurring_income", label: "Kenaikan Gaji", icon: PiggyBank },
                                            ].map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setType(t.id)}
                                                    className={cn(
                                                        "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all",
                                                        type === t.id
                                                            ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                                            : "bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                    )}
                                                >
                                                    <t.icon size={16} className={type === t.id ? "text-purple-600 dark:text-purple-400" : "text-slate-400"} />
                                                    <span className={cn(
                                                        "text-[10px] font-bold",
                                                        type === t.id ? "text-purple-700 dark:text-purple-300" : "text-slate-500"
                                                    )}>
                                                        {t.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSimulate}
                                        disabled={loading || !scenario || !amount}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-sky-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 mt-4"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Zap size={20} />
                                                Jalankan Simulasi
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Result Card */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="glass-card p-6 border border-slate-200 dark:border-slate-800 overflow-hidden relative"
                                    >
                                        {/* Risk Badge */}
                                        <div className={cn(
                                            "absolute top-0 right-0 px-4 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-bl-xl text-white",
                                            result.riskLevel === "high" ? "bg-rose-500" :
                                                result.riskLevel === "medium" ? "bg-amber-500" : "bg-emerald-500"
                                        )}>
                                            Risk: {result.riskLevel}
                                        </div>

                                        <div className="space-y-6 pt-4">
                                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                                    <Info size={14} className="text-sky-500" /> Analisis Dampak
                                                </h3>
                                                <p className="text-sm font-semibold leading-relaxed">{result.impact}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Dana Darurat</p>
                                                    <p className="text-xs font-bold">{result.runwayImpact}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Financial Goals</p>
                                                    <p className="text-xs font-bold">{result.goalImpact}</p>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                                                <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2 flex items-center gap-1.5">
                                                    <CheckCircle2 size={14} /> AI Advisor Advice
                                                </h3>
                                                <p className="text-xs font-medium italic text-purple-800 dark:text-purple-300 leading-relaxed">
                                                    &ldquo;{result.advice}&rdquo;
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        /* History Tab */
                        <motion.div
                            key="riwayat"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-md mx-auto space-y-4"
                        >
                            {/* Clear button */}
                            {history.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-end"
                                >
                                    <button
                                        onClick={clearHistory}
                                        className={cn(
                                            "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold",
                                            "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
                                            "border border-rose-200 dark:border-rose-800",
                                            "hover:bg-rose-100 dark:hover:bg-rose-900/30",
                                            "active:scale-95 transition-all"
                                        )}
                                    >
                                        <Trash2 size={14} />
                                        Hapus Riwayat
                                    </button>
                                </motion.div>
                            )}

                            {history.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card p-8 border border-slate-200 dark:border-slate-800 text-center"
                                >
                                    <Clock size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-sm font-bold text-slate-400">
                                        Belum ada riwayat simulasi
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Jalankan simulasi pertamamu di tab Simulasi
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((item, idx) => {
                                        const risk = RISK_BADGE[item.result.riskLevel] ?? RISK_BADGE.medium;
                                        const isExpanded = expandedId === item.id;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={cn(
                                                    "glass-card border border-slate-200 dark:border-slate-800",
                                                    "overflow-hidden transition-all"
                                                )}
                                            >
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                                    className="w-full p-4 text-left flex items-start gap-3"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                                                                {item.scenario}
                                                            </p>
                                                            <span className={cn(
                                                                "shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase",
                                                                risk.bg
                                                            )}>
                                                                {risk.text}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                            <span className="font-bold">
                                                                {formatCurrency(item.amount)}
                                                            </span>
                                                            <span>·</span>
                                                            <span>{TYPE_LABELS[item.type] ?? item.type}</span>
                                                            <span>·</span>
                                                            <span>{formatDate(item.timestamp)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 mt-1 text-slate-400">
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-4 pb-4 space-y-3">
                                                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                                                        <Info size={12} className="text-sky-500" /> Analisis Dampak
                                                                    </h4>
                                                                    <p className="text-xs font-semibold leading-relaxed">
                                                                        {item.result.impact}
                                                                    </p>
                                                                </div>

                                                                {(item.result.runwayImpact || item.result.goalImpact) && (
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        {item.result.runwayImpact && (
                                                                            <div className="space-y-0.5">
                                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Dana Darurat</p>
                                                                                <p className="text-[11px] font-bold">{item.result.runwayImpact}</p>
                                                                            </div>
                                                                        )}
                                                                        {item.result.goalImpact && (
                                                                            <div className="space-y-0.5">
                                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Financial Goals</p>
                                                                                <p className="text-[11px] font-bold">{item.result.goalImpact}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                                                                    <h4 className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase mb-1 flex items-center gap-1">
                                                                        <CheckCircle2 size={12} /> Saran AI
                                                                    </h4>
                                                                    <p className="text-[11px] font-medium italic text-purple-800 dark:text-purple-300 leading-relaxed">
                                                                        &ldquo;{item.result.advice}&rdquo;
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
