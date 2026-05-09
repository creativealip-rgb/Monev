"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
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
            if (json.success) {
                setCategories(json.data);
            }
        } catch (err) {
            console.error("Fetch categories error:", err);
        }
    }

    async function fetchVocabulary() {
        try {
            const res = await fetch("/api/vocabulary");
            const json = await res.json();
            if (json.success) {
                setVocabulary(json.data);
            }
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
        } catch (err) {
            setError("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: number) {
        try {
            const res = await fetch(`/api/vocabulary/${id}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                await fetchVocabulary();
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    }

    const incomeWords = vocabulary.filter((v) => v.type === "income");
    const expenseWords = vocabulary.filter((v) => v.type === "expense");

    return (
        <div className="space-y-4 pb-6">
            {/* Header */}
            <div className="space-y-1">
                <h2 className="text-lg font-semibold">Kosakata Kustom</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Tambahkan kata-kata yang sering kamu pakai supaya Monev AI lebih paham
                </p>
            </div>

            {/* Add Form */}
            <div className="glass-card p-3 space-y-2.5">
                <input
                    type="text"
                    placeholder="Contoh: makan, gajian, freelance"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="input-modern w-full text-sm"
                />
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setNewType("expense")}
                        className={cn(
                            "flex-1 py-1.5 rounded-lg border transition-colors text-xs font-medium",
                            newType === "expense"
                                ? "bg-red-500/20 border-red-500 text-red-500"
                                : "border-border text-muted-foreground"
                        )}
                    >
                        <TrendingDown className="w-3.5 h-3.5 inline mr-1" />
                        Pengeluaran
                    </button>
                    <button
                        onClick={() => setNewType("income")}
                        className={cn(
                            "flex-1 py-1.5 rounded-lg border transition-colors text-xs font-medium",
                            newType === "income"
                                ? "bg-green-500/20 border-green-500 text-green-500"
                                : "border-border text-muted-foreground"
                        )}
                    >
                        <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                        Pemasukan
                    </button>
                </div>
                <select
                    value={newCategoryId || ""}
                    onChange={(e) => setNewCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                    className="input-modern w-full text-sm"
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
                <button
                    onClick={handleAdd}
                    disabled={loading || !newWord.trim()}
                    className="btn-primary w-full py-2 text-sm"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Tambah Kosakata
                </button>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            {/* Lists */}
            <div className="space-y-3">
                {/* Expense Words */}
                <div className="glass-card p-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                        Pengeluaran ({expenseWords.length})
                    </h3>
                    <div className="space-y-1.5">
                        {expenseWords.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium truncate">{item.word}</span>
                                        {item.categoryName && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                · {item.categoryName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="ml-2 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {expenseWords.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-3">
                                Belum ada kosakata
                            </p>
                        )}
                    </div>
                </div>

                {/* Income Words */}
                <div className="glass-card p-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        Pemasukan ({incomeWords.length})
                    </h3>
                    <div className="space-y-1.5">
                        {incomeWords.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium truncate">{item.word}</span>
                                        {item.categoryName && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                · {item.categoryName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="ml-2 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {incomeWords.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-3">
                                Belum ada kosakata
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
