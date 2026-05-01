"use client";

import { useEffect } from "react";
import { cn } from "@/frontend/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";

interface TransactionSortMenuProps {
    sortBy: "date" | "amount" | "category";
    setSortBy: (sortBy: "date" | "amount" | "category") => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (sortOrder: "asc" | "desc") => void;
    showSortMenu: boolean;
    setShowSortMenu: (show: boolean) => void;
}

export function TransactionSortMenu({
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showSortMenu,
    setShowSortMenu,
}: TransactionSortMenuProps) {
    const sortLabel = sortBy === "date" ? "Tanggal" : sortBy === "amount" ? "Jumlah" : "Kategori";

    useEffect(() => {
        if (!showSortMenu) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowSortMenu(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showSortMenu, setShowSortMenu]);

    return (
        <div className="relative">
            <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSortMenu(!showSortMenu)}
                aria-haspopup="menu"
                aria-expanded={showSortMenu}
                aria-label={`Urutkan transaksi. Aktif: ${sortLabel} ${sortOrder === "desc" ? "menurun" : "menaik"}`}
                className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    sortBy !== "date" || sortOrder !== "desc"
                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400"
                )}
            >
                <ArrowUpDown size={20} />
            </motion.button>
            {showSortMenu && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="menu"
                    aria-label="Pilihan urutan transaksi"
                    className="absolute right-0 top-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 min-w-[160px] z-50"
                >
                    <p className="text-xs font-bold text-muted-foreground px-2 py-1 uppercase">Urutkan</p>
                    {[
                        { id: "date", label: "Tanggal" },
                        { id: "amount", label: "Jumlah" },
                        { id: "category", label: "Kategori" }
                    ].map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={sortBy === option.id}
                            aria-label={`Urutkan berdasarkan ${option.label}${sortBy === option.id ? `, ${sortOrder === "desc" ? "menurun" : "menaik"}` : ""}`}
                            onClick={() => {
                                if (sortBy === option.id) {
                                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                                } else {
                                    setSortBy(option.id as typeof sortBy);
                                    setSortOrder("desc");
                                }
                                setShowSortMenu(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between",
                                sortBy === option.id
                                    ? "bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            )}
                        >
                            {option.label}
                            {sortBy === option.id && (
                                <span className="text-xs">{sortOrder === "desc" ? "\u2193" : "\u2191"}</span>
                            )}
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
