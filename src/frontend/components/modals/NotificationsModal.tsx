"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Bell, X, CheckCheck, TrendingUp, AlertCircle, 
    Calendar, Package, Sparkles, Receipt, Info
} from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { Portal } from "@/frontend/components/Portal";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { NotificationLog } from "@/backend/db/schema";

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NOTIFICATION_ICONS: Record<string, any> = {
    daily_reminder: { icon: Calendar, color: "text-sky-500", bg: "bg-sky-50 dark:bg-sky-900/20" },
    budget_alert: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
    bill_reminder: { icon: Receipt, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    weekly_summary: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    recurring_executed: { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    custom: { icon: Info, color: "text-slate-500", bg: "bg-slate-50 dark:bg-slate-900/20" },
};

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
    const [notifications, setNotifications] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    async function fetchNotifications() {
        setLoading(true);
        try {
            const response = await apiFetch("/api/notifications");
            if (response.ok) {
                const result = await response.json();
                setNotifications(result.data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }

    async function markAllAsRead() {
        try {
            const response = await apiFetch("/api/notifications", {
                method: "POST",
                body: JSON.stringify({ action: "markAllAsRead" }),
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    }

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-3 sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                        <Bell size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-foreground">Notifikasi</h2>
                                        {unreadCount > 0 && (
                                            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mt-0.5">
                                                {unreadCount} Belum Dibaca
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-sky-600 transition-colors"
                                            title="Tandai semua dibaca"
                                        >
                                            <CheckCheck size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                                {loading ? (
                                    <div className="space-y-3 py-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-4 animate-pulse">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                                                <div className="flex-1 space-y-2 py-1">
                                                    <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded" />
                                                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4">
                                            <Bell size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Belum Ada Notifikasi</p>
                                        <p className="text-xs text-slate-500 mt-1">Kami akan mengabari Anda jika ada update terbaru.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((notification, idx) => {
                                            const config = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.custom;
                                            const Icon = config.icon;

                                            return (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={cn(
                                                        "group relative flex gap-4 p-4 rounded-2xl border transition-all",
                                                        notification.isRead 
                                                            ? "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/50" 
                                                            : "bg-sky-50/30 dark:bg-sky-900/10 border-sky-100 dark:border-sky-900/30 shadow-sm"
                                                    )}
                                                >
                                                    {!notification.isRead && (
                                                        <div className="absolute top-4 right-4 w-2 h-2 bg-sky-500 rounded-full" />
                                                    )}

                                                    <div className={cn(
                                                        "h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                                                        config.bg,
                                                        config.color
                                                    )}>
                                                        <Icon size={24} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <h3 className={cn(
                                                                "text-sm font-bold truncate",
                                                                notification.isRead ? "text-slate-900 dark:text-slate-100" : "text-sky-900 dark:text-sky-100"
                                                            )}>
                                                                {notification.title}
                                                            </h3>
                                                            <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: localeId })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                                            {notification.body}
                                                        </p>
                                                        {notification.url && (
                                                            <button className="mt-2 text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest hover:underline">
                                                                Lihat Detail →
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] text-center text-slate-400 font-medium">
                                    Pengaturan notifikasi dapat diubah melalui menu Profil
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
