"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    Send,
    Clock,
    Users,
    Crown,
    Sparkles,
    Zap,
    Loader2,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

interface NotificationHistory {
    id: number;
    action: string;
    details: {
        message: string;
        target: string;
        tier?: string;
        totalRecipients: number;
        successCount: number;
        failedCount: number;
    };
    createdAt: string;
}

export default function NotificationsPage() {
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState<"all" | "tier">("all");
    const [tier, setTier] = useState("starter");
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState<NotificationHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await apiFetch("/api/admin/notifications");
            const json = await res.json();
            if (json.success) {
                setHistory(json.data);
            }
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim()) return;

        setSending(true);
        setResult(null);

        try {
            const body: Record<string, string | undefined> = {
                message: message.trim(),
                target,
            };

            if (target === "tier" && tier) {
                body.tier = tier;
            }

            const res = await apiFetch("/api/admin/notifications", {
                method: "POST",
                body: JSON.stringify(body),
            });

            const json = await res.json();

            if (json.success) {
                setResult({
                    success: true,
                    message: `Sent to ${json.data.subscriptionsFound || 0} subscribers`,
                });
                setMessage("");
                loadHistory();
            } else {
                setResult({
                    success: false,
                    message: json.error || "Failed to send notification",
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: "An error occurred while sending",
            });
        } finally {
            setSending(false);
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

    const getTargetLabel = (target: string, tier?: string) => {
        if (target === "all") return "All Users";
        if (target === "tier" && tier) return `${tier.charAt(0).toUpperCase() + tier.slice(1)} Tier`;
        return target;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Push Notifications</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Send push notifications to users</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Send Notification</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Message
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your notification message..."
                                rows={4}
                                maxLength={500}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">
                                {message.length}/500 characters
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Target Audience
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="target"
                                        checked={target === "all"}
                                        onChange={() => setTarget("all")}
                                        className="w-4 h-4 text-sky-500"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                        <Users size={16} /> All Users
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="target"
                                        checked={target === "tier"}
                                        onChange={() => setTarget("tier")}
                                        className="w-4 h-4 text-sky-500"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                        <Crown size={16} /> By Tier
                                    </span>
                                </label>
                            </div>
                        </div>

                        {target === "tier" && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Select Tier
                                </label>
                                <select
                                    value={tier}
                                    onChange={(e) => setTier(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="benefactor">Benefactor</option>
                                    <option value="sultan">Sultan</option>
                                </select>
                            </div>
                        )}

                        {result && (
                            <div className={cn(
                                "flex items-center gap-2 p-3 rounded-lg",
                                result.success
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                    : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                            )}>
                                {result.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                <span className="text-sm">{result.message}</span>
                            </div>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || sending}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium rounded-lg transition-colors"
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Send Notification
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notification History</h2>
                        <button
                            onClick={loadHistory}
                            className="text-sm text-sky-600 hover:text-sky-700"
                        >
                            Refresh
                        </button>
                    </div>

                    {loadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 size={24} className="animate-spin text-sky-500" />
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
                            No notifications sent yet
                        </p>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Bell size={14} className="text-sky-500" />
                                            <span className="text-xs text-slate-400">
                                                {getTargetLabel(item.details.target, item.details.tier)}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400">
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                        {item.details.message}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span>Sent to: {item.details.totalRecipients}</span>
                                        <span className="text-emerald-600">
                                            Success: {item.details.successCount}
                                        </span>
                                        {item.details.failedCount > 0 && (
                                            <span className="text-rose-600">
                                                Failed: {item.details.failedCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    How Push Notifications Work
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• Users must have push notifications enabled in their browser to receive notifications</li>
                    <li>• Notifications are sent via Web Push API using VAPID keys</li>
                    <li>• The message will be delivered to all subscribed users matching your target criteria</li>
                </ul>
            </div>
        </div>
    );
}
