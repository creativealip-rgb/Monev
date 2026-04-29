"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Plus, Receipt, AlertTriangle, RefreshCw, LayoutGrid, List, ChevronRight, Bell } from "lucide-react";
import { BillHistoryModal } from "@/frontend/components/modals/BillDetailModal";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { Bill } from "@/types";
import { BillCardSkeleton, NoBillsEmpty, useToast } from "@/frontend/components/UI";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { useSession } from "next-auth/react";
import { useSecurity } from "@/components/SecurityProvider";
import { UserTier } from "@/lib/tier-gate";
import { useI18n } from "@/lib/i18n";
import { BillItem, PayBillSheet, AddBillSheet } from "./components";
import { shouldResetBill, getResetMessage } from "@/lib/bill-reset";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function BillsPage() {
    const { t } = useI18n();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid">("all");
    const [showAddSheet, setShowAddSheet] = useState(false);
    const { isStealthMode } = useSecurity();
    const toast = useToast();
    const { data: session } = useSession();
    const userTier: UserTier = session?.user?.tier || "starter";

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedBillHistory, setSelectedBillHistory] = useState<Bill | null>(null);

    // Pay bill sheet state
    const [payBill, setPayBill] = useState<Bill | null>(null);
    const [billPaymentsMap, setBillPaymentsMap] = useState<Record<number, number>>({});

    // Add/Edit bill state
    const [editingBill, setEditingBill] = useState<Bill | null>(null);

    // View mode
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const filteredBills = useMemo(() => {
        let filtered = bills;
        if (activeTab === "unpaid") filtered = filtered.filter(b => !b.isPaid);
        if (activeTab === "paid") filtered = filtered.filter(b => b.isPaid);
        if (selectedDay !== null) {
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            filtered = filtered.filter(b => {
                const dueDate = new Date(year, month, b.dueDate);
                return dueDate.getDate() === selectedDay;
            });
        }
        return filtered;
    }, [bills, activeTab, selectedDay, currentMonth]);

    const totalBills = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
    const totalPaid = useMemo(() => bills.filter(b => b.isPaid).reduce((s, b) => s + b.amount, 0), [bills]);
    const totalUnpaid = useMemo(() => bills.filter(b => !b.isPaid).reduce((s, b) => s + b.amount, 0), [bills]);
    const paidCount = useMemo(() => bills.filter(b => b.isPaid).length, [bills]);

    // Bill reminder notifications
    const notifiedBillsRef = useRef<Set<string>>(new Set());

    const overdueBills = useMemo(() => {
        const today = new Date().getDate();
        return bills.filter(b => !b.isPaid && b.dueDate < today);
    }, [bills]);

    const urgentBills = useMemo(() => {
        const today = new Date().getDate();
        return bills.filter(b => !b.isPaid && b.dueDate >= today && b.dueDate - today <= 3);
    }, [bills]);

    useEffect(() => {
        loadBills();
        loadSubscriptions();
    }, []);

    // Show toast reminders for bills due soon, due today, or overdue
    useEffect(() => {
        if (loading || bills.length === 0) return;

        const today = new Date().getDate();

        bills.forEach(bill => {
            if (bill.isPaid) return;

            const daysUntilDue = bill.dueDate - today;

            if (daysUntilDue < 0) {
                const key = `overdue-${bill.id}`;
                if (!notifiedBillsRef.current.has(key)) {
                    notifiedBillsRef.current.add(key);
                    toast.error(
                        "Tagihan Terlambat!",
                        `${bill.name} sudah lewat jatuh tempo!`
                    );
                }
            } else if (daysUntilDue === 0) {
                const key = `today-${bill.id}`;
                if (!notifiedBillsRef.current.has(key)) {
                    notifiedBillsRef.current.add(key);
                    toast.error(
                        "Tagihan Jatuh Tempo!",
                        `${bill.name} jatuh tempo hari ini!`
                    );
                }
            } else if (daysUntilDue <= 3) {
                const key = `soon-${bill.id}`;
                if (!notifiedBillsRef.current.has(key)) {
                    notifiedBillsRef.current.add(key);
                    toast.warning(
                        "Tagihan Segera!",
                        `${bill.name} jatuh tempo dalam ${daysUntilDue} hari`
                    );
                }
            }
        });
    }, [bills, loading]);

    // Subscription detection
    interface DetectedSub {
        merchant: string;
        amount: number;
        frequency: string;
        lastDate: string;
        confidence: number;
    }
    const [subscriptions, setSubscriptions] = useState<DetectedSub[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [showSubs, setShowSubs] = useState(true);

    async function loadSubscriptions() {
        try {
            setSubsLoading(true);
            const res = await apiFetch("/api/subscriptions");
            const result = await res.json();
            if (result.success) {
                setSubscriptions(result.data);
            }
        } catch (error) {
            console.error("Error loading subscriptions:", error);
        } finally {
            setSubsLoading(false);
        }
    }

    async function loadBills() {
        try {
            setLoading(true);
            const res = await apiFetch("/api/bills");
            const result = await res.json();
            if (result.success) {
                setBills(result.data);
            }
        } catch (error) {
            console.error("Error loading bills:", error);
        } finally {
            setLoading(false);
        }
    }

    // Auto-reset bills on page load
    const autoResetBills = async () => {
        try {
            const res = await apiFetch("/api/bills/reset", { method: "POST" });
            const data = await res.json();
            if (data.success && data.resetCount > 0) {
                toast.info(
                    "Tagihan Diperbarui",
                    `${data.resetCount} tagihan telah direset untuk periode baru`
                );
                await loadBills();
            }
        } catch (error) {
            console.error("Auto-reset error:", error);
        }
    };

    // Run auto-reset when bills are loaded
    useEffect(() => {
        if (!loading && bills.length > 0) {
            autoResetBills();
        }
    }, [loading]);

    async function loadBillPayments() {
        try {
            const paymentsMap: Record<number, number> = {};
            for (const bill of bills) {
                const res = await apiFetch(`/api/bills/${bill.id}/history`);
                const result = await res.json();
                if (result.success && result.data) {
                    paymentsMap[bill.id] = result.data.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);
                }
            }
            setBillPaymentsMap(paymentsMap);
        } catch (error) {
            console.error("Error loading bill payments:", error);
        }
    }

    // Load bill payments when bills change
    useEffect(() => {
        if (bills.length > 0) {
            loadBillPayments();
        }
    }, [bills]);

    async function handleTogglePaid(id: number, e: React.MouseEvent) {
        e.stopPropagation();
        try {
            const res = await apiFetch(`/api/bills/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ togglePaid: true }),
            });
            const result = await res.json();
            if (result.success) {
                const bill = bills.find(b => b.id === id);
                setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
                toast.success(bill?.isPaid ? t("bills.markAsUnpaid") : t("bills.markAsPaid"));
            }
        } catch (error) {
            console.error("Error toggling bill:", error);
            toast.error(t("bills.failedUpdateStatus"));
        }
    }

    async function handleDelete() {
        if (!confirmDeleteId) return;
        try {
            console.log("[handleDelete] Deleting bill:", confirmDeleteId);
            const res = await apiFetch(`/api/bills/${confirmDeleteId}`, { method: "DELETE" });
            const result = await res.json();
            console.log("[handleDelete] Delete result:", result);
            if (result.success) {
                setBills(prev => prev.filter(b => b.id !== confirmDeleteId));
                toast.success(t("bills.billDeleted"));
            } else {
                console.error("[handleDelete] Delete failed:", result.error);
                toast.error(result.error || "Gagal menghapus tagihan");
            }
        } catch (error) {
            console.error("[handleDelete] Error deleting bill:", error);
            toast.error(t("bills.errorDelete") || "Gagal menghapus tagihan");
        } finally {
            setConfirmDeleteId(null);
        }
    }

    const tabs = [
        { id: "all" as const, label: t("bills.all"), count: bills.length },
        { id: "unpaid" as const, label: t("bills.unpaid"), count: bills.length - paidCount },
        { id: "paid" as const, label: t("bills.paid"), count: paidCount },
    ];

    return (
        <div className="min-h-screen pb-36 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-2 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 pb-3 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-1">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <div className="hidden md:flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm p-1">
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "p-1.5 rounded-full transition-all",
                                    viewMode === "list" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={cn(
                                    "p-1.5 rounded-full transition-all",
                                    viewMode === "calendar" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                        <Link
                            href="/dashboard"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Tagihan</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Pantau Semua Kewajiban</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddSheet(true)}
className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-xl shadow-sky-500/20"
            >
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">Tagihan Bulan Ini</p>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-2xl font-bold tabular-nums">{loading ? "..." : (isStealthMode ? "******" : formatCurrency(totalUnpaid))}</p>
                        <p className="text-white/60 text-xs tabular-nums">{loading ? "..." : `${bills.length - paidCount} belum dibayar`}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold tabular-nums text-emerald-300">{loading ? "..." : `${Math.round(totalBills > 0 ? (totalPaid / totalBills) * 100 : 0)}%`}</p>
                        <p className="text-white/60 text-xs">terbayar</p>
                    </div>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${totalBills > 0 ? (totalPaid / totalBills) * 100 : 0}%` }}
                        transition={{ duration: 1 }}
                        className="h-full rounded-full bg-emerald-400"
                    />
                </div>
            </motion.div>

            {/* Bill Reminder Summary Banner */}
            {!loading && (overdueBills.length > 0 || urgentBills.length > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mx-6 mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                            <Bell size={14} className="text-rose-500 dark:text-rose-400" />
                        </div>
                        <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                            Pengingat Tagihan
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 text-center p-2 rounded-xl bg-sky-50 dark:bg-sky-900/20">
                            <p className="text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                                {isStealthMode ? "***" : formatCurrency(totalBills)}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Total tagihan bulan ini
                            </p>
                        </div>
                        <div className="flex-1 text-center p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                {bills.length - paidCount}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Belum dibayar
                            </p>
                        </div>
                        {overdueBills.length > 0 && (
                            <div className="flex-1 text-center p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                                <p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                    {overdueBills.length}
                                </p>
                                <p className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">
                                    Terlambat
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Detected Subscriptions Section */}
            {(subscriptions.length > 0 || subsLoading) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-6 mt-4"
                >
                    <button
                        onClick={() => setShowSubs(!showSubs)}
                        className="flex items-center justify-between w-full mb-3"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                                <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" />
                            </div>
                            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                                Langganan Terdeteksi
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                {subsLoading ? "..." : subscriptions.length}
                            </span>
                            <RefreshCw
                                size={13}
                                className={cn("text-muted-foreground", subsLoading && "animate-spin")}
                                onClick={(e) => { e.stopPropagation(); loadSubscriptions(); }}
                            />
                        </div>
                    </button>

                    <AnimatePresence>
                        {showSubs && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-2"
                            >
                                {subsLoading ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">Menganalisa pola transaksi...</div>
                                ) : subscriptions.map((sub, i) => (
                                    <motion.div
                                        key={sub.merchant}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-[13px] font-bold text-foreground">{sub.merchant}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Pola {sub.frequency} • Terakhir {new Date(sub.lastDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                            </p>
                                        </div>
                                        <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                            {isStealthMode ? "******" : formatCurrency(sub.amount)}
                                        </span>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="p-6 space-y-8"
            >
                <motion.section variants={itemVariants}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                                <Receipt size={16} className="text-rose-500 dark:text-rose-400" />
                            </div>
                            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Daftar Tagihan</h2>
                        </div>
                        <span className="text-xs text-muted-foreground">{filteredBills.length} Tagihan</span>
                    </div>

                    <div className="flex gap-2 mb-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "py-2 px-3 rounded-xl text-xs font-bold transition-all",
                                    activeTab === tab.id
                                        ? "bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                                        : "bg-white dark:bg-slate-800 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-700"
                                )}
                            >
                                {tab.label} ({loading ? "..." : tab.count})
                            </button>
                        ))}
                        {selectedDay !== null && (
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="ml-auto py-2 px-3 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
                            >
                                Filter: hari {selectedDay} ✕
                            </button>
                        )}
                    </div>

                    {/* Calendar View */}
                    {viewMode === "calendar" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="card-clean p-4"
                        >
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => {
                                        const newDate = new Date(currentMonth);
                                        newDate.setMonth(newDate.getMonth() - 1);
                                        setCurrentMonth(newDate);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    <ChevronRight className="rotate-180 w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold">
                                    {currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                                </span>
                                <button
                                    onClick={() => {
                                        const newDate = new Date(currentMonth);
                                        newDate.setMonth(newDate.getMonth() + 1);
                                        setCurrentMonth(newDate);
                                    }}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {[t("bills.sunday"), t("bills.monday"), t("bills.tuesday"), t("bills.wednesday"), t("bills.thursday"), t("bills.friday"), t("bills.saturday")].map(day => (
                                    <div key={day} className="text-[10px] font-bold text-muted-foreground py-1">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                    const year = currentMonth.getFullYear();
                                    const month = currentMonth.getMonth();
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const today = new Date();

                                    const cells = [];
                                    for (let i = 0; i < firstDay; i++) {
                                        cells.push(<div key={`empty-${i}`} className="h-10" />);
                                    }

                                    for (let day = 1; day <= daysInMonth; day++) {
                                        const billsOnDay = bills.filter(b => {
                                            const dueDate = new Date(year, month, b.dueDate);
                                            return dueDate.getDate() === day && dueDate.getMonth() === month;
                                        });
                                        const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                                        const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                                        cells.push(
                                            <div
                                                key={day}
                                                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                                                className={cn(
                                                    "h-10 relative rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors cursor-pointer",
                                                    selectedDay === day ? "ring-2 ring-sky-500" : "",
                                                    isToday ? "bg-sky-500 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800",
                                                    isPast && !isToday ? "text-muted-foreground" : "text-foreground"
                                                )}
                                            >
                                                {day}
                                                {billsOnDay.length > 0 && (
                                                    <div className="absolute bottom-1 flex gap-0.5">
                                                        {billsOnDay.slice(0, 3).map((b, i) => (
                                                            <div
                                                                key={i}
                                                                className={cn(
                                                                    "w-1.5 h-1.5 rounded-full",
                                                                    b.isPaid ? "bg-emerald-400" : isPast ? "bg-rose-400" : "bg-amber-400"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return cells;
                                })()}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-[10px] text-muted-foreground">Lunas</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="text-[10px] text-muted-foreground">Mendatang</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                                    <span className="text-[10px] text-muted-foreground">Terlambat</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* List View */}
                    {viewMode === "list" && (
                        <div>
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <BillCardSkeleton key={i} />
                                    ))}
                                </div>
                            ) : filteredBills.length === 0 ? (
                                activeTab === "all" ? (
                                    <NoBillsEmpty onAddNew={() => setShowAddSheet(true)} />
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center py-16 bg-white dark:bg-slate-800 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Receipt size={24} className="text-slate-300 dark:text-slate-500" />
                                        </div>
                                        <p className="text-muted-foreground font-bold">
                                            {activeTab === "paid" ? t("bills.noPaidYet") : t("bills.allPaid")}
                                        </p>
                                    </motion.div>
                                )
                            ) : (
                                <div className="space-y-4">
                                    {filteredBills.map((bill, i) => {
                                        const today = new Date().getDate();
                                        const daysUntilDue = bill.dueDate - today;
                                        const needsReminder = !bill.isPaid
                                            && (daysUntilDue <= 3);
                                        return (
                                            <BillItem
                                                key={bill.id}
                                                bill={bill}
                                                index={i}
                                                onDelete={(id) => setConfirmDeleteId(id)}
                                                onToggle={handleTogglePaid}
                                                onShowHistory={(b) => {
                                                    setSelectedBillHistory(b);
                                                    setIsHistoryModalOpen(true);
                                                }}
                                                onEdit={(b) => setEditingBill(b)}
                                                onPay={(b) => setPayBill(b)}
                                                isStealthMode={isStealthMode}
                                                t={t}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </motion.section>
            </motion.div>

            <BillHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                bill={selectedBillHistory}
            />

            <PayBillSheet
                bill={payBill}
                paidAmount={payBill ? billPaymentsMap[payBill.id] || 0 : 0}
                onClose={() => setPayBill(null)}
                onSuccess={loadBills}
            />

            <AddBillSheet
                isOpen={showAddSheet || !!editingBill}
                onClose={() => { setShowAddSheet(false); setEditingBill(null); }}
                onSuccess={() => { loadBills(); setEditingBill(null); }}
                editingBill={editingBill}
            />

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title={t("bills.deleteTitle")}
                description={t("bills.deleteConfirm")}
                confirmText={t("bills.delete")}
            />
        </div>
    );
}
