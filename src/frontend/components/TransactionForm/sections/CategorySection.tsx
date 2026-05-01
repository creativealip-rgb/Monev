"use client";

import { motion } from "framer-motion";
import { Wallet, Utensils, Car, Gamepad2, ShoppingBag, Heart, BookOpen, Receipt, TrendingUp as InvestIcon, Banknote, Briefcase, MoreHorizontal } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import type { Category, TransactionType } from "../types";

const categoryIcons: Record<string, typeof Wallet> = {
    "Utensils": Utensils,
    "Car": Car,
    "Gamepad2": Gamepad2,
    "ShoppingBag": ShoppingBag,
    "Heart": Heart,
    "BookOpen": BookOpen,
    "Receipt": Receipt,
    "TrendingUp": InvestIcon,
    "Banknote": Banknote,
    "Briefcase": Briefcase,
    "MoreHorizontal": MoreHorizontal,
};

interface CategorySectionProps {
    categories: Category[];
    selectedCategory: number | null;
    transactionType: TransactionType;
    onCategorySelect: (categoryId: number) => void;
}

export function CategorySection({
    categories,
    selectedCategory,
    transactionType,
    onCategorySelect,
}: CategorySectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Kategori</p>
                {selectedCategory && (
                    <span className="text-[10px] font-bold text-sky-500 uppercase">Terpilih</span>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {categories.length === 0 && (
                    <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center dark:border-slate-800 dark:bg-slate-900/40">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kategori belum tersedia.</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Transaksi tetap bisa disimpan tanpa kategori.</p>
                    </div>
                )}
                {categories.map((cat) => {
                    const Icon = categoryIcons[cat.icon] || Wallet;
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => onCategorySelect(cat.id)}
                            aria-pressed={isSelected}
                            aria-label={`Pilih kategori ${cat.name}`}
                            className={cn(
                                "p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                                isSelected
                                    ? transactionType === "expense"
                                        ? "border-rose-300 dark:border-rose-600 bg-rose-50 dark:bg-rose-900/20"
                                        : "border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                                    : "bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            )}
                        >
                            <div className="w-9 h-9 rounded-xl mb-2 flex items-center justify-center relative z-10" style={{ backgroundColor: cat.color + "15" }}>
                                <Icon size={18} style={{ color: cat.color }} />
                            </div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs relative z-10">{cat.name}</p>
                            {isSelected && (
                                <motion.div
                                    layoutId="selected-check"
                                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm"
                                >
                                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                                </motion.div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
