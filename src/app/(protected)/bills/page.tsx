"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Receipt, Check, Clock, AlertTriangle, Zap, Wifi, Tv, Music, Heart, Bike, X, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { Bill } from "@/types";
import { Portal } from "@/frontend/components/Portal";
import { BillCardSkeleton, NoBillsEmpty, useToast } from "@/frontend/components/UI";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    Receipt, Zap, Wifi, Tv, Music, Heart, Bike, Clock, AlertTriangle,
};

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

function BillIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
    const Icon = iconMap[name] || Receipt;
    return <Icon size={size} color={color} />;
}

function getStatusInfo(bill: Bill) {
    const today = new Date().getDate();
    const daysUntilDue = bill.dueDate - today;

    if (bill.isPaid) {
        return { label: "Lunas", color: "emerald", badge: "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" };
    }
    if (daysUntilDue < 0) {
        return { label: "Terlambat", color: "rose", badge: "bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800" };
    }
    if (daysUntilDue <= 3) {
        return { label: `${daysUntilDue} hari lagi`, color: "amber", badge: "bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
    }
    return { label: `Tgl ${bill.dueDate}`, color: "slate", badge: "bg-slate-50 dark:bg-slate-800 text-muted-foreground border-slate-200 dark:border-slate-700" };
}

function BillItem({
    bill,
    index,
    onDelete,
    onToggle
}: {
    bill: Bill;
    index: number;
    onDelete: (id: number) => void;
    onToggle: (id: number, e: React.MouseEvent) => void;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const status = getStatusInfo(bill);
    const today = new Date().getDate();
    const daysLeft = bill.dueDate - today;
    const isOverdue = daysLeft < 0 && !bill.isPaid;

    return (
        <motion.div
            key={bill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
                "card-clean p-5 group relative cursor-pointer transition-all",
                bill.isPaid
                    ? "bg-emerald-50/30 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/50"
                    : "hover:shadow-lg hover:shadow-sky-200/40 dark:hover:shadow-sky-900/20"
            )}
        >
            <div className="flex items-center gap-3 mb-3">
                <button
                    onClick={(e) => onToggle(bill.id, e)}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all",
                        bill.isPaid
                            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                    )}
                    style={!bill.isPaid ? { backgroundColor: bill.color + "20" } : {}}
                >
                    {bill.isPaid ? (
                        <Check size={20} strokeWidth={3} />
                    ) : (
                        <BillIcon name={bill.icon} color={bill.color} size={18} />
                    )}
                </button>
                <div className="flex-1">
                    <span className={cn(
                        "font-bold text-foreground text-[13px] block transition-all",
                        bill.isPaid ? "text-muted-foreground line-through" : ""
                    )}>
                        {bill.name}
                    </span>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {bill.frequency === "monthly" ? "Bulanan" : bill.frequency === "weekly" ? "Mingguan" : "Tahunan"}
                    </p>
                </div>
                <div className="text-right pr-2">
                    <span className={cn(
                        "font-bold text-[13px] block tabular-nums",
                        bill.isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    )}>
                        {formatCurrency(bill.amount)}
                    </span>
                    <span className={cn(
                        "text-[10px] tabular-nums",
                        isOverdue ? "text-rose-500 font-semibold" : "text-muted-foreground"
                    )}>
                        {!mounted ? "..." : status.label}
                    </span>
                </div>
            </div>

            {/* Days remaining bar */}
            {!bill.isPaid && (
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={cn(
                            "h-full rounded-full",
                            isOverdue ? "bg-rose-500" : daysLeft <= 3 ? "bg-amber-500" : "bg-sky-500"
                        )}
                    />
                </div>
            )}

            {bill.isPaid && (
                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <Check size={12} /> Lunas
                </p>
            )}

            {/* Delete button - positioned absolute top-right */}
            <button
                onClick={() => onDelete(bill.id)}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center"
            >
                <Trash2 size={14} />
            </button>
        </motion.div>
    );
}

export default function BillsPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid">("all");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const toast = useToast();

    // Form state
    const [formName, setFormName] = useState("");
    const [formAmount, setFormAmount] = useState("");
    const [formDueDate, setFormDueDate] = useState("1");
    const [formFrequency, setFormFrequency] = useState<"monthly" | "weekly" | "yearly">("monthly");
    const [formIcon, setFormIcon] = useState("Receipt");
    const [formColor, setFormColor] = useState("#6366f1");
    const [formNotes, setFormNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredBills = useMemo(() => {
        if (activeTab === "unpaid") return bills.filter(b => !b.isPaid);
        if (activeTab === "paid") return bills.filter(b => b.isPaid);
        return bills;
    }, [bills, activeTab]);

    const totalBills = useMemo(() => bills.reduce((s, b) => s + b.amount, 0), [bills]);
    const totalPaid = useMemo(() => bills.filter(b => b.isPaid).reduce((s, b) => s + b.amount, 0), [bills]);
    const totalUnpaid = useMemo(() => bills.filter(b => !b.isPaid).reduce((s, b) => s + b.amount, 0), [bills]);
    const paidCount = useMemo(() => bills.filter(b => b.isPaid).length, [bills]);

    useEffect(() => {
        loadBills();
        loadSubscriptions();
    }, []);

    // Subscription detection
    interface DetectedSub {
        merchant: string;
        amount: number;
        frequency: number;
        lastDate: string;
    }
    const [subscriptions, setSubscriptions] = useState<DetectedSub[]>([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [showSubs, setShowSubs] = useState(true);

    async function loadSubscriptions() {
        try {
            setSubsLoading(true);
            const res = await fetch("/api/subscriptions");
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
            const res = await fetch("/api/bills");
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
            const res = await fetch(`/api/bills/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ togglePaid: true }),
            });
            const result = await res.json();
            if (result.success) {
                const bill = bills.find(b => b.id === id);
                setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
                toast.success(bill?.isPaid ? "Tagihan dibatalkan" : "Tagihan lunas!");
            }
        } catch (error) {
            console.error("Error toggling bill:", error);
            toast.error("Gagal mengubah status");
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Yakin mau hapus tagihan ini?")) return;
        try {
            const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                setBills(prev => prev.filter(b => b.id !== id));
                toast.success("Tagihan dihapus");
            }
        } catch (error) {
            console.error("Error deleting bill:", error);
            toast.error("Gagal menghapus");
        }
    }

    async function handleAddBill() {
        if (!formName || !formAmount) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formName,
                    amount: Number(formAmount),
                    dueDate: Number(formDueDate),
                    frequency: formFrequency,
                    icon: formIcon,
                    color: formColor,
                    notes: formNotes || undefined,
                }),
            });
            const result = await res.json();
            if (result.success) {
                await loadBills();
                setIsAddModalOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error("Error adding bill:", error);
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
    }

    const iconOptions = [
        { name: "Receipt", label: "Tagihan" },
        { name: "Zap", label: "Listrik" },
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
        <div className="relative min-h-screen bg-sky-50 dark:bg-slate-950 pb-28">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 px-6 pt-safe pt-5 pb-4 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-sm font-bold text-foreground tracking-tight">Tagihan</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition-all"
                    >
                        <Plus size={18} />
                    </motion.button>
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
                        <p className="text-2xl font-bold tabular-nums">{loading ? "..." : formatCurrency(totalUnpaid)}</p>
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
                                                {sub.frequency}x terdeteksi • Terakhir {new Date(sub.lastDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                            </p>
                                        </div>
                                        <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                            {formatCurrency(sub.amount)}
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
                    </div>

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
                                    return (
                                        <BillItem key={bill.id} bill={bill} index={i} onDelete={handleDelete} onToggle={handleTogglePaid} />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.section>
            </motion.div>

            <Portal>
                <AnimatePresence>
                    {isAddModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAddModalOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground">Tambah Tagihan</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Nama Tagihan</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="contoh: Listrik PLN"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jumlah (Rp)</label>
                                        <input
                                            type="number"
                                            value={formAmount}
                                            onChange={(e) => setFormAmount(e.target.value)}
                                            placeholder="350000"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jatuh Tempo</label>
                                            <select
                                                value={formDueDate}
                                                onChange={(e) => setFormDueDate(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            >
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d}>Tanggal {d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Frekuensi</label>
                                            <select
                                                value={formFrequency}
                                                onChange={(e) => setFormFrequency(e.target.value as any)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
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
                                                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                                                        formIcon === opt.name
                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                                                            : "border-slate-100 dark:border-slate-700 text-muted-foreground"
                                                    )}
                                                >
                                                    <BillIcon name={opt.name} color={formIcon === opt.name ? "#0ea5e9" : "#94a3b8"} size={16} />
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
                                                        "w-8 h-8 rounded-full transition-all",
                                                        formColor === c ? "ring-2 ring-offset-2 ring-sky-500 scale-110 dark:ring-offset-slate-900" : ""
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Catatan (Opsional)</label>
                                        <input
                                            type="text"
                                            value={formNotes}
                                            onChange={(e) => setFormNotes(e.target.value)}
                                            placeholder="No pelanggan, dll"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>

                                    <button
                                        onClick={handleAddBill}
                                        disabled={!formName || !formAmount || isSubmitting}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-sm font-bold transition-all",
                                            formName && formAmount
                                                ? "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/25"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
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
        </div>
    );
}
