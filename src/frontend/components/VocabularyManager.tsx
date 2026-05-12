"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface VocabularyItem {
    id: number;
    word: string;
    type: "income" | "expense";
    categoryId: number | null;
    categoryName?: string;
}

export function VocabularyManager() {
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string; type: string }[]>([]);
    const [newWord, setNewWord] = useState("");
    const [newType, setNewType] = useState<"income" | "expense">("expense");
    const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVocabulary();
        fetchCategories();
    }, []);

    async function fetchCategories() {
        try {
            const res = await fetch("/api/categories");
            const json = await res.json();
            if (json.success) setCategories(json.data);
        } catch (err) {
            console.error("Fetch categories error:", err);
        }
    }

    async function fetchVocabulary() {
        try {
            const res = await fetch("/api/vocabulary");
            const json = await res.json();
            if (json.success) setVocabulary(json.data);
        } catch (err) {
            console.error("Fetch vocabulary error:", err);
        }
    }

    async function handleAdd() {
        if (!newWord.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/vocabulary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word: newWord.trim(), type: newType, categoryId: newCategoryId }),
            });
            const json = await res.json();
            if (json.success) {
                setNewWord("");
                setNewCategoryId(null);
                await fetchVocabulary();
            } else {
                setError("Gagal menambahkan kosakata");
            }
        } catch {
            setError("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: number) {
        try {
            const res = await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) await fetchVocabulary();
        } catch (err) {
            console.error("Delete error:", err);
        }
    }

    const incomeWords = vocabulary.filter((v) => v.type === "income");
    const expenseWords = vocabulary.filter((v) => v.type === "expense");

    const renderVocabularyList = (title: string, words: VocabularyItem[], type: "income" | "expense") => {
        const isIncome = type === "income";
        const Icon = isIncome ? TrendingUp : TrendingDown;

        return (
            <section className="card-clean p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Icon size={17} className={isIncome ? "text-emerald-500" : "text-rose-500"} />
                        {title}
                    </h3>
                    <span className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        isIncome
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    )}>
                        {words.length} kata
                    </span>
                </div>

                <div className="space-y-1.5">
                    {words.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{item.word}</p>
                                <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground">
                                    {item.categoryName || "Tanpa kategori"}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                                aria-label={`Hapus ${item.word}`}
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}

                    {words.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
                            <p className="text-xs font-semibold text-muted-foreground">Belum ada kosakata</p>
                        </div>
                    )}
                </div>
            </section>
        );
    };

    return (
        <div className="space-y-4 pb-2">
            <section className="card-clean p-4">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <BookOpen size={18} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base font-bold text-foreground">Kosakata AI</h2>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-muted-foreground">
                            Ajari Monev kata yang sering kamu pakai agar transaksi lebih akurat terbaca.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Kata Kunci
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: makan, gajian, freelance"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Jenis Transaksi
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setNewType("expense")}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                                    newType === "expense"
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                                        : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:text-slate-100"
                                )}
                            >
                                <TrendingDown size={16} />
                                Pengeluaran
                            </button>
                            <button
                                onClick={() => setNewType("income")}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                                    newType === "income"
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                        : "border border-slate-200 bg-white text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:text-slate-100"
                                )}
                            >
                                <TrendingUp size={16} />
                                Pemasukan
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Kategori
                        </label>
                        <select
                            value={newCategoryId || ""}
                            onChange={(e) => setNewCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                        >
                            <option value="">Pilih Kategori (Opsional)</option>
                            {categories
                                .filter((cat) => cat.type === newType)
                                .map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <button
                        onClick={handleAdd}
                        disabled={loading || !newWord.trim()}
                        className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                            loading || !newWord.trim()
                                ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800"
                                : "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 active:scale-[0.98]"
                        )}
                    >
                        <Plus size={18} />
                        Tambah Kosakata
                    </button>

                    {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
                </div>
            </section>

            <div className="space-y-3">
                {renderVocabularyList("Pengeluaran", expenseWords, "expense")}
                {renderVocabularyList("Pemasukan", incomeWords, "income")}
            </div>
        </div>
    );
}
