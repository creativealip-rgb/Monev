"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, Receipt, Check, Clock, AlertTriangle, Zap, Wifi, Tv, Music, Heart, Bike, X, Trash2, Edit3 } from "lucide-react";
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
    return { label: `Tgl ${bill.dueDate}`, color: "slate", badge: "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700" };
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

    return (
        <motion.div
            key={bill.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06 }}
            className={cn(
                "bg-white dark:bg-slate-800 p-5 rounded-2xl border shadow-sm transition-all group",
                bill.isPaid
                    ? "border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/20"
                    : "border-slate-100 dark:border-slate-700 hover:shadow-md"
            )}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={(e) => onToggle(bill.id, e)}
                    className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                        bill.isPaid
                            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600"
                    )}
                    style={!bill.isPaid ? { backgroundColor: bill.color + "20" } : {}}
                >
                    {bill.isPaid ? (
                        <Check size={22} strokeWidth={3} />
                    ) : (
                        <BillIcon name={bill.icon} color={bill.color} />
                    )}
                </button>
                <div className="flex-1 min-w-0 pr-4">
                    <p className={cn(
                        "font-bold text-[15px] leading-tight transition-all",
                        bill.isPaid ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-900 dark:text-white"
                    )}>
                        {bill.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-lg border shadow-sm",
                            status.badge
                        )}>
                            {!mounted ? "..." : status.label}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            {bill.frequency === "monthly" ? "Bulanan" : bill.frequency === "weekly" ? "Mingguan" : "Tahunan"}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end justify-center shrink-0">
                    <p className={cn(
                        "font-medium text-[15px] tracking-tight tabular-nums",
                        bill.isPaid ? "text-slate-300 dark:text-slate-600" : "text-slate-900 dark:text-white"
                    )}>
                        {!mounted ? "..." : formatCurrency(bill.amount)}
                    </p>
                    <AnimatePresence>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onDelete(bill.id)}
                            className="mt-2 text-[10px] font-bold text-rose-400 dark:text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={10} />
                            Hapus
                        </motion.button>
                    </AnimatePresence>
                </div>
            </div>
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
    }, []);

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
                className="sticky top-0 z-50 px-6 pt-safe pb-4 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Tagihan</h1>
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
                className="mx-6 mt-6 p-5 bg-gradient-to-br from-sky-500 to-cyan-600 rounded-2xl text-white shadow-xl shadow-sky-500/20"
            >
                <p className="text-cyan-200 text-xs mb-2">Tagihan Bulan Ini</p>
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 mb-4">
                    <div className="min-w-fit">
                        <p className="text-3xl font-bold tracking-tight">{loading ? "..." : formatCurrency(totalBills)}</p>
                        <p className="text-cyan-200 text-[10px] font-medium uppercase tracking-wider">
                            {loading ? "..." : `${paidCount}/${bills.length} sudah dibayar`}
                        </p>
                    </div>
                    <div className="text-right min-w-fit flex flex-col items-end">
                        <p className="text-xl font-bold text-emerald-300 leading-none">
                            {loading ? "..." : formatCurrency(totalPaid)}
                        </p>
                        <p className="text-cyan-200 text-[10px] font-medium uppercase tracking-wider">lunas</p>
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
                {!loading && totalUnpaid > 0 && (
                    <p className="text-xs text-amber-300 mt-2 font-semibold">
                        ⚠️ Sisa {formatCurrency(totalUnpaid)} belum dibayar
                    </p>
                )}
            </motion.div>

            <div className="px-6 mt-6 mb-4">
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2",
                                activeTab === tab.id
                                    ? "bg-sky-50 dark:bg-sky-900/50 border-sky-500 text-sky-600 dark:text-sky-400"
                                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                            )}
                        >
                            {tab.label} ({loading ? "..." : tab.count})
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-6">
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
                            <p className="text-slate-500 dark:text-slate-400 font-bold">
                                {activeTab === "paid" ? "Belum ada yang lunas" : "Semua sudah lunas! 🎉"}
                            </p>
                        </motion.div>
                    )
                ) : (
                    <div className="space-y-3">
                        {filteredBills.map((bill, i) => {
                            return (
                                <BillItem key={bill.id} bill={bill} index={i} onDelete={handleDelete} onToggle={handleTogglePaid} />
                            );
                        })}
                    </div>
                )}
            </div>

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
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tambah Tagihan</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 block">Nama Tagihan</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="contoh: Listrik PLN"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 block">Jumlah (Rp)</label>
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
                                            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 block">Jatuh Tempo</label>
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
                                            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 block">Frekuensi</label>
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
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 block">Ikon</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {iconOptions.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setFormIcon(opt.name)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                                                        formIcon === opt.name
                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                                                            : "border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                                                    )}
                                                >
                                                    <BillIcon name={opt.name} color={formIcon === opt.name ? "#0ea5e9" : "#94a3b8"} size={16} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 block">Warna</label>
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
                                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 block">Catatan (Opsional)</label>
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
