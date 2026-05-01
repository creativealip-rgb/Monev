"use client";

import { useEffect } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface ExportMenuProps {
    show: boolean;
    onToggle: () => void;
    menuRef: React.RefObject<HTMLDivElement | null>;
    onExportCSV: () => void;
    onExportPDF: () => void;
}

export function ExportMenu({
    show,
    onToggle,
    menuRef,
    onExportCSV,
    onExportPDF,
}: ExportMenuProps) {
    useEffect(() => {
        if (!show) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onToggle();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [show, onToggle]);

    return (
        <div className="relative" ref={menuRef}>
            <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                aria-haspopup="menu"
                aria-expanded={show}
                aria-label="Export transaksi"
                className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    show
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400"
                )}
                title="Export"
            >
                <Download size={20} />
            </motion.button>
            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        aria-label="Pilihan export transaksi"
                        className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[200]"
                    >
                        <button
                            type="button"
                            role="menuitem"
                            onClick={onExportCSV}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                            <FileSpreadsheet size={18} className="text-emerald-500" />
                            Export CSV
                        </button>
                        <div className="h-px bg-slate-100 dark:bg-slate-800" />
                        <button
                            type="button"
                            role="menuitem"
                            onClick={onExportPDF}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <FileText size={18} className="text-red-500" />
                            Export PDF
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
