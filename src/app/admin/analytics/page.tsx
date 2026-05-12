"use client";

import { useEffect, useState } from "react";
import { LucideIcon, TrendingUp, Users, Crown, Sparkles, Zap, DollarSign, Activity, Calendar } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

interface AnalyticsData {
    totalUsers: number;
    newUsersLast7Days: number;
    newUsersLast30Days: number;
    activeUsersLast7Days: number;
    tierDistribution: {
        starter: number;
        pro: number;
        sultan: number;
        benefactor: number;
    };
    estimatedRevenue: number;
    userGrowth: Array<{ month: string; count: number }>;
    dailyStats: Array<{ date: string; count: number }>;
    recentActivity: Array<{
        id: number;
        action: string;
        targetType: string | null;
        details: string;
        createdAt: string;
    }>;
}

const tierColors = {
    starter: { label: "Starter", bg: "bg-slate-100", text: "text-slate-600", fill: "#64748b", icon: Zap },
    pro: { label: "Pro", bg: "bg-sky-50", text: "text-sky-600", fill: "#0ea5e9", icon: Sparkles },
    sultan: { label: "Sultan", bg: "bg-amber-50", text: "text-amber-600", fill: "#f59e0b", icon: Crown },
    benefactor: { label: "Benefactor", bg: "bg-emerald-50", text: "text-emerald-600", fill: "#10b981", icon: Crown },
};

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", `bg-${color}-50 dark:bg-${color}-900/20`)}>
                    <Icon size={20} className={`text-${color}-600 dark:text-${color}-400`} />
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("30");

    useEffect(() => {
        async function loadData() {
            try {
                const res = await apiFetch(`/api/admin/analytics?period=${period}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Failed to load analytics:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [period]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
                            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const totalTierUsers = (data?.tierDistribution.starter || 0) + (data?.tierDistribution.pro || 0) + (data?.tierDistribution.sultan || 0) + (data?.tierDistribution.benefactor || 0);
    const paidUsers = (data?.tierDistribution.pro || 0) + (data?.tierDistribution.sultan || 0) + (data?.tierDistribution.benefactor || 0);
    const paidPercentage = totalTierUsers > 0 ? Math.round((paidUsers / totalTierUsers) * 100) : 0;

    const maxDailyCount = Math.max(...(data?.dailyStats?.map(d => d.count) || [1]));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">User statistics and insights</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={data?.totalUsers || 0}
                    subtitle={`${data?.newUsersLast30Days || 0} new this month`}
                    icon={Users}
                    color="sky"
                />
                <StatCard
                    title="New Users"
                    value={data?.newUsersLast30Days || 0}
                    subtitle="Last 30 days"
                    icon={TrendingUp}
                    color="emerald"
                />
                <StatCard
                    title="Active Users"
                    value={data?.activeUsersLast7Days || 0}
                    subtitle="Last 7 days"
                    icon={Activity}
                    color="violet"
                />
                <StatCard
                    title="Est. Revenue"
                    value={formatCurrency(data?.estimatedRevenue || 0)}
                    subtitle={`${paidPercentage}% paid tier`}
                    icon={DollarSign}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">User Registrations</h2>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Calendar size={16} />
                            Last 30 days
                        </div>
                    </div>
                    <div className="h-80 flex items-end gap-1">
                        {data?.dailyStats?.map((day, idx) => {
                            const height = maxDailyCount > 0 ? (day.count / maxDailyCount) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-sky-500 rounded-t hover:bg-sky-600 transition-colors cursor-pointer"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                    <div className="opacity-0 group-hover:opacity-100 absolute bg-slate-800 text-white text-xs px-2 py-1 rounded -mt-8 transition-opacity">
                                        {day.count} users
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(day.date).getDate()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Tier Distribution</h2>
                    <div className="space-y-6">
                        {Object.entries(tierColors).map(([tier, colors]) => {
                            const count = data?.tierDistribution[tier as keyof typeof data.tierDistribution] || 0;
                            const percentage = totalTierUsers > 0 ? Math.round((count / totalTierUsers) * 100) : 0;
                            const Icon = colors.icon;
                            return (
                                <div key={tier} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon size={18} className={colors.text} />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{colors.label}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                                            <span className="text-xs text-slate-400 ml-1">({percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%`, backgroundColor: colors.fill }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Free vs Paid</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-400" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Free ({100 - paidPercentage}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Paid ({paidPercentage}%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Monthly User Growth</h2>
                    <div className="space-y-3">
                        {data?.userGrowth?.slice(-12).map((month, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">{month.month}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-sky-500 rounded-full"
                                            style={{ width: `${Math.min((month.count / (data?.totalUsers || 1)) * 100 * 10, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-slate-900 dark:text-white w-12 text-right">
                                        {month.count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Key Metrics</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</span>
                            <span className="text-lg font-bold text-emerald-600">{paidPercentage}%</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Avg. Daily Signups</span>
                            <span className="text-lg font-bold text-sky-600">
                                {data?.dailyStats ? Math.round(data.dailyStats.reduce((a, b) => a + b.count, 0) / data.dailyStats.length) : 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Active Rate</span>
                            <span className="text-lg font-bold text-violet-600">
                                {totalTierUsers > 0 ? Math.round((data?.activeUsersLast7Days || 0) / totalTierUsers * 100) : 0}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <span className="text-sm text-slate-600 dark:text-slate-400">ARPU (Est.)</span>
                            <span className="text-lg font-bold text-amber-600">
                                {paidUsers > 0 ? formatCurrency((data?.estimatedRevenue || 0) / paidUsers) : "Rp 0"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
