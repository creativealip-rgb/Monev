"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Plus, Receipt, Check, Clock, AlertTriangle, Zap, Wifi, Tv, Music, Heart, Bike, X, Trash2, Edit3 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import { Bill } from "@/types";
import { createPortal } from "react-dom";

// Portal helper
function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

const iconMap: Record<string, any> = {
    Receipt, Zap, Wifi, Tv, Music, Heart, Bike, Clock, AlertTriangle,
};

function BillIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
    const Icon = iconMap[name] || Receipt;
    return <Icon size={size} style={{ color }} />;
}

function getStatusInfo(bill: Bill) {
    const today = new Date().getDate();
    const daysUntilDue = bill.dueDate - today;

    if (bill.isPaid) {
        return { label: "Lunas", color: "emerald", badge: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    }
    if (daysUntilDue < 0) {
        return { label: "Terlambat", color: "rose", badge: "bg-rose-50 text-rose-600 border-rose-200" };
    }
    if (daysUntilDue <= 3) {
        return { label: `${daysUntilDue} hari lagi`, color: "amber", badge: "bg-amber-50 text-amber-600 border-amber-200" };
    }
    return { label: `Tgl ${bill.dueDate}`, color: "slate", badge: "bg-slate-50 text-slate-500 border-slate-200" };
}

export default function BillsPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid">("all");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
                setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
            }
        } catch (error) {
            console.error("Error toggling bill:", error);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Yakin mau hapus tagihan ini?")) return;
        try {
            const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                setBills(prev => prev.filter(b => b.id !== id));
            }
        } catch (error) {
            console.error("Error deleting bill:", error);
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

    // Skeleton Loader
    const SkeletonLoader = () => (
        <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-28 bg-slate-100 rounded-full" />
                            <div className="h-3 w-20 bg-slate-50 rounded-full" />
                        </div>
                        <div className="space-y-1.5 flex flex-col items-end">
                            <div className="h-4 w-24 bg-slate-100 rounded-full" />
                            <div className="h-5 w-16 bg-slate-100 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="relative min-h-screen bg-slate-50 pb-28">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-12 pb-6 bg-white border-b border-slate-100"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Tagihan</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-all"
                    >
                        <Plus size={22} />
                    </motion.button>
                </div>
                <p className="text-sm text-slate-500 ml-13">Jangan sampai lupa bayar tagihan! 📋</p>
            </motion.header>

            {/* Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-5 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl text-white"
            >
                <p className="text-indigo-300 text-xs mb-2">Tagihan Bulan Ini</p>
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className="text-3xl font-bold">{loading ? "..." : formatCurrency(totalBills)}</p>
                        <p className="text-indigo-400 text-xs">
                            {loading ? "..." : `${paidCount}/${bills.length} sudah dibayar`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-400">
                            {loading ? "..." : formatCurrency(totalPaid)}
                        </p>
                        <p className="text-indigo-400 text-xs">lunas</p>
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

            {/* Tabs */}
            <div className="px-6 mt-6 mb-4">
                <div className="flex gap-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2",
                                activeTab === tab.id
                                    ? "bg-indigo-50 border-indigo-600 text-indigo-600"
                                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                            )}
                        >
                            {tab.label} ({loading ? "..." : tab.count})
                        </button>
                    ))}
                </div>
            </div>

            {/* Bills List */}
            <div className="px-6">
                {loading ? (
                    <SkeletonLoader />
                ) : filteredBills.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Receipt size={24} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">
                            {activeTab === "paid" ? "Belum ada yang lunas" : activeTab === "unpaid" ? "Semua sudah lunas! 🎉" : "Belum ada tagihan"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {activeTab === "all" ? "Tambah tagihan rutin untuk tracking" : ""}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {filteredBills.map((bill, i) => {
                            const status = getStatusInfo(bill);
                            return (
                                <motion.div
                                    key={bill.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.06 }}
                                    className={cn(
                                        "bg-white p-5 rounded-2xl border shadow-sm transition-all group",
                                        bill.isPaid
                                            ? "border-emerald-100 bg-emerald-50/30"
                                            : "border-slate-100 hover:shadow-md"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Toggle button */}
                                        <button
                                            onClick={(e) => handleTogglePaid(bill.id, e)}
                                            className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                                                bill.isPaid
                                                    ? "bg-emerald-100 text-emerald-600"
                                                    : "bg-slate-50 hover:bg-indigo-50"
                                            )}
                                            style={!bill.isPaid ? { backgroundColor: bill.color + "15" } : {}}
                                        >
                                            {bill.isPaid ? (
                                                <Check size={22} strokeWidth={3} />
                                            ) : (
                                                <BillIcon name={bill.icon} color={bill.color} />
                                            )}
                                        </button>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "font-semibold text-sm",
                                                bill.isPaid ? "text-slate-400 line-through" : "text-slate-800"
                                            )}>
                                                {bill.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                                    status.badge
                                                )}>
                                                    {status.label}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {bill.frequency === "monthly" ? "Bulanan" : bill.frequency === "weekly" ? "Mingguan" : "Tahunan"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Amount & Actions */}
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-bold text-sm",
                                                    bill.isPaid ? "text-slate-400" : "text-slate-900"
                                                )}>
                                                    {formatCurrency(bill.amount)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(bill.id)}
                                                className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Bill Modal */}
            <Portal>
                <AnimatePresence>
                    {isAddModalOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsAddModalOpen(false)}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[85vh] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">Tambah Tagihan</h2>
                                    <button
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Nama Tagihan</label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            placeholder="contoh: Listrik PLN"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Jumlah (Rp)</label>
                                        <input
                                            type="number"
                                            value={formAmount}
                                            onChange={(e) => setFormAmount(e.target.value)}
                                            placeholder="350000"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>

                                    {/* Due Date & Frequency */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Jatuh Tempo</label>
                                            <select
                                                value={formDueDate}
                                                onChange={(e) => setFormDueDate(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-colors text-sm bg-white"
                                            >
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d}>Tanggal {d}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Frekuensi</label>
                                            <select
                                                value={formFrequency}
                                                onChange={(e) => setFormFrequency(e.target.value as any)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-colors text-sm bg-white"
                                            >
                                                <option value="monthly">Bulanan</option>
                                                <option value="weekly">Mingguan</option>
                                                <option value="yearly">Tahunan</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Icon picker */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Ikon</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {iconOptions.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setFormIcon(opt.name)}
                                                    className={cn(
                                                        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                                                        formIcon === opt.name
                                                            ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                                                            : "border-slate-100 text-slate-500"
                                                    )}
                                                >
                                                    <BillIcon name={opt.name} color={formIcon === opt.name ? "#4f46e5" : "#94a3b8"} size={16} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color picker */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Warna</label>
                                        <div className="flex gap-3">
                                            {colorOptions.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setFormColor(c)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full transition-all",
                                                        formColor === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : ""
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Catatan (Opsional)</label>
                                        <input
                                            type="text"
                                            value={formNotes}
                                            onChange={(e) => setFormNotes(e.target.value)}
                                            placeholder="No pelanggan, dll"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-colors text-sm"
                                        />
                                    </div>

                                    {/* Submit */}
                                    <button
                                        onClick={handleAddBill}
                                        disabled={!formName || !formAmount || isSubmitting}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-sm font-bold transition-all",
                                            formName && formAmount
                                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
                                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
