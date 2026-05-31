"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft, Plus, Users, TrendingDown, TrendingUp, Wallet
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/frontend/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { ErrorEmpty, useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { Debt } from "./types";
import { DebtCard, AddDebtSheet, PartialPaymentSheet } from "./components";
import { SplitBillGroupCard } from "./components/SplitBillGroupCard";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

export default function DebtsPage() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "split" | "regular" | "unpaid" | "paid">("unpaid");
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
    const [settlingId, setSettlingId] = useState<number | null>(null);
    const [settleDialog, setSettleDialog] = useState<{ debt: Debt } | null>(null);
    const [partialPaymentDebt, setPartialPaymentDebt] = useState<Debt | null>(null);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [splitViewMode, setSplitViewMode] = useState<"all" | "split" | "regular">("all");
    const [hasMounted, setHasMounted] = useState(false);
    const toast = useToast();

    const loadDebts = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await apiFetch("/api/debts");
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || "Gagal memuat hutang");
            }
            setDebts(data.data || []);
        } catch (error) {
            console.error("Error loading debts:", error);
            setLoadError(error instanceof Error ? error.message : "Gagal memuat hutang");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setHasMounted(true);
        void loadDebts();
    }, [loadDebts]);

    const closeSettleDialog = useCallback(() => {
        if (settlingId) return;
        setSettleDialog(null);
    }, [settlingId]);

    useEffect(() => {
        if (!settleDialog) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeSettleDialog();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [settleDialog, closeSettleDialog]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: showAddSheet || !!editingDebt || !!partialPaymentDebt || !!settleDialog }));
        return () => {
            window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: false }));
        };
    }, [showAddSheet, editingDebt, partialPaymentDebt, settleDialog]);

    const handleMarkPaid = async (id: number, status: "paid" | "unpaid", debt?: Debt) => {
        if (updatingStatusId || settlingId) return;
        if (status === "paid" && debt && (debt.direction === "owed" || debt.direction === "owe")) {
            setSettleDialog({ debt });
            return;
        }
        setUpdatingStatusId(id);
        try {
            const res = await apiFetch(`/api/debts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const result = await res.json();
            if (result.success || res.ok) {
                toast.success(status === "paid" ? "Lunas!" : "Dibatalkan", "Status diperbarui");
            } else {
                toast.error("Gagal", result.error || "Gagal memperbarui status");
            }
            await loadDebts();
        } catch {
            toast.error("Gagal", "Coba lagi");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleSettle = async (createTx: boolean, payFromBalance?: boolean) => {
        if (!settleDialog || settlingId) return;
        setSettlingId(settleDialog.debt.id);
        try {
            const res = await apiFetch("/api/debts/settle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ debtId: settleDialog.debt.id, createTx, payFromBalance }),
            });
            if (res.ok) {
                if (settleDialog.debt.direction === "owe") {
                    toast.success("Lunas!", createTx && payFromBalance ? "Saldo berkurang sesuai hutang" : "Ditandai lunas");
                } else {
                    toast.success("Lunas!", createTx ? "Saldo bertambah sesuai piutang" : "Ditandai lunas");
                }
            } else {
                toast.error("Gagal", "Gagal memproses pelunasan");
            }
        } catch {
            toast.error("Gagal", "Coba lagi");
        }
        setSettleDialog(null);
        setSettlingId(null);
        await loadDebts();
    };

    const handleDelete = (id: number) => {
        if (deletingId) return;
        setConfirmDeleteId(id);
    };

    const executeDelete = async (id: number) => {
        if (deletingId) return;
        setDeletingId(id);
        try {
            const res = await apiFetch(`/api/debts/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success || res.ok) {
                toast.success("Dihapus", "Catatan hutang dihapus");
            } else {
                toast.error("Gagal", result.error || "Gagal menghapus");
            }
            await loadDebts();
        } catch {
            toast.error("Gagal", "Coba lagi");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const filtered = debts.filter(d => d.status === activeTab);
    const unpaid = debts.filter(d => d.status === "unpaid");
    const oweUnpaid = unpaid.filter(d => d.direction === "owe");
    const owedUnpaid = unpaid.filter(d => d.direction === "owed");
    const totalOwe = oweUnpaid.reduce((s, d) => s + d.amount, 0);
    const totalOwed = owedUnpaid.reduce((s, d) => s + d.amount, 0);
    const netBalance = totalOwed - totalOwe;

    // Group split bills
    const splitBillsMap = new Map<string, Debt[]>();
    const regularDebts: Debt[] = [];

    debts.forEach(debt => {
        if (debt.splitGroupId && debt.status === "unpaid") {
            const existing = splitBillsMap.get(debt.splitGroupId) || [];
            splitBillsMap.set(debt.splitGroupId, [...existing, debt]);
        } else {
            regularDebts.push(debt);
        }
    });

    // Convert map to array
    const splitBillGroups = Array.from(splitBillsMap.entries()).map(([groupId, participants]) => {
        const totalAmount = participants.reduce((sum, p) => sum + p.amount, 0);
        const paidCount = participants.filter(p => p.status === "paid").length;
        const transactionDescription = participants[0]?.description || "Split Bill";
        const transactionId = participants[0]?.transactionId;
        
        return {
            groupId,
            transactionDescription,
            totalAmount,
            participants,
            paidCount,
            transactionId
        };
    });

    // Filter for display
    const displaySplitBills = activeTab === "unpaid" || activeTab === "split" ? splitBillGroups : [];
    const displayRegularDebts = activeTab === "unpaid" || activeTab === "regular" || activeTab === "all" 
        ? regularDebts.filter(d => d.status === "unpaid")
        : [];

    if (!hasMounted) {
        return <div className="min-h-screen pb-20 bg-sky-50 dark:bg-slate-950" suppressHydrationWarning />;
    }

    return (
        <div className="min-h-screen pb-20 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
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
                            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Hutang & Piutang</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Catat semua pinjaman</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Tambah hutang atau piutang"
                        onClick={() => setShowAddSheet(true)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <div className="px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
                {/* Summary Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-3"
                >
                    <div className="card-clean p-4 text-center">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-2">
                            <TrendingDown size={16} className="text-rose-500" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hutang</p>
                        <p className="text-sm font-black text-rose-600 mt-0.5 tabular-nums">
                            {formatCurrency(totalOwe).replace("Rp", "")}
                        </p>
                    </div>
                    <div className={cn(
                        "card-clean p-4 text-center border-2",
                        netBalance >= 0 ? "border-emerald-200 dark:border-emerald-800" : "border-rose-200 dark:border-rose-800"
                    )}>
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2",
                            netBalance >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-rose-50 dark:bg-rose-900/30"
                        )}>
                            <Wallet size={16} className={netBalance >= 0 ? "text-emerald-500" : "text-rose-500"} />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net</p>
                        <p className={cn("text-sm font-black mt-0.5 tabular-nums", netBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {netBalance >= 0 ? "+" : ""}{formatCurrency(Math.abs(netBalance)).replace("Rp", "")}
                        </p>
                    </div>
                    <div className="card-clean p-4 text-center">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-2">
                            <TrendingUp size={16} className="text-sky-500" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Piutang</p>
                        <p className="text-sm font-black text-sky-600 mt-0.5 tabular-nums">
                            {formatCurrency(totalOwed).replace("Rp", "")}
                        </p>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="space-y-2">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                        {(["unpaid", "paid"] as const).map(tab => (
                            <button
                                key={tab}
                                type="button"
                                aria-pressed={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                                    activeTab === tab
                                        ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                {tab === "unpaid" ? "Belum Lunas" : "Sudah Lunas"}
                            </button>
                        ))}
                    </div>
                    
                    {/* Split Bill Filter (only show for unpaid) */}
                    {activeTab === "unpaid" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2 p-1 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-800"
                        >
                            {(["all", "split", "regular"] as const).map(filter => (
                                <button
                                    key={filter}
                                    type="button"
                                    aria-pressed={splitViewMode === filter}
                                    onClick={() => setSplitViewMode(filter)}
                                    className={cn(
                                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                                        splitViewMode === filter
                                            ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {filter === "all" ? "Semua" : filter === "split" ? "Split Bill" : "Biasa"}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* List */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                        ))}
                    </div>
                ) : loadError ? (
                    <div className="card-clean">
                        <ErrorEmpty
                            title="Gagal memuat hutang"
                            description={loadError}
                            onRetry={() => { void loadDebts(); }}
                        />
                    </div>
                ) : activeTab === "unpaid" ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                    >
                        <AnimatePresence>
                            {/* Split Bill Groups */}
                            {(splitViewMode === "all" || splitViewMode === "split") && displaySplitBills.length > 0 && (
                                <>
                                    {splitViewMode === "all" && splitBillGroups.length > 0 && (
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-2">
                                            Split Bills ({splitBillGroups.length})
                                        </div>
                                    )}
                                    {displaySplitBills.map(group => (
                                        <SplitBillGroupCard
                                            key={group.groupId}
                                            groupId={group.groupId}
                                            transactionDescription={group.transactionDescription}
                                            totalAmount={group.totalAmount}
                                            participants={group.participants as any}
                                            paidCount={group.paidCount}
                                            transactionId={group.transactionId || undefined}
                                            onRefresh={loadDebts}
                                        />
                                    ))}
                                </>
                            )}
                            
                            {/* Regular Debts */}
                            {(splitViewMode === "all" || splitViewMode === "regular") && displayRegularDebts.length > 0 && (
                                <>
                                    {splitViewMode === "all" && splitBillGroups.length > 0 && displayRegularDebts.length > 0 && (
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-4">
                                            Hutang Biasa ({displayRegularDebts.length})
                                        </div>
                                    )}
                                    {displayRegularDebts.map(debt => (
                                        <DebtCard
                                            key={debt.id}
                                            debt={debt as any}
                                            onMarkPaid={handleMarkPaid}
                                            onDelete={handleDelete}
                                            onPartialPayment={setPartialPaymentDebt}
                                            onEdit={(d) => setEditingDebt(d)}
                                        />
                                    ))}
                                </>
                            )}
                            
                            {/* Empty States */}
                            {splitViewMode === "all" && displaySplitBills.length === 0 && displayRegularDebts.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <Users size={32} className="text-slate-400" />
                                    </div>
                                    <p className="font-bold text-foreground mb-1">Belum ada catatan aktif</p>
                                    <p className="text-xs text-muted-foreground max-w-[260px]">
                                        Catat hutang, piutang, atau split bill pertama agar semua pinjaman mudah dipantau.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSheet(true)}
                                        className="mt-5 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 active:scale-95"
                                    >
                                        Tambah Catatan
                                    </button>
                                </motion.div>
                            )}

                            {splitViewMode === "split" && displaySplitBills.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <Users size={32} className="text-slate-400" />
                                    </div>
                                    <p className="font-bold text-foreground mb-1">Belum ada split bill</p>
                                    <p className="text-xs text-muted-foreground">
                                        Split bill akan muncul setelah kamu split transaksi makan/belanja
                                    </p>
                                </motion.div>
                            )}
                            
                            {splitViewMode === "regular" && displayRegularDebts.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <Users size={32} className="text-slate-400" />
                                    </div>
                                    <p className="font-bold text-foreground mb-1">Belum ada hutang/piutang biasa</p>
                                    <p className="text-xs text-muted-foreground max-w-[260px]">
                                        Catat orang yang kamu pinjami atau pinjaman yang perlu kamu bayar.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddSheet(true)}
                                        className="mt-5 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 active:scale-95"
                                    >
                                        Tambah Hutang/Piutang
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    /* Paid Tab */
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                    >
                        <AnimatePresence>
                            {filtered.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                        <Wallet size={32} className="text-slate-400" />
                                    </div>
                                    <p className="font-bold text-foreground mb-1">Belum ada hutang lunas</p>
                                    <p className="text-xs text-muted-foreground">
                                        Hutang yang sudah selesai akan muncul di sini.
                                    </p>
                                </motion.div>
                            ) : filtered.map(debt => (
                                <DebtCard
                                    key={debt.id}
                                    debt={debt as any}
                                    onMarkPaid={handleMarkPaid}
                                    onDelete={handleDelete}
                                    onPartialPayment={setPartialPaymentDebt}
                                    onEdit={(d) => setEditingDebt(d)}
                                />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <AddDebtSheet
                isOpen={showAddSheet || !!editingDebt}
                onClose={() => { setShowAddSheet(false); setEditingDebt(null); }}
                onSuccess={() => { loadDebts(); setEditingDebt(null); }}
                editingDebt={editingDebt}
            />

            <PartialPaymentSheet
                debt={partialPaymentDebt}
                onClose={() => setPartialPaymentDebt(null)}
                onSuccess={loadDebts}
            />

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
                title="Hapus Catatan"
                description="Catatan hutang/piutang ini akan dihapus secara permanen. Lanjutkan?"
                loading={!!deletingId}
            />

            {/* Settle Dialog */}
            <Portal>
                <AnimatePresence>
                    {settleDialog && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999998]"
                                onClick={closeSettleDialog}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[999999] bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-[500px] mx-auto max-h-[90vh] overflow-y-auto"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="settle-debt-title"
                            >
                                {settleDialog.debt.direction === "owe" ? (
                                    // Hutang dialog
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                                            <TrendingDown size={24} className="text-rose-500" />
                                        </div>
                                        <h3 id="settle-debt-title" className="text-lg font-black text-foreground mb-1">Bayar Hutang</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Kamu akan membayar hutang ke <strong>{settleDialog.debt.debtorName}</strong> sebesar{" "}
                                            <strong className="text-rose-600">{formatCurrency(settleDialog.debt.amount)}</strong>
                                        </p>
                                        <p className="text-sm text-muted-foreground mb-6">
                                            Apakah kamu ingin memotong saldo utama untuk membayar hutang ini?
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSettle(true, true)}
                                                disabled={!!settlingId}
                                                className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {settlingId ? "Memproses..." : "Bayar & Potong Saldo"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSettle(true, false)}
                                                disabled={!!settlingId}
                                                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-foreground font-bold text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                Tandai Lunas Saja
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // Piutang dialog
                                    <>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                            <TrendingUp size={24} className="text-emerald-500" />
                                        </div>
                                        <h3 id="settle-debt-title" className="text-lg font-black text-foreground mb-1">Piutang Lunas!</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            <strong>{settleDialog.debt.debtorName}</strong> telah membayar{" "}
                                            <strong className="text-emerald-600">{formatCurrency(settleDialog.debt.amount)}</strong>
                                        </p>
                                        <p className="text-sm text-muted-foreground mb-6">
                                            Apakah kamu ingin menambahkan dana ini ke saldo utama sebagai transaksi <em>pemasukan</em>?
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSettle(true)}
                                                disabled={!!settlingId}
                                                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {settlingId ? "Memproses..." : "Ya, Tambah ke Saldo"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSettle(false)}
                                                disabled={!!settlingId}
                                                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-foreground font-bold text-sm transition-all hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                Tandai Lunas Saja
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    );
}