"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Plus, Receipt, LayoutGrid, List, ChevronRight, Bell } from "lucide-react";
import { BillHistoryModal } from "@/frontend/components/modals/BillDetailModal";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";
import { motion } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { Bill } from "@/types";
import { BillCardSkeleton, ErrorEmpty, NoBillsEmpty, useToast } from "@/frontend/components/UI";
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
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid" | "bill" | "subscription">("all");
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
        if (activeTab === "bill") filtered = filtered.filter(b => !b.isSubscription);
        if (activeTab === "subscription") filtered = filtered.filter(b => b.isSubscription);
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

    const scheduleBills = useMemo(() => {
        const baseBills = bills.filter(b => {
            if (activeTab === "unpaid") return !b.isPaid;
            if (activeTab === "paid") return b.isPaid;
            if (activeTab === "bill") return !b.isSubscription;
            if (activeTab === "subscription") return b.isSubscription;
            return true;
        });
        return [...baseBills].sort((a, b) => a.dueDate - b.dueDate || a.name.localeCompare(b.name));
    }, [bills, activeTab]);

    const scheduleGroups = useMemo(() => {
        const groups = new Map<number, Bill[]>();
        scheduleBills.forEach((bill) => {
            groups.set(bill.dueDate, [...(groups.get(bill.dueDate) || []), bill]);
        });
        return Array.from(groups.entries()).sort(([a], [b]) => a - b);
    }, [scheduleBills]);

    const totalBills = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
    const totalPaid = useMemo(() => bills.filter(b => b.isPaid).reduce((s, b) => s + b.amount, 0), [bills]);
    const totalUnpaid = useMemo(() => bills.filter(b => !b.isPaid).reduce((s, b) => s + b.amount, 0), [bills]);
    const paidCount = useMemo(() => bills.filter(b => b.isPaid).length, [bills]);
    const billCount = useMemo(() => bills.filter(b => !b.isSubscription).length, [bills]);
    const subscriptionCount = useMemo(() => bills.filter(b => b.isSubscription).length, [bills]);

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
    }, []);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: showAddSheet || !!editingBill || !!payBill }));
        return () => {
            window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: false }));
        };
    }, [showAddSheet, editingBill, payBill]);

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

    async function loadBills() {
        try {
            setLoading(true);
            setLoadError(null);
            const res = await apiFetch("/api/bills");
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.error || "Gagal memuat tagihan");
            }
            setBills(result.data || []);
        } catch (error) {
            console.error("Error loading bills:", error);
            setLoadError(error instanceof Error ? error.message : "Gagal memuat tagihan");
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
            setBills(prev => {
                let changed = false;
                const next = prev.map(b => {
                    if (!b.isPaid && (paymentsMap[b.id] || 0) >= b.amount) {
                        changed = true;
                        return { ...b, isPaid: true };
                    }
                    return b;
                });
                return changed ? next : prev;
            });
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

    async function handlePaymentSuccess(payment: { billId: number; amount: number; accountId: number }) {
        setBillPaymentsMap(prev => ({
            ...prev,
            [payment.billId]: (prev[payment.billId] || 0) + payment.amount,
        }));
        setBills(prev => prev.map(b => (
            b.id === payment.billId
                ? { ...b, isPaid: true, lastPaidAt: new Date() as unknown as Bill["lastPaidAt"] }
                : b
        )));
        await loadBills();
        window.dispatchEvent(new Event("transactionAdded"));
    }

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
            const res = await apiFetch(`/api/bills/${confirmDeleteId}`, { method: "DELETE" });
            const result = await res.json();
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
        { id: "bill" as const, label: "Tagihan", count: billCount },
        { id: "subscription" as const, label: "Langganan", count: subscriptionCount },
        { id: "unpaid" as const, label: t("bills.unpaid"), count: bills.length - paidCount },
        { id: "paid" as const, label: t("bills.paid"), count: paidCount },
    ];

    return (
        <div className="min-h-screen pb-36 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Link
                            href="/dashboard"
                            aria-label="Kembali ke dashboard"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Pembayaran Rutin</h1>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Tagihan wajib & langganan layanan</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAddSheet(true)}
                        aria-label="Tambah tagihan"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 sm:mx-6 mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-lg shadow-sky-500/10 shadow-sky-500/20"
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
                            <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Daftar Pembayaran</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{filteredBills.length} item</span>
                            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("list")}
                                    aria-pressed={viewMode === "list"}
                                    aria-label="Tampilkan daftar tagihan"
                                    className={cn(
                                        "p-1.5 rounded-full transition-all",
                                        viewMode === "list" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <List size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("calendar")}
                                    aria-pressed={viewMode === "calendar"}
                                    aria-label="Tampilkan kalender tagihan"
                                    className={cn(
                                        "p-1.5 rounded-full transition-all",
                                        viewMode === "calendar" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <LayoutGrid size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Filter tagihan">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
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
                                type="button"
                                onClick={() => setSelectedDay(null)}
                                className="ml-auto py-2 px-3 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
                            >
                                Filter: hari {selectedDay} ✕
                            </button>
                        )}
                    </div>

                    {/* Schedule View */}
                    {viewMode === "calendar" && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card-clean overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
                                <button
                                    type="button"
                                    aria-label="Bulan sebelumnya"
                                    onClick={() => {
                                        const newDate = new Date(currentMonth);
                                        newDate.setMonth(newDate.getMonth() - 1);
                                        setCurrentMonth(newDate);
                                        setSelectedDay(null);
                                    }}
                                    className="rounded-xl border border-white/70 bg-white/80 p-2 text-slate-500 shadow-sm transition hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                </button>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">Jadwal Bulanan</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {currentMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Bulan berikutnya"
                                    onClick={() => {
                                        const newDate = new Date(currentMonth);
                                        newDate.setMonth(newDate.getMonth() + 1);
                                        setCurrentMonth(newDate);
                                        setSelectedDay(null);
                                    }}
                                    className="rounded-xl border border-white/70 bg-white/80 p-2 text-slate-500 shadow-sm transition hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDay(null)}
                                    className={cn(
                                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition",
                                        selectedDay === null
                                            ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                    )}
                                >
                                    Semua
                                </button>
                                {scheduleGroups.map(([day, items]) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                                        className={cn(
                                            "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition",
                                            selectedDay === day
                                                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                        )}
                                    >
                                        {day} {currentMonth.toLocaleDateString("id-ID", { month: "short" })} · {items.length}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 p-4">
                                {scheduleGroups.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                                        <p className="text-sm font-bold text-slate-500">Belum ada jadwal di filter ini</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Coba pilih filter lain atau tambah pembayaran rutin baru.</p>
                                    </div>
                                ) : (
                                    scheduleGroups
                                        .filter(([day]) => selectedDay === null || selectedDay === day)
                                        .map(([day, items]) => {
                                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                                            const dayLabel = date.toLocaleDateString("id-ID", { weekday: "short" });
                                            const dayTotal = items.reduce((sum, item) => sum + item.amount, 0);
                                            return (
                                                <div key={day} className="grid grid-cols-[3.25rem_1fr] gap-3">
                                                    <div className="text-center">
                                                        <div className="rounded-2xl bg-slate-900 px-2 py-2 text-white shadow-sm dark:bg-white dark:text-slate-900">
                                                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{dayLabel}</p>
                                                            <p className="text-xl font-black leading-none">{day}</p>
                                                        </div>
                                                        <div className="mx-auto h-full w-px bg-slate-200 dark:bg-slate-800" />
                                                    </div>
                                                    <div className="space-y-2 pb-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{items.length} pembayaran</p>
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{isStealthMode ? "******" : formatCurrency(dayTotal)}</p>
                                                        </div>
                                                        {items.map((bill) => (
                                                            <button
                                                                key={bill.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (bill.isPaid) {
                                                                        setSelectedBillHistory(bill);
                                                                        setIsHistoryModalOpen(true);
                                                                    } else {
                                                                        setPayBill(bill);
                                                                    }
                                                                }}
                                                                className="w-full rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={cn(
                                                                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                                                bill.isSubscription
                                                                                    ? "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300"
                                                                                    : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
                                                                            )}>
                                                                                {bill.isSubscription ? "Langganan" : "Tagihan"}
                                                                            </span>
                                                                            <span className={cn(
                                                                                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                                                                bill.isPaid
                                                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                                    : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                                                                            )}>
                                                                                {bill.isPaid ? "Lunas" : "Belum bayar"}
                                                                            </span>
                                                                        </div>
                                                                        <p className="mt-2 truncate text-sm font-bold text-slate-900 dark:text-white">{bill.name}</p>
                                                                        <p className="mt-0.5 text-xs text-muted-foreground">{bill.frequency === "weekly" ? "Mingguan" : bill.frequency === "yearly" ? "Tahunan" : "Bulanan"}</p>
                                                                    </div>
                                                                    <p className="shrink-0 text-sm font-black tabular-nums text-sky-600 dark:text-sky-300">
                                                                        {isStealthMode ? "******" : formatCurrency(bill.amount)}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
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
                            ) : loadError ? (
                                <div className="card-clean">
                                    <ErrorEmpty
                                        title="Gagal memuat tagihan"
                                        description={loadError}
                                        onRetry={() => { void loadBills(); }}
                                    />
                                </div>
                            ) : filteredBills.length === 0 ? (
                                activeTab === "all" ? (
                                    <div className="pb-44">
                                        <NoBillsEmpty onAddNew={() => setShowAddSheet(true)} />
                                    </div>
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
