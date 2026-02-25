"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ArrowLeft, Send, AlertTriangle, CheckCircle2, Info, TrendingUp, PiggyBank, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";
import { formatCurrency } from "@/frontend/lib/utils";

export default function SimulationsPage() {
    const [scenario, setScenario] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("one_time_expense");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

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
        } catch (error) {
            console.error("Simulation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
    };

    return (
        <main className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-40 glass-card border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-lg font-bold">What-If Simulator</h1>
                </div>
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    <Zap size={20} />
                </div>
            </header>

            <div className="px-6 py-8">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-md mx-auto space-y-6"
                >
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
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${type === t.id
                                                    ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                                    : "bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                }`}
                                        >
                                            <t.icon size={16} className={type === t.id ? "text-purple-600 dark:text-purple-400" : "text-slate-400"} />
                                            <span className={`text-[10px] font-bold ${type === t.id ? "text-purple-700 dark:text-purple-300" : "text-slate-500"}`}>
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
                                <div className={`absolute top-0 right-0 px-4 py-1.5 font-bold text-[10px] uppercase tracking-widest rounded-bl-xl ${result.riskLevel === "high" ? "bg-rose-500 text-white" :
                                        result.riskLevel === "medium" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                    }`}>
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
                                            "{result.advice}"
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </main>
    );
}
