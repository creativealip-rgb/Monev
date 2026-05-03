"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft, Plus, ToggleLeft, ToggleRight, Trash2, Repeat,
    Calendar, TrendingDown, TrendingUp, X, Pencil
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { ErrorEmpty, useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";

interface RecurringTx {
    id: number;
    userId: number;
    amount: number;
    description: string;
    categoryId: number | null;
    type: "expense" | "income";
    frequency: "daily" | "weekly" | "monthly";
    nextRunAt: string;
    isActive: boolean;
    createdAt: string;
}

interface Category {
    id: number;
    name: string;
    color: string;
    type: string;
}

const FREQ_LABELS: Record<string, { label: string; short: string }> = {
    daily: { label: "Harian", short: "/ hari" },
    weekly: { label: "Mingguan", short: "/ minggu" },
    monthly: { label: "Bulanan", short: "/ bulan" },
};

export default function RecurringPage() {
    const [items, setItems] = useState<RecurringTx[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const toast = useToast();

    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<RecurringTx | null>(null);

    const [form, setForm] = useState({
        description: "",
        amount: "",
        type: "expense" as "expense" | "income",
        frequency: "monthly" as "daily" | "weekly" | "monthly",
        categoryId: "",
    });

    const resetForm = () => {
        setForm({ description: "", amount: "", type: "expense", frequency: "monthly", categoryId: "" });
        setEditingItem(null);
    };

    const openCreateForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (item: RecurringTx) => {
        setEditingItem(item);
        setForm({ description: item.description, amount: item.amount.toString(), type: item.type, frequency: item.frequency, categoryId: item.categoryId?.toString() || "" });
        setShowForm(true);
    };

    const sanitizeAmountInput = (value: string) => value.replace(/[^0-9]/g, "");

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [res, catRes] = await Promise.all([
                apiFetch("/api/recurring"),
                apiFetch("/api/categories", { silent: true }),
            ]);
            const data = await res.json();
            const catData = await catRes.json();
            if (!data.success) {
                throw new Error(data.error || "Gagal memuat transaksi berulang");
            }
            setItems(data.data || []);
            if (catData.success) {
                setCategories(catData.data || []);
            }
        } catch (error) {
            console.error("Error loading recurring transactions:", error);
            setLoadError(error instanceof Error ? error.message : "Gagal memuat transaksi berulang");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: showForm }));
        return () => {
            window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: false }));
        };
    }, [showForm]);

    useEffect(() => {
        if (!showForm) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isSubmitting) closeForm();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showForm, isSubmitting]);

    const handleToggle = async (item: RecurringTx) => {
        if (togglingId || deletingId || isSubmitting) return;
        setTogglingId(item.id);
        try {
            const res = await apiFetch(`/api/recurring/${item.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !item.isActive }),
            });
            const result = await res.json();
            if (result.success) {
                toast.success(item.isActive ? "Dinonaktifkan" : "Diaktifkan", item.description);
                await load();
            } else {
                toast.error("Gagal", result.error || "Gagal mengubah status");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan jaringan");
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = (id: number) => {
        if (deletingId || togglingId || isSubmitting) return;
        setConfirmDeleteId(id);
    };

    const executeDelete = async (id: number) => {
        if (deletingId) return;
        setDeletingId(id);
        try {
            const res = await apiFetch(`/api/recurring/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                toast.success("Dihapus", "Transaksi berulang dihapus");
                load();
            } else {
                toast.error("Gagal", result.error || "Gagal menghapus");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan jaringan");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const handleCreate = async () => {
        if (isSubmitting) return;

        const amountValue = Number(form.amount);
        if (!form.description.trim() || !Number.isFinite(amountValue) || amountValue <= 0) {
            toast.error("Form tidak lengkap", "Deskripsi dan nominal valid wajib diisi");
            return;
        }

        setIsSubmitting(true);
        try {
            const body = {
                ...form,
                description: form.description.trim(),
                amount: amountValue,
                categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
            };

            let res;
            if (editingItem) {
                res = await apiFetch(`/api/recurring/${editingItem.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                res = await apiFetch("/api/recurring", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }
            const result = await res.json();
            if (result.success) {
                toast.success("Berhasil!", editingItem ? "Transaksi berulang diperbarui" : "Transaksi berulang ditambahkan");
                setShowForm(false);
                setForm({ description: "", amount: "", type: "expense", frequency: "monthly", categoryId: "" });
                setEditingItem(null);
                await load();
            } else {
                toast.error("Gagal", result.error || "Gagal menyimpan");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan jaringan");
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeForm = () => {
        if (isSubmitting) return;
        setShowForm(false);
        resetForm();
    };

    const filtered = { active: items.filter(i => i.isActive), inactive: items.filter(i => !i.isActive) };

    // Summary stats
    const totalMonthlyIn = items.filter(i => i.isActive && i.type === "income" && i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);
    const totalMonthlyOut = items.filter(i => i.isActive && i.type === "expense" && i.frequency === "monthly").reduce((s, i) => s + i.amount, 0);

    return (
        <div className="min-h-screen pb-36 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-2 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 pb-3 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            aria-label="Kembali ke dashboard"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Transaksi Berulang</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Otomatis catat setiap periode</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateForm}
                        aria-label="Tambah transaksi berulang"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <div className="px-4 sm:px-5 pt-4 sm:pt-5 space-y-5">
                {/* Summary mini cards */}
                {(totalMonthlyIn > 0 || totalMonthlyOut > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-3"
                    >
                        <div className="card-clean p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-emerald-500/10 -translate-y-4 translate-x-4" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Pemasukan / bln</p>
                            <p className="text-lg font-black text-emerald-600 tabular-nums leading-tight">
                                {formatCurrency(totalMonthlyIn).replace("Rp", "Rp ")}
                            </p>
                        </div>
                        <div className="card-clean p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-rose-500/10 -translate-y-4 translate-x-4" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Pengeluaran / bln</p>
                            <p className="text-lg font-black text-rose-600 tabular-nums leading-tight">
                                {formatCurrency(totalMonthlyOut).replace("Rp", "Rp ")}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
                    </div>
                ) : loadError ? (
                    <div className="card-clean">
                        <ErrorEmpty
                            title="Gagal memuat transaksi berulang"
                            description={loadError}
                            onRetry={() => { void load(); }}
                        />
                    </div>
                ) : items.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-20 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mb-5 shadow-inner">
                            <Repeat size={36} className="text-emerald-400" />
                        </div>
                        <p className="font-black text-foreground text-lg">Belum ada transaksi berulang</p>
                        <p className="text-xs text-muted-foreground mt-2 max-w-[220px] leading-relaxed">
                            Tambahkan gaji, tagihan rutin, Netflix, atau pengeluaran mingguan kamu
                        </p>
                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="mt-6 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            Tambah Sekarang
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-5">
                        {filtered.active.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Aktif ({filtered.active.length})
                                    </p>
                                </div>
                                <div className="space-y-2.5">
                                    {filtered.active.map(item => (
                                        <RecurringItem key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEditForm} />
                                    ))}
                                </div>
                            </section>
                        )}
                        {filtered.inactive.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Nonaktif ({filtered.inactive.length})
                                    </p>
                                </div>
                                <div className="space-y-2.5 opacity-55">
                                    {filtered.inactive.map(item => (
                                        <RecurringItem key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEditForm} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Add Form Bottom Sheet */}
            <Portal>
                <AnimatePresence>
                    {showForm && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                                onClick={closeForm}
                                aria-hidden="true"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-t-[2.5rem] p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-12 z-[999999] shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 max-w-[500px] mx-auto"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="recurring-sheet-title"
                            >
                                {/* Title row */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 id="recurring-sheet-title" className="text-xl font-bold text-foreground">{editingItem ? "Edit Transaksi" : "Transaksi Berulang Baru"}</h2>
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        disabled={isSubmitting}
                                        aria-label="Tutup form transaksi berulang"
                                        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Type Toggle */}
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jenis</label>
                                        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                            {(["expense", "income"] as const).map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, type: t, categoryId: "" }))}
                                                    aria-pressed={form.type === t}
                                                    className={cn(
                                                        "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                                        form.type === t
                                                            ? t === "expense"
                                                                ? "bg-rose-500 text-white shadow-sm"
                                                                : "bg-emerald-500 text-white shadow-sm"
                                                            : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {t === "expense"
                                                        ? <><TrendingDown size={14} /> Pengeluaran</>
                                                        : <><TrendingUp size={14} /> Pemasukan</>
                                                    }
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label htmlFor="recurring-description" className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Nama Transaksi</label>
                                        <input
                                            id="recurring-description"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            placeholder="Gaji, Netflix, Uang Kos..."
                                            value={form.description}
                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label htmlFor="recurring-amount" className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jumlah (Rp)</label>
                                        <input
                                            id="recurring-amount"
                                            type="text"
                                            inputMode="numeric"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            placeholder="0"
                                            value={form.amount}
                                            onChange={e => setForm(f => ({ ...f, amount: sanitizeAmountInput(e.target.value) }))}
                                        />
                                    </div>

                                    {/* Frequency */}
                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Frekuensi</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(["daily", "weekly", "monthly"] as const).map(freq => (
                                                <button
                                                    key={freq}
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, frequency: freq }))}
                                                    aria-pressed={form.frequency === freq}
                                                    className={cn(
                                                        "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 flex flex-col items-center gap-1",
                                                        form.frequency === freq
                                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
                                                            : "border-slate-100 dark:border-slate-700 text-muted-foreground"
                                                    )}
                                                >
                                                    <Repeat size={15} strokeWidth={2.4} />
                                                    {FREQ_LABELS[freq].label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label htmlFor="recurring-category" className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Kategori <span className="normal-case font-medium text-muted-foreground">(opsional)</span></label>
                                        <select
                                            id="recurring-category"
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            value={form.categoryId}
                                            onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {categories.filter(c => c.type === form.type).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="button"
                                        onClick={handleCreate}
                                        disabled={!form.description.trim() || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0 || isSubmitting}
                                        className={cn(
                                            "w-full py-4 rounded-xl font-bold text-white text-sm transition-all mt-2 disabled:cursor-not-allowed",
                                            form.type === "expense"
                                                ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                                                : "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20",
                                            (!form.description.trim() || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0 || isSubmitting) && "opacity-40 cursor-not-allowed"
                                        )}
                                    >
                                        {isSubmitting ? "Menyimpan..." : editingItem ? "Perbarui Transaksi" : "Simpan Transaksi"}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => { if (!deletingId) setConfirmDeleteId(null); }}
                onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
                title="Hapus Transaksi Berulang"
                description="Transaksi berulang ini akan dihapus secara permanen. Lanjutkan?"
                loading={!!deletingId}
            />
        </div>
    );
}

function RecurringItem({
    item, onToggle, onDelete, onEdit
}: {
    item: RecurringTx;
    onToggle: (item: RecurringTx) => void;
    onDelete: (id: number) => void;
    onEdit?: (item: RecurringTx) => void;
}) {
    const isIncome = item.type === "income";
    const freq = FREQ_LABELS[item.frequency];

    return (
        <motion.div
            layout
            role="group"
            aria-label={`${item.description}, ${isIncome ? "pemasukan" : "pengeluaran"} berulang ${freq.label}, ${formatCurrency(item.amount)}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card-clean p-4"
        >
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 relative",
                    isIncome ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-rose-100 dark:bg-rose-900/40"
                )}>
                    {isIncome
                        ? <TrendingUp size={20} className="text-emerald-600" />
                        : <TrendingDown size={20} className="text-rose-600" />
                    }
                    {/* Frequency dot */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                        <Repeat size={9} className={isIncome ? "text-emerald-600" : "text-rose-600"} strokeWidth={2.8} />
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={cn("text-xs font-black", isIncome ? "text-emerald-600" : "text-rose-600")}>
                            {isIncome ? "+" : "-"}{formatCurrency(item.amount)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground font-semibold">
                            {freq.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Calendar size={9} />
                            {new Date(item.nextRunAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onToggle(item)}
                        aria-pressed={item.isActive}
                        aria-label={`${item.isActive ? "Nonaktifkan" : "Aktifkan"} ${item.description}`}
                        className={cn(
                            "p-2 rounded-xl transition-colors",
                            item.isActive ? "hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        {item.isActive
                            ? <ToggleRight size={24} className="text-emerald-500" />
                            : <ToggleLeft size={24} className="text-slate-300 dark:text-slate-600" />
                        }
                    </button>
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => onEdit(item)}
                            aria-label={`Edit ${item.description}`}
                            className="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
                        >
                            <Pencil size={15} className="text-sky-400" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        aria-label={`Hapus ${item.description}`}
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <Trash2 size={15} className="text-red-400" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
