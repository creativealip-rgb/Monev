"use client";

import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";

interface Category {
    id: number;
    name: string;
    type: "expense" | "income";
    color: string;
    userId: number;
}

interface CategoriesModalProps {
    categories: Category[];
    loadData: () => void;
}

export function CategoriesModal({ categories, loadData }: CategoriesModalProps) {
    const toast = useToast();
    const [newCategory, setNewCategory] = useState({ name: "", type: "expense" as "expense" | "income", icon: "Tag", color: "#ec4899" });
    const [loading, setLoading] = useState(false);

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error("Validasi", "Nama kategori wajib diisi.");
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetch("/api/categories", {
                method: "POST",
                body: JSON.stringify(newCategory)
            });
            const result = await response.json();

            if (result.success) {
                toast.success("Berhasil", "Kategori berhasil ditambahkan!");
                setNewCategory({ name: "", type: "expense", icon: "Tag", color: "#ec4899" });
                loadData();
            } else {
                toast.error("Gagal", result.error || "Gagal menambahkan kategori.");
            }
        } catch (error) {
            toast.error("Gagal", "Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Yakin ingin menghapus kategori ini? Semua transaksi terkait akan menjadi tanpa kategori.")) return;

        try {
            setLoading(true);
            const response = await apiFetch(`/api/categories?id=${id}`, {
                method: "DELETE"
            });
            const result = await response.json();

            if (result.success) {
                toast.success("Berhasil", "Kategori dihapus.");
                loadData();
            } else {
                toast.error("Gagal", result.error || "Gagal menghapus kategori.");
            }
        } catch (error) {
            toast.error("Gagal", "Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-[2rem] p-6 border border-pink-100 dark:border-pink-900/50">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/40 rounded-2xl text-pink-600 dark:text-pink-400 shadow-sm">
                        <Tag size={28} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">Kategori Custom</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                            Punya sumber pendapatan atau jenis pengeluaran unik? Tambahkan di sini.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Kategori Baru</h5>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nama Kategori..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <select
                            value={newCategory.type}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as "expense" | "income" }))}
                            className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none transition-all appearance-none"
                        >
                            <option value="expense">Pengeluaran 📉</option>
                            <option value="income">Pemasukan 📈</option>
                        </select>
                        <input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-full min-h-[46px] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 cursor-pointer"
                        />
                    </div>
                    <button
                        onClick={handleAddCategory}
                        disabled={loading}
                        className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Plus size={18} />
                        Tambah Kategori
                    </button>
                </div>
            </div>

            {categories.length > 0 && (
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Kategori Milikmu</h5>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                                        <Tag size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-500">{cat.type === "expense" ? "Pengeluaran" : "Pemasukan"}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteCategory(cat.id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
