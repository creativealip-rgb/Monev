"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart, Award, Bitcoin, Globe, Briefcase, X, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { Investment } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";
import { Portal } from "@/frontend/components/Portal";
import { NoInvestmentsEmpty, useToast } from "@/frontend/components/UI";
import { useSession } from "next-auth/react";
import { UserTier, canCreateInvestment, getTierConfig } from "@/lib/tier-gate";
import { TierGateOverlay, TierLimitBanner } from "@/frontend/components/TierGateOverlay";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    TrendingUp, TrendingDown, DollarSign, PieChart, BarChart, Award, Bitcoin, Globe, Briefcase
};

function AssetIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
    const Icon = iconMap[name] || TrendingUp;
    return <Icon size={size} color={color} />;
}

export default function InvestmentsPage() {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);
    const toast = useToast();
    const { data: session } = useSession();
    // @ts-ignore
    const userTier = (session?.user?.tier as UserTier) || "miskin";
    const tierConfig = getTierConfig(userTier);

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
            const res = await apiFetch("/api/investments");
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
                res = await apiFetch(`/api/investments/${selectedAsset.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await apiFetch("/api/investments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }

            const result = await res.json();
            if (result.success) {
                await loadData();
                closeModals();
                toast.success(selectedAsset ? "Investasi diperbarui" : "Investasi ditambahkan");
            }
        } catch (error) {
            console.error("Error saving investment:", error);
            toast.error("Gagal menyimpan investasi");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Yakin mau hapus aset investasi ini?")) return;
        try {
            const res = await apiFetch(`/api/investments/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                setInvestments(prev => prev.filter(i => i.id !== id));
                closeModals();
                toast.success("Investasi dihapus");
            }
        } catch (error) {
            console.error("Error deleting investment:", error);
            toast.error("Gagal menghapus");
        }
    }

    function openAddModal() {
        if (!canCreateInvestment(investments.length, userTier)) {
            toast.error("Batas Tercapai", `Tier ${tierConfig.name} hanya bisa ${tierConfig.maxInvestments} aset. Upgrade untuk menambah!`);
            return;
        }
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
        <div className="relative min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            <TierGateOverlay requiredTier="kaya" currentTier={userTier} featureName="Investasi" />
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 px-6 pt-safe pt-3 pb-4 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                        >
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </Link>
                        <h1 className="text-sm font-bold text-foreground tracking-tight">Investasi</h1>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={openAddModal}
                        className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900 transition-all"
                    >
                        <Plus size={18} />
                    </motion.button>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-6 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-xl shadow-sky-500/20"
            >
                <p className="text-cyan-200 text-xs font-medium mb-1">Total Nilai Aset</p>
                <h2 className="text-2xl font-bold mb-6 tabular-nums">{loading ? "..." : formatCurrency(totalValue)}</h2>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                        <p className="text-cyan-200 text-[10px] uppercase tracking-wider mb-1">Modal Awal</p>
                        <p className="font-medium tabular-nums">{loading ? "..." : formatCurrency(totalCost)}</p>
                    </div>
                    <div>
                        <p className="text-cyan-200 text-[10px] uppercase tracking-wider mb-1">Keuntungan</p>
                        <div className={cn(
                            "flex items-center gap-1 font-semibold tabular-nums",
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

            <div className="px-6 mt-8">
                <h3 className="text-sm font-bold text-foreground mb-4">Daftar Aset</h3>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 h-24 animate-pulse" />
                        ))}
                    </div>
                ) : investments.length === 0 ? (
                    <NoInvestmentsEmpty onAddNew={() => setIsAddModalOpen(true)} />
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
                                    className="card-clean p-5 group relative cursor-pointer hover:shadow-lg hover:shadow-sky-200/40 dark:hover:shadow-sky-900/20 transition-all active:scale-[0.98]"
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
                                                <h4 className="font-bold text-foreground">{inv.name}</h4>
                                                <p className="text-xs text-muted-foreground capitalize">{inv.type} • {inv.platform || "Manual"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-foreground tabular-nums">{formatCurrency(value)}</p>
                                            <div className={cn(
                                                "text-xs font-medium flex items-center justify-end gap-1 tabular-nums",
                                                isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                                            )}>
                                                {isProfit ? "+" : ""}{formatCurrency(profit)} ({profitPct.toFixed(1)}%)
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700">
                                        <div className="text-xs text-muted-foreground">
                                            {inv.quantity.toLocaleString('id-ID')} @ {formatCurrency(inv.currentPrice)}
                                        </div>
                                        <div className="text-xs text-muted-foreground tabular-nums">
                                            Modal: {formatCurrency(inv.avgBuyPrice)}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Portal>
                <AnimatePresence>
                    {(isAddModalOpen || isEditModalOpen) && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeModals}
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground">
                                        {isEditModalOpen ? "Edit Aset" : "Tambah Aset"}
                                    </h2>
                                    {isEditModalOpen && selectedAsset && (
                                        <button
                                            onClick={() => handleDelete(selectedAsset.id)}
                                            className="ml-auto mr-4 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/50 p-2 rounded-full transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={closeModals}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Nama Aset</label>
                                            <input
                                                type="text"
                                                value={formName}
                                                onChange={(e) => setFormName(e.target.value)}
                                                placeholder="BTC, BBCA, Emas"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Tipe</label>
                                            <select
                                                value={formType}
                                                onChange={(e) => setFormType(e.target.value as any)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            >
                                                {typeOptions.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Jumlah (Unit)</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={formQuantity}
                                                onChange={(e) => setFormQuantity(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Platform</label>
                                            <input
                                                type="text"
                                                value={formPlatform}
                                                onChange={(e) => setFormPlatform(e.target.value)}
                                                placeholder="Bibit, Ajaib..."
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Harga Beli (Avg)</label>
                                            <input
                                                type="number"
                                                value={formBuyPrice}
                                                onChange={(e) => setFormBuyPrice(e.target.value)}
                                                placeholder="Rp 0"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Harga Sekarang</label>
                                            <input
                                                type="number"
                                                value={formCurrentPrice}
                                                onChange={(e) => setFormCurrentPrice(e.target.value)}
                                                placeholder="Rp 0"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block">Ikon & Warna</label>
                                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                            {iconOptions.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => setFormIcon(opt.name)}
                                                    className={cn(
                                                        "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all",
                                                        formIcon === opt.name
                                                            ? "border-sky-500 bg-sky-50 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
                                                            : "border-slate-100 dark:border-slate-700 text-muted-foreground"
                                                    )}
                                                >
                                                    <AssetIcon name={opt.name} color={formIcon === opt.name ? "#0ea5e9" : "#94a3b8"} size={16} />
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
                                                        formColor === c ? "ring-2 ring-offset-2 ring-sky-500 scale-110 dark:ring-offset-slate-900" : ""
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={!formName || !formQuantity || !formBuyPrice || !formCurrentPrice || isSubmitting}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-sm font-bold transition-all mt-4",
                                            formName && formQuantity
                                                ? "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/25"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
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
