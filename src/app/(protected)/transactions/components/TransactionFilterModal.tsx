"use client";

import { Portal } from "@/frontend/components/Portal";
import { cn } from "@/frontend/lib/utils";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

interface TransactionFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filterType: "all" | "expense" | "income";
    setFilterType: (type: "all" | "expense" | "income") => void;
    filterCategory: number | "all";
    setFilterCategory: (category: number | "all") => void;
    categories: Category[];
    dateRange: { start: string; end: string } | null;
    setDateRange: (
        range:
            | { start: string; end: string }
            | null
            | ((
                prev: { start: string; end: string } | null
            ) => { start: string; end: string } | null)
    ) => void;
    amountRange: { min: number; max: number } | null;
    setAmountRange: (
        range:
            | { min: number; max: number }
            | null
            | ((
                prev: { min: number; max: number } | null
            ) => { min: number; max: number } | null)
    ) => void;
}

export function TransactionFilterModal({
    isOpen,
    onClose,
    filterType,
    setFilterType,
    filterCategory,
    setFilterCategory,
    categories,
    dateRange,
    setDateRange,
    amountRange,
    setAmountRange,
}: TransactionFilterModalProps) {
    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: "100%" }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: "100%" }}
                            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px]"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-bold text-foreground">Filter Transaksi</h2>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <p className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Tipe Transaksi</p>
                                    <div className="flex gap-3">
                                        {[
                                            { id: "all", label: "Semua" },
                                            { id: "expense", label: "Pengeluaran" },
                                            { id: "income", label: "Pemasukan" }
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setFilterType(type.id as "all" | "expense" | "income")}
                                                className={cn(
                                                    "flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all border-2",
                                                    filterType === type.id
                                                        ? "bg-sky-50 dark:bg-sky-900/50 border-sky-500 text-sky-600 dark:text-sky-400"
                                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                                                )}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Kategori</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setFilterCategory("all")}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                                                filterCategory === "all"
                                                    ? "bg-sky-500 border-sky-500 text-white"
                                                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                                            )}
                                        >
                                            Semua
                                        </button>
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setFilterCategory(cat.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 flex items-center gap-2",
                                                    filterCategory === cat.id
                                                        ? "bg-sky-500 border-sky-500 text-white"
                                                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-600"
                                                )}
                                            >
                                                {filterCategory === cat.id && <Check size={12} />}
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <p className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Rentang Tanggal</p>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground mb-1 block">Mulai</label>
                                            <input
                                                type="date"
                                                value={dateRange?.start || ""}
                                                onChange={(e) => setDateRange((prev: { start: string; end: string } | null) => prev ? { ...prev, start: e.target.value } : { start: e.target.value, end: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground mb-1 block">Akhir</label>
                                            <input
                                                type="date"
                                                value={dateRange?.end || ""}
                                                onChange={(e) => setDateRange((prev: { start: string; end: string } | null) => prev ? { ...prev, end: e.target.value } : { start: e.target.value, end: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        {[
                                            { label: "Hari ini", days: 0 },
                                            { label: "Minggu ini", days: 7 },
                                            { label: "Bulan ini", days: 30 },
                                        ].map((preset) => (
                                            <button
                                                key={preset.label}
                                                onClick={() => {
                                                    const end = new Date();
                                                    const start = new Date();
                                                    start.setDate(end.getDate() - preset.days);
                                                    setDateRange({
                                                        start: start.toISOString().split("T")[0],
                                                        end: end.toISOString().split("T")[0]
                                                    });
                                                }}
                                                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 transition-colors"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amount Range */}
                                <div>
                                    <p className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Rentang Jumlah</p>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground mb-1 block">Min (Rp)</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={amountRange?.min || ""}
                                                onChange={(e) => setAmountRange((prev: { min: number; max: number } | null) => prev ? { ...prev, min: Number(e.target.value) } : { min: Number(e.target.value), max: 999999999 })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-muted-foreground mb-1 block">Max (Rp)</label>
                                            <input
                                                type="number"
                                                placeholder="999999999"
                                                value={amountRange?.max || ""}
                                                onChange={(e) => setAmountRange((prev: { min: number; max: number } | null) => prev ? { ...prev, max: Number(e.target.value) } : { min: 0, max: Number(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => {
                                            setFilterCategory("all");
                                            setFilterType("all");
                                            setDateRange(null);
                                            setAmountRange(null);
                                        }}
                                        className="flex-1 py-4 px-6 rounded-2xl text-sm font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                        Reset Filter
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-[2] py-4 px-6 rounded-2xl text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-500/25 transition-all"
                                    >
                                        Terapkan Filter
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}
