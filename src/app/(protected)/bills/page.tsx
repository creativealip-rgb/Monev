"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { ArrowLeft, Plus, Receipt, AlertTriangle, RefreshCw, LayoutGrid, List, ChevronRight, Bell, Clock, X, Pencil } from "lucide-react";
import { BillHistoryModal } from "@/frontend/components/DetailModalsVerified";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { Bill } from "@/types";
import { Portal } from "@/frontend/components/Portal";
import { BillCardSkeleton, NoBillsEmpty, useToast } from "@/frontend/components/UI";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { useSession } from "next-auth/react";
import { useSecurity } from "@/components/SecurityProvider";
import { UserTier } from "@/lib/tier-gate";
import { useI18n } from "@/frontend/lib/i18n-context";
import { BillItem } from "./components/BillItem";

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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { isStealthMode } = useSecurity();
    const toast = useToast();
    const { data: session } = useSession();
    const userTier: UserTier = session?.user?.tier || "starter";
    // Form state
    const [formName, setFormName] = useState("");
    const [formAmount, setFormAmount] = useState("");
    const [formDueDate, setFormDueDate] = useState("1");
    const [formFrequency, setFormFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly");
    const [formIcon, setFormIcon] = useState("Receipt");
    const [formColor, setFormColor] = useState("#6366f1");
    const [formNotes, setFormNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedBillHistory, setSelectedBillHistory] = useState<Bill | null>(null);

    // View mode
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);

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
            toast.error("Gagal mengubah status");
        }
    }

    async function handleDelete() {
        if (!confirmDeleteId) return;
        try {
            const res = await apiFetch(`/api/bills/${confirmDeleteId}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                setBills(prev => prev.filter(b => b.id !== confirmDeleteId));
                toast.success("Tagihan dihapus");
            }
        } catch (error) {
            console.error("Error deleting bill:", error);
            toast.error(t("bills.errorDelete") || "Gagal menghapus tagihan");
        } finally {
            setConfirmDeleteId(null);
        }
    }

    async function handleSaveBill() {
        if (!formName || !formAmount) return;
        setIsSubmitting(true);
        try {
            let res;
            const body = {
                name: formName,
                amount: Number(formAmount),
                dueDate: Number(formDueDate),
                frequency: formFrequency,
                icon: formIcon,
                color: formColor,
                notes: formNotes || undefined,
            };

            if (editingBill) {
                res = await apiFetch(`/api/bills/${editingBill.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                res = await apiFetch("/api/bills", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }
            const result = await res.json();
            if (result.success) {
                await loadBills();
                setIsAddModalOpen(false);
                resetForm();
                toast.success(editingBill ? "Tagihan diperbarui" : "Tagihan ditambahkan");
            } else {
                toast.error("Gagal", result.error || "Gagal menyimpan tagihan");
            }
        } catch (error) {
            console.error("Error saving bill:", error);
            toast.error("Gagal", "Terjadi kesalahan jaringan");
        } finally {
            setIsSubmitting(false);
        }
    }

    function resetForm() {
        setFormName("");
        setFormAmount("");
        setFormDueDate("1");
        setFormFrequency("monthly");
        setFormIcon("Receipt");
        setFormColor("#6366f1");
        setFormNotes("");
        setEditingBill(null);
    }

    function populateEditForm(bill: Bill) {
        setEditingBill(bill);
        setFormName(bill.name);
        setFormAmount(bill.amount.toString());
        setFormDueDate(bill.dueDate.toString());
        setFormFrequency(bill.frequency || "monthly");
        setFormIcon(bill.icon || "Receipt");
        setFormColor(bill.color || "#6366f1");
        setFormNotes(bill.notes || "");
        setIsAddModalOpen(true);
    }

    const iconOptions = [
        { name: "Receipt", label: t("bills.title") },
        { name: "Zap", label: t("bills.frequency.yearly") },
        { name: "Wifi", label: "Internet" },
        { name: "Tv", label: "Streaming" },
        { name: "Music", label: "Musik" },
        { name: "Heart", label: "Kesehatan" },
        { name: "Bike", label: "Kendaraan" },
    ];

    const colorOptions = ["#6366f1", "#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#ec4899", "#8b5cf6", "#06b6d4"];

    const tabs = [
        { id: "all" as const, label: "Semua", count: bills.length },
        { id: "unpaid" as const, label: "Belum Bayar", count: bills.length - paidCount },
        { id: "paid" as const, label: "Lunas", count: paidCount },
    ];

    return (
        <div className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm p-1">
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
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-foreground tracking-tight">Tagihan</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Pantau Semua Kewajiban</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-5 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-xl shadow-sky-500/20"
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
                                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(day => (
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
                                    <NoBillsEmpty onAddNew={() => setIsAddModalOpen(true)} />
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
                                            {activeTab === "paid" ? "Belum ada yang lunas" : "Semua sudah lunas! 🎉"}
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
                                                onEdit={(b) => populateEditForm(b)}
                                                isStealthMode={isStealthMode}
                                                t={t}
                                                showReminder={needsReminder}
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

            {/* Add Bill Modal */}
            <Portal>
                <AnimatePresence>
                    {isAddModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998]"
                            />
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 z-[999999] bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl max-w-[500px] mx-auto"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground">{editingBill ? "Edit Tagihan" : "Tambah Tagihan"}</h2>
                                    <button
                                        onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Nama Tagihan</label>
                                        <input
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            placeholder="Listrik, Internet, Netflix..."
                                            value={formName}
                                            onChange={e => setFormName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jumlah (Rp)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            placeholder="0"
                                            value={formAmount}
                                            onChange={e => setFormAmount(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Tanggal Jatuh Tempo</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                                value={formDueDate}
                                                onChange={e => setFormDueDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Frekuensi</label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                                value={formFrequency}
                                                onChange={e => setFormFrequency(e.target.value as "monthly" | "weekly" | "yearly")}
                                            >
                                                <option value="monthly">Bulanan</option>
                                                <option value="weekly">Mingguan</option>
                                                <option value="yearly">Tahunan</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Ikon</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {iconOptions.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setFormIcon(opt.name)}
                                                    className={cn(
                                                        "px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                                                        formIcon === opt.name
                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-600"
                                                            : "border-slate-100 dark:border-slate-700 text-muted-foreground"
                                                    )}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Warna</label>
                                        <div className="flex gap-3">
                                            {colorOptions.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setFormColor(c)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full transition-all flex-shrink-0",
                                                        formColor === c ? "ring-2 ring-offset-2 ring-sky-500 scale-110 dark:ring-offset-slate-900" : ""
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">
                                            Catatan <span className="normal-case font-medium text-muted-foreground">(opsional)</span>
                                        </label>
                                        <input
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            placeholder="Catatan tambahan..."
                                            value={formNotes}
                                            onChange={e => setFormNotes(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSaveBill}
                                        disabled={isSubmitting || !formName || !formAmount}
                                        className={cn(
                                            "w-full py-4 rounded-xl font-bold text-white text-sm mt-2 transition-all",
                                            "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20",
                                            (isSubmitting || !formName || !formAmount) && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isSubmitting ? "Menyimpan..." : "Simpan Tagihan"}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDelete}
                title="Hapus Tagihan"
                description="Yakin ingin menghapus tagihan ini?"
                confirmText="Hapus"
            />
        </div>
    );
}
