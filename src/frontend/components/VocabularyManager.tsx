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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold">Kosakata Kustom</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Tambahkan kata-kata yang sering kamu pakai supaya Monev AI lebih paham
                </p>
            </div>

            {/* Add Form */}
            <div className="glass-card p-4 space-y-3">
                <input
                    type="text"
                    placeholder="Contoh: makan, gajian, freelance"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="input-modern w-full"
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => setNewType("expense")}
                        className={cn(
                            "flex-1 py-2 rounded-lg border transition-colors",
                            newType === "expense"
                                ? "bg-red-500/20 border-red-500 text-red-500"
                                : "border-border"
                        )}
                    >
                        <TrendingDown className="w-4 h-4 inline mr-1" />
                        Pengeluaran
                    </button>
                    <button
                        onClick={() => setNewType("income")}
                        className={cn(
                            "flex-1 py-2 rounded-lg border transition-colors",
                            newType === "income"
                                ? "bg-green-500/20 border-green-500 text-green-500"
                                : "border-border"
                        )}
                    >
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Pemasukan
                    </button>
                </div>
                <select
                    value={newCategoryId || ""}
                    onChange={(e) => setNewCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                    className="input-modern w-full"
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
                    className="btn-primary w-full"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Kosakata
                </button>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expense Words */}
                <div className="glass-card p-4">
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Pengeluaran ({expenseWords.length})
                    </h3>
                    <div className="space-y-2">
                        {expenseWords.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                            >
                                <div className="flex-1">
                                    <span className="text-sm font-medium">{item.word}</span>
                                    {item.categoryName && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            → {item.categoryName}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {expenseWords.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Belum ada kosakata
                            </p>
                        )}
                    </div>
                </div>

                {/* Income Words */}
                <div className="glass-card p-4">
                    <h3 className="font-medium flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Pemasukan ({incomeWords.length})
                    </h3>
                    <div className="space-y-2">
                        {incomeWords.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                            >
                                <div className="flex-1">
                                    <span className="text-sm font-medium">{item.word}</span>
                                    {item.categoryName && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            → {item.categoryName}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {incomeWords.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Belum ada kosakata
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
