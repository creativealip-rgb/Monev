"use client";

import { formatCurrency } from "@/frontend/lib/utils";
import { cn } from "@/frontend/lib/utils";
import {
    TrendingUp, AlertTriangle, Gauge
} from "lucide-react";
import { motion } from "framer-motion";
import { useSecurity } from "@/components/SecurityProvider";
import { CalendarHeatmap } from "./CalendarHeatmap";
import { AnalyticsData } from "./types";

function FinancialHealthScore({ healthData }: { healthData: any }) {
    if (!healthData || typeof healthData.score === 'undefined') return null;

    const score = healthData.score;
    const info = {
        label: healthData.label,
        emoji: healthData.emoji,
        colorHex: healthData.color
    };

    const circumference = 2 * Math.PI * 30;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <motion.div className="card-clean p-5 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-2">
                <Gauge size={16} className="text-slate-400" />
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Health Score</h3>
            </div>

            <div className="flex items-center justify-between mt-2">
                <div>
                    <span
                        className="text-xl font-black block"
                        style={{ color: info.colorHex }}
                    >
                        {score} {info.emoji}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">{info.label}</span>
                </div>
                <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                        <motion.circle
                            cx="50" cy="50" r="30"
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            style={{ strokeDasharray: circumference, stroke: info.colorHex }}
                        />
                    </svg>
                </div>
            </div>

            {healthData.tip && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed line-clamp-2">
                    {healthData.tip}
                </p>
            )}
        </motion.div>
    );
}

function StatsCard({ title, value, icon, subtitle, trend, hideValue }: any) {
    return (
        <motion.div className="card-clean p-4 flex flex-col justify-center flex-1 cursor-pointer transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-lg font-black text-foreground">
                    {hideValue ? "******" : formatCurrency(value)}
                </p>
                {trend === 'up' && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">↗</span>}
                {trend === 'down' && <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full">↘</span>}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
        </motion.div>
    );
}

function BudgetAlertsWidget({ alerts }: { alerts: any[] }) {
    if (!alerts || alerts.length === 0) return null;
    return (
        <div className="space-y-3">
            {alerts.map((alert, i) => (
                <motion.div key={i} className="card-clean p-4 flex items-start gap-3 bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/20">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full shrink-0">
                        <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-0.5">Over Budget: {alert.category}</h4>
                        <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                            Terpakai {formatCurrency(alert.spent)} dari budget {formatCurrency(alert.limit)}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

export function OverviewTab({ data, itemVariants }: { data: AnalyticsData; itemVariants: any }) {
    const { isStealthMode } = useSecurity();
    return (
        <div className="flex flex-col gap-6">
            {/* Financial Health & Monthly Stats */}
            <div className="grid grid-cols-2 gap-4">
                <FinancialHealthScore healthData={data.healthScore} />
                <div className="flex flex-col gap-4">
                    <StatsCard
                        title="Pemasukan"
                        value={data.income}
                        icon={<TrendingUp size={16} className="text-emerald-500" />}
                        subtitle="Bulan ini"
                        trend="up"
                        hideValue={isStealthMode}
                    />
                    <StatsCard
                        title="Pengeluaran"
                        value={data.expense}
                        icon={<TrendingUp size={16} className="text-rose-500 rotate-180" />}
                        subtitle="Bulan ini"
                        trend="down"
                        hideValue={isStealthMode}
                    />
                </div>
            </div>

            {/* Calendar Heatmap */}
            <CalendarHeatmap data={data.dailyStats} />

            {/* Budget Alerts */}
            {data.budgetAlerts && data.budgetAlerts.length > 0 && (
                <BudgetAlertsWidget alerts={data.budgetAlerts} />
            )}

            {/* Allocations (50/30/20) */}
            <motion.div variants={itemVariants} className="card-clean p-5">
                <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Alokasi Dana</h3>
                <div className="space-y-4">
                    {data.allocations.map((item) => (
                        <div key={item.name} className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-foreground">{item.name}</span>
                                <span className={cn(
                                    item.percentage > item.target ? "text-rose-500" : "text-emerald-500"
                                )}>{item.percentage}% / {item.target}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    className={cn("h-full rounded-full",
                                        item.color === "blue" && "bg-blue-500",
                                        item.color === "rose" && "bg-rose-500",
                                        item.color === "orange" && "bg-orange-500"
                                    )}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                {isStealthMode ? "******" : formatCurrency(item.amount)}
                            </p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
