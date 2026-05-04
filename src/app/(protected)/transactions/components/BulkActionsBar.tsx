"use client";

import { Download, Trash2, CheckSquare, Square } from "lucide-react";
import { motion } from "framer-motion";

interface BulkActionsBarProps {
    selectedIds: Set<number>;
    filteredTransactionsLength: number;
    toggleSelectAll: () => void;
    bulkExport: () => void;
    bulkDelete: () => void;
    deletingId: number | null;
}

export function BulkActionsBar({
    selectedIds,
    filteredTransactionsLength,
    toggleSelectAll,
    bulkExport,
    bulkDelete,
    deletingId,
}: BulkActionsBarProps) {
    const allSelected = selectedIds.size === filteredTransactionsLength;
    const selectionLabel = `${selectedIds.size} transaksi dipilih`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            role="region"
            aria-label="Aksi massal transaksi"
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-safe z-50"
        >
            <div className="max-w-[500px] mx-auto flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleSelectAll}
                        aria-pressed={allSelected}
                        aria-label={allSelected ? "Batalkan pilih semua transaksi" : "Pilih semua transaksi yang tampil"}
                        className="shrink-0 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400"
                    >
                        {allSelected ? (
                            <CheckSquare size={20} className="text-sky-500" />
                        ) : (
                            <Square size={20} />
                        )}
                        <span className="hidden xs:inline">Pilih Semua</span>
                    </button>
                    <span
                        aria-live="polite"
                        className="truncate text-sm font-bold text-slate-900 dark:text-slate-100"
                    >
                        {selectionLabel}
                    </span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={bulkExport}
                        aria-label={`Export ${selectionLabel}`}
                        className="px-3 sm:px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        <span className="hidden xs:inline">Export</span>
                    </button>
                    <button
                        type="button"
                        onClick={bulkDelete}
                        disabled={deletingId !== null}
                        aria-label={`Hapus ${selectionLabel}`}
                        className="px-3 sm:px-4 py-2 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        <span className="hidden xs:inline">Hapus</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
