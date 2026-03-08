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
    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 pb-8 z-50"
        >
            <div className="max-w-[500px] mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400"
                    >
                        {selectedIds.size === filteredTransactionsLength ? (
                            <CheckSquare size={20} className="text-sky-500" />
                        ) : (
                            <Square size={20} />
                        )}
                        Pilih Semua
                    </button>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedIds.size} dipilih
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={bulkExport}
                        className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button
                        onClick={bulkDelete}
                        disabled={deletingId !== null}
                        className="px-4 py-2 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        Hapus
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
