"use client";

import { useEffect, useState } from "react";
import {
    Settings,
    User,
    Lock,
    Bell,
    Shield,
    Activity,
    Loader2,
    Save,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useSession } from "@/lib/auth-client";

interface ActivityLog {
    id: number;
    adminId: number;
    action: string;
    targetType: string | null;
    targetId: number | null;
    details: string;
    createdAt: string;
    admin: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
}

export default function SettingsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadActivityLogs();
    }, []);

    const loadActivityLogs = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/api/admin/activity?limit=20");
            const json = await res.json();
            if (json.success) {
                setActivityLogs(json.data.activities);
            }
        } catch (error) {
            console.error("Failed to load activity logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatAction = (action: string, details: string) => {
        try {
            const parsed = details ? JSON.parse(details) : {};
            switch (action) {
                case "update_user":
                    return `Updated user tier/status`;
                case "delete_user":
                    return `Deleted user`;
                case "create_coupons":
                    return `Created ${parsed.count} coupon(s)`;
                case "send_notification":
                    return `Sent push notification`;
                case "delete_coupon":
                    return `Deleted coupon`;
                default:
                    return action;
            }
        } catch (e) {
            return action;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Admin settings and activity</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                <User size={20} className="text-sky-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Admin Profile</h2>
                                <p className="text-sm text-slate-500">Your admin account details</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue={session?.user?.name || ""}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    defaultValue={session?.user?.email || ""}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    disabled
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-4">
                            Contact developer to update admin profile
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Activity size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Activity Log</h2>
                                <p className="text-sm text-slate-500">Recent admin actions</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 size={24} className="animate-spin text-sky-500" />
                            </div>
                        ) : activityLogs.length === 0 ? (
                            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                                No activity recorded yet
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {activityLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                    >
                                        <div className="w-2 h-2 mt-2 rounded-full bg-sky-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                                {formatAction(log.action, log.details)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {log.admin?.name || log.admin?.email || "Unknown"} • {formatDate(log.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <Shield size={20} className="text-violet-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Security</h2>
                                <p className="text-sm text-slate-500">Account security</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Lock size={18} className="text-slate-500" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Change Password</span>
                            </button>
                            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Bell size={18} className="text-slate-500" />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Notification Settings</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <Settings size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">App Info</h2>
                                <p className="text-sm text-slate-500">Application details</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Version</span>
                                <span className="text-slate-900 dark:text-white font-medium">1.0.0</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Database</span>
                                <span className="text-emerald-600 font-medium">SQLite</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Admin Panel</span>
                                <span className="text-sky-600 font-medium">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800 p-6">
                        <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-300 mb-2">
                            Danger Zone
                        </h3>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mb-4">
                            Irreversible actions
                        </p>
                        <button className="w-full py-2 text-sm font-medium text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-700 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors">
                            Reset All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
