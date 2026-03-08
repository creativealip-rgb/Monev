"use client";

import { formatCurrency } from "@/frontend/lib/utils";
import { Brain, Sparkles, Lock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSecurity } from "@/components/SecurityProvider";
import { AnalyticsData } from "./types";

export function InsightsTab({ data, itemVariants }: { data: AnalyticsData; itemVariants: any }) {
    const { isStealthMode } = useSecurity();
    if (!data.canAccessAIInsights) {
        return (
            <div className="flex flex-col gap-6">
                <motion.div variants={itemVariants} className="card-clean p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock size={18} className="text-slate-400" />
                            <h3 className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Financial Insights</h3>
                        </div>
                        <Link
                            href="/fitur/upgrade"
                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        >
                            Upgrade <ChevronRight size={12} />
                        </Link>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                        Dapatkan analisa AI personal tentang keuanganmu dengan upgrade ke paket Kaya atau Sultan.
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="card-clean p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Prediksi Cashflow</h3>
                            <p className="text-xs text-muted-foreground mt-1">Estimasi saldo akhir bulan depan</p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-black text-foreground">
                            {isStealthMode ? "******" : formatCurrency(data.cashflowPrediction.nextMonth)}
                        </span>
                        {data.cashflowPrediction.trend === 'up' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Naik ↗</span>}
                        {data.cashflowPrediction.trend === 'down' && <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">Turun ↘</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-slate-900 dark:bg-slate-400 rounded-full"
                                style={{ width: `${data.cashflowPrediction.confidence}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{data.cashflowPrediction.confidence}% confidence</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <motion.div variants={itemVariants} className="card-clean p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center gap-2 mb-4">
                    <Brain className="text-indigo-500" size={18} />
                    <h3 className="text-[13px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">AI Financial Insights</h3>
                </div>
                <div className="space-y-3">
                    {data.insights ? (
                        <div className="flex gap-3 items-start">
                            <Sparkles size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{data.insights}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">Belum ada insight yang cukup untuk dianalisis.</p>
                    )}
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="card-clean p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Prediksi Cashflow</h3>
                        <p className="text-xs text-muted-foreground mt-1">Estimasi saldo akhir bulan depan</p>
                    </div>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black text-foreground">
                        {isStealthMode ? "******" : formatCurrency(data.cashflowPrediction.nextMonth)}
                    </span>
                    {data.cashflowPrediction.trend === 'up' && <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Naik ↗</span>}
                    {data.cashflowPrediction.trend === 'down' && <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">Turun ↘</span>}
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-slate-900 dark:bg-slate-400 rounded-full"
                            style={{ width: `${data.cashflowPrediction.confidence}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">{data.cashflowPrediction.confidence}% confidence</span>
                </div>
            </motion.div>
        </div>
    );
}
