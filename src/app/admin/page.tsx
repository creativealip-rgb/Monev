"use client";

import { useEffect, useState } from "react";
import { LucideIcon, Users, TrendingUp, DollarSign, Activity, UserPlus, Crown, Sparkles, Zap, Bell } from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import Link from "next/link";

interface StatsData {
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
    dailyStats: Array<{ date: string; count: number }>;
    recentActivity: Array<{
        id: number;
        action: string;
        targetType: string;
        details: string;
        createdAt: string;
    }>;
}

const tierColors = {
    starter: { label: "Starter", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: Zap },
    pro: { label: "Pro", bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", icon: Sparkles },
    sultan: { label: "Sultan", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", icon: Crown },
    benefactor: { label: "Benefactor", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", icon: Crown },
};

function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: { value: number; positive: boolean };
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
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
                    )}
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        trend.positive ? "text-emerald-600" : "text-rose-600"
                    )}>
                        <TrendingUp size={14} className={cn(!trend.positive && "rotate-180")} />
                        {trend.value}%
                    </div>
                )}
            </div>
        </div>
    );
}

function formatAction(action: string, details: string) {
    try {
        const parsed = details ? JSON.parse(details) : {};
        switch (action) {
            case "update_user":
                return `Updated user #${parsed.changes?.tier ? `tier to ${parsed.changes.tier}` : parsed.changes?.isActive ? `status to ${parsed.changes.isActive}` : 'profile'}`;
            case "delete_user":
                return `Deleted user ${parsed.deletedUser}`;
            case "create_coupons":
                return `Created ${parsed.count} coupon(s)`;
            case "send_notification":
                return `Sent notification to ${parsed.subscriptionsFound || 0} users`;
            case "delete_coupon":
                return `Deleted coupon ${parsed.code}`;
            default:
                return action;
        }
    } catch (e) {
        return action;
    }
}

function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function AdminDashboard() {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await apiFetch("/api/admin/analytics?period=30");
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
    }, []);

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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome to Monev Admin Panel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Users"
                    value={data?.totalUsers || 0}
                    subtitle={`${data?.newUsersLast30Days || 0} new this month`}
                    icon={Users}
                    trend={{ value: 12, positive: true }}
                    color="sky"
                />
                <StatsCard
                    title="New Users (7d)"
                    value={data?.newUsersLast7Days || 0}
                    subtitle="Last 7 days"
                    icon={UserPlus}
                    trend={{ value: 8, positive: true }}
                    color="emerald"
                />
                <StatsCard
                    title="Active Users"
                    value={data?.activeUsersLast7Days || 0}
                    subtitle="Last 7 days"
                    icon={Activity}
                    color="violet"
                />
                <StatsCard
                    title="Est. Revenue"
                    value={formatCurrency(data?.estimatedRevenue || 0)}
                    subtitle={`${paidPercentage}% paid tier`}
                    icon={DollarSign}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">User Registrations (Last 30 Days)</h2>
                    <div className="h-64 flex items-end gap-1">
                        {data?.dailyStats?.slice(-14).map((day, idx) => {
                            const maxCount = Math.max(...(data?.dailyStats?.map(d => d.count) || [1]));
                            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-sky-500 rounded-t hover:bg-sky-600 transition-colors"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                        title={`${day.date}: ${day.count} users`}
                                    />
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(day.date).getDate()}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tier Distribution</h2>
                    <div className="space-y-4">
                        {Object.entries(tierColors).map(([tier, colors]) => {
                            const count = data?.tierDistribution[tier as keyof typeof data.tierDistribution] || 0;
                            const percentage = totalTierUsers > 0 ? Math.round((count / totalTierUsers) * 100) : 0;
                            const Icon = colors.icon;
                            return (
                                <div key={tier} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} className={colors.text} />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{colors.label}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full", colors.bg.replace("bg-", "bg-"), colors.text.replace("text-", "bg-"))}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
                        <Link href="/admin/analytics" className="text-sm text-sky-600 hover:text-sky-700">
                            View all
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {data?.recentActivity?.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No recent activity</p>
                        ) : (
                            data?.recentActivity?.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-sky-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            {formatAction(activity.action, activity.details)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {formatDate(activity.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/admin/notifications"
                            className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Bell size={20} className="text-sky-600" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Send Notification</span>
                        </Link>
                        <Link
                            href="/admin/coupons"
                            className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Sparkles size={20} className="text-amber-600" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Create Coupon</span>
                        </Link>
                        <Link
                            href="/admin/users"
                            className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Users size={20} className="text-emerald-600" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Manage Users</span>
                        </Link>
                        <Link
                            href="/admin/analytics"
                            className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <TrendingUp size={20} className="text-violet-600" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View Analytics</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
