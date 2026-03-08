"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { BudgetSummary } from "@/types";
import { useSecurity } from "@/components/SecurityProvider";

interface BudgetPieChartProps {
    budgets: BudgetSummary[];
}

const FALLBACK_COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#a855f7", "#ec4899", "#06b6d4", "#84cc16",
];

export function BudgetPieChart({ budgets }: BudgetPieChartProps) {
    const { isStealthMode } = useSecurity();

    if (!budgets || budgets.length === 0) return null;

    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

    const data = budgets.map((b, i) => ({
        name: b.category,
        value: b.limit,
        color: b.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        spent: b.spent,
        percentage: totalBudget > 0
            ? ((b.limit / totalBudget) * 100)
            : 0,
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const entry = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                    <p className="font-bold text-sm mb-1">{entry.name}</p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Anggaran: {isStealthMode
                            ? "******"
                            : formatCurrency(entry.value)}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Terpakai: {isStealthMode
                            ? "******"
                            : formatCurrency(entry.spent)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">
                        {entry.percentage.toFixed(1)}% dari total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-clean p-4"
        >
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                Alokasi Anggaran
            </h3>

            <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                            animationBegin={0}
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend with amounts */}
            <div className="mt-2 space-y-2">
                {data.map((entry, index) => (
                    <motion.div
                        key={entry.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-xs font-semibold text-foreground truncate">
                                {entry.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-bold text-foreground tabular-nums">
                                {isStealthMode
                                    ? "******"
                                    : formatCurrency(entry.value)}
                            </span>
                            <span className={cn(
                                "text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md",
                                "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                            )}>
                                {entry.percentage.toFixed(0)}%
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
