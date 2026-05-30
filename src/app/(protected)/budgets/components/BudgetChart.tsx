"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/frontend/lib/utils";
import { BudgetSummary } from "@/types";
import { useSecurity } from "@/components/SecurityProvider";

interface BudgetChartProps {
    budgets: BudgetSummary[];
}

export function BudgetChart({ budgets }: BudgetChartProps) {
    const { isStealthMode } = useSecurity();

    if (!budgets || budgets.length === 0) return null;

    // Transform data for recharts
    const data = budgets.map(b => ({
        name: b.category,
        Anggaran: b.limit,
        Terpakai: b.spent,
        color: b.color,
        percentage: b.percentage,
    }));

    // Custom Tooltip formatter
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                    <p className="font-bold text-sm mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs font-semibold mb-1" style={{ color: entry.fill }}>
                            {entry.name}: {isStealthMode ? "******" : formatCurrency(entry.value)}
                        </p>
                    ))}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500">
                            Terpakai: {Math.round((payload[1]?.value / payload[0]?.value) * 100) || 0}%
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[300px] mt-2 mb-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    barGap={2}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(value) => isStealthMode ? "***" : `Rp${(value / 1000).toLocaleString('id-ID')}k`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                    <Bar dataKey="Anggaran" fill="#cbd5e1" radius={[4, 4, 0, 0]} className="dark:fill-slate-800" />

                    {/* Custom Bar to show colors dynamically for 'Terpakai' */}
                    <Bar dataKey="Terpakai" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={
                                    entry.percentage > 90 ? "#f43f5e" :
                                        entry.percentage > 75 ? "#f59e0b" :
                                            "#0ea5e9"
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
