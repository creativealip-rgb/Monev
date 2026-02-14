"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart, Award, Bitcoin, Globe, Briefcase, X, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { Investment } from "@/types";
import { createPortal } from "react-dom";

// Portal helper
function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    return mounted ? createPortal(children, document.body) : null;
}

const iconMap: Record<string, any> = {
    TrendingUp, TrendingDown, DollarSign, PieChart, BarChart, Award, Bitcoin, Globe, Briefcase
};

function AssetIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
    const Icon = iconMap[name] || TrendingUp;
    return <Icon size={size} style={{ color }} />;
}

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState<Investment["type"]>("stock");
    const [formQuantity, setFormQuantity] = useState("");
    const [formBuyPrice, setFormBuyPrice] = useState("");
    const [formCurrentPrice, setFormCurrentPrice] = useState("");
    const [formPlatform, setFormPlatform] = useState("");
    const [formIcon, setFormIcon] = useState("TrendingUp");
    const [formColor, setFormColor] = useState("#10b981");
    const [formNotes, setFormNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const totalValue = useMemo(() => {
        return investments.reduce((sum, inv) => sum + (inv.quantity * inv.currentPrice), 0);
    }, [investments]);

    const totalCost = useMemo(() => {
        return investments.reduce((sum, inv) => sum + (inv.quantity * inv.avgBuyPrice), 0);
    }, [investments]);

    const totalProfit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    async function loadData() {
        setLoading(true);
        try {
            const res = await fetch("/api/investments");
            const result = await res.json();
            if (result.success) {
                setInvestments(result.data);
            }
        } catch (error) {
            console.error("Error loading investments:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (!formName || !formQuantity || !formBuyPrice || !formCurrentPrice) return;
        setIsSubmitting(true);

        try {
            const payload = {
                name: formName,
                type: formType,
                quantity: Number(formQuantity),
                avgBuyPrice: Number(formBuyPrice),
                currentPrice: Number(formCurrentPrice),
                platform: formPlatform || undefined,
                icon: formIcon,
                color: formColor,
                notes: formNotes || undefined,
            };

            let res;
            if (selectedAsset) {
                res = await fetch(`/api/investments/${selectedAsset.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch("/api/investments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const result = await res.json();
            if (result.success) {
                await loadData();
                closeModals();
            }
        } catch (error) {
            console.error("Error saving investment:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Yakin mau hapus aset investasi ini?")) return;
        try {
            const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                setInvestments(prev => prev.filter(i => i.id !== id));
                closeModals();
            }
        } catch (error) {
            console.error("Error deleting investment:", error);
        }
    }

    function openAddModal() {
        resetForm();
        setSelectedAsset(null);
        setIsAddModalOpen(true);
    }

    function openEditModal(asset: Investment) {
        setSelectedAsset(asset);
        setFormName(asset.name);
        setFormType(asset.type);
        setFormQuantity(String(asset.quantity));
        setFormBuyPrice(String(asset.avgBuyPrice));
        setFormCurrentPrice(String(asset.currentPrice));
        setFormPlatform(asset.platform || "");
        setFormIcon(asset.icon);
        setFormColor(asset.color);
        setFormNotes(asset.notes || "");
        setIsEditModalOpen(true);
    }

    function closeModals() {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedAsset(null);
    }

    function resetForm() {
        setFormName("");
        setFormType("stock");
        setFormQuantity("");
        setFormBuyPrice("");
        setFormCurrentPrice("");
        setFormPlatform("");
        setFormIcon("TrendingUp");
        setFormColor("#10b981");
        setFormNotes("");
    }

    const typeOptions = [
        { value: "stock", label: "Saham" },
        { value: "crypto", label: "Crypto" },
        { value: "mutual_fund", label: "Reksadana" },
        { value: "gold", label: "Emas" },
        { value: "bond", label: "Obligasi" },
        { value: "other", label: "Lainnya" },
    ];

    const iconOptions = [
        { name: "TrendingUp", label: "Naik" },
        { name: "BarChart", label: "Chart" },
        { name: "PieChart", label: "Pie" },
        { name: "Bitcoin", label: "Crypto" },
        { name: "Award", label: "Emas" },
        { name: "Globe", label: "Global" },
        { name: "DollarSign", label: "Uang" },
        { name: "Briefcase", label: "Bisnis" },
    ];

    const colorOptions = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

    return (
        <div className="relative min-h-screen bg-slate-50 pb-28">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-12 pb-6 bg-white border-b border-slate-100"
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                        >
                            <ChevronLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Investasi</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={openAddModal}
                        className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-all"
                    >
                        <Plus size={22} />
                    </motion.button>
                </div>
                <p className="text-sm text-slate-500 ml-13">Pantau pertumbuhan asetmu! 📈</p>
            </motion.header>

            {/* Portfolio Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-6 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-[2rem] text-white shadow-xl shadow-emerald-900/20"
            >
                <p className="text-emerald-200 text-xs font-medium mb-1">Total Nilai Aset</p>
                <h2 className="text-3xl font-bold mb-6">{loading ? "..." : formatCurrency(totalValue)}</h2>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                        <p className="text-emerald-200 text-[10px] uppercase tracking-wider mb-1">Modal Awal</p>
                        <p className="font-semibold">{loading ? "..." : formatCurrency(totalCost)}</p>
                    </div>
                    <div>
                        <p className="text-emerald-200 text-[10px] uppercase tracking-wider mb-1">Keuntungan</p>
                        <div className={cn(
                            "flex items-center gap-1 font-bold",
                            totalProfit >= 0 ? "text-emerald-300" : "text-rose-300"
                        )}>
                            {loading ? "..." : (
                                <>
                                    <span>{totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}</span>
                                    <span className="text-xs px-1.5 py-0.5 bg-white/10 rounded-full">
                                        {profitPercent.toFixed(1)}%
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Asset List */}
            <div className="px-6 mt-8">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Daftar Aset</h3>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 h-24" />
                        ))}
                    </div>
                ) : investments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500 font-bold">Belum ada investasi</p>
                        <p className="text-xs text-slate-400 mt-1">Mulai catat aset investasi pertamamu</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {investments.map((inv, i) => {
                            const value = inv.quantity * inv.currentPrice;
                            const profit = value - (inv.quantity * inv.avgBuyPrice);
                            const profitPct = ((inv.currentPrice - inv.avgBuyPrice) / inv.avgBuyPrice) * 100;
                            const isProfit = profit >= 0;

                            return (
                                <motion.div
                                    key={inv.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    onClick={() => openEditModal(inv)}
                                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"
                                                style={{ backgroundColor: inv.color }}
                                            >
                                                <AssetIcon name={inv.icon} color="#fff" size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{inv.name}</h4>
                                                <p className="text-xs text-slate-400 capitalize">{inv.type} • {inv.platform || "Manual"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">{formatCurrency(value)}</p>
                                            <div className={cn(
                                                "text-xs font-medium flex items-center justify-end gap-1",
                                                isProfit ? "text-emerald-600" : "text-rose-500"
                                            )}>
                                                {isProfit ? "+" : ""}{formatCurrency(profit)} ({profitPct.toFixed(1)}%)
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                        <div className="text-xs text-slate-400">
                                            {inv.quantity.toLocaleString('id-ID')} @ {formatCurrency(inv.currentPrice)}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            Modal: {formatCurrency(inv.avgBuyPrice)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Form */}
            <Portal>
                <AnimatePresence>
                    {(isAddModalOpen || isEditModalOpen) && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeModals}
                                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {isEditModalOpen ? "Edit Aset" : "Tambah Aset"}
                                    </h2>
                                    {isEditModalOpen && selectedAsset && (
                                        <button
                                            onClick={() => handleDelete(selectedAsset.id)}
                                            className="ml-auto mr-4 text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={closeModals}
                                        className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Name & Type */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Nama Aset</label>
                                            <input
                                                type="text"
                                                value={formName}
                                                onChange={(e) => setFormName(e.target.value)}
                                                placeholder="BTC, BBCA, Emas"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Tipe</label>
                                            <select
                                                value={formType}
                                                onChange={(e) => setFormType(e.target.value as any)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-colors text-sm bg-white"
                                            >
                                                {typeOptions.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Quantity & Platform */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Jumlah (Unit)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formQuantity}
                                                onChange={(e) => setFormQuantity(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Platform</label>
                                            <input
                                                type="text"
                                                value={formPlatform}
                                                onChange={(e) => setFormPlatform(e.target.value)}
                                                placeholder="Bibit, Ajaib..."
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Prices */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Harga Beli (Avg)</label>
                                            <input
                                                type="number"
                                                value={formBuyPrice}
                                                onChange={(e) => setFormBuyPrice(e.target.value)}
                                                placeholder="Rp 0"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Harga Sekarang</label>
                                            <input
                                                type="number"
                                                value={formCurrentPrice}
                                                onChange={(e) => setFormCurrentPrice(e.target.value)}
                                                placeholder="Rp 0"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Icon & Color */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 block">Ikon & Warna</label>
                                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                            {iconOptions.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setFormIcon(opt.name)}
                                                    className={cn(
                                                        "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                                                        formIcon === opt.name
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                                                            : "border-slate-100 text-slate-500"
                                                    )}
                                                >
                                                    <AssetIcon name={opt.name} color={formIcon === opt.name ? "#10b981" : "#94a3b8"} size={16} />
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-3">
                                            {colorOptions.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setFormColor(c)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-full transition-all flex-shrink-0",
                                                        formColor === c ? "ring-2 ring-offset-2 ring-emerald-500 scale-110" : ""
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!formName || !formQuantity || !formBuyPrice || !formCurrentPrice || isSubmitting}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-sm font-bold transition-all mt-4",
                                            formName && formQuantity
                                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25"
                                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        {isSubmitting ? "Menyimpan..." : (isEditModalOpen ? "Simpan Perubahan" : "Tambah Aset")}
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </Portal>
        </div>
    );
}
