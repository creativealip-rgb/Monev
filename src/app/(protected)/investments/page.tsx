"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart, Award, Bitcoin, Globe, Briefcase, X, Edit3, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { NoInvestmentsEmpty, useToast } from "@/frontend/components/UI";
import { useSession } from "next-auth/react";
import { UserTier, canCreateInvestment, getTierConfig } from "@/lib/tier-gate";
import { TierGateOverlay, TierLimitBanner } from "@/frontend/components/TierGateOverlay";
import { Investment, InvestmentSummary } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";
import { Portal } from "@/frontend/components/Portal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { useSecurity } from "@/components/SecurityProvider";

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    TrendingUp, TrendingDown, DollarSign, PieChart, BarChart, Award, Bitcoin, Globe, Briefcase
};

function AssetIcon({ name, color, size = 20 }: { name: string; color: string; size?: number }) {
    const Icon = iconMap[name] || TrendingUp;
    return <Icon size={size} color={color} />;
}

export default function InvestmentsPage() {
    const [summary, setSummary] = useState<InvestmentSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const { isStealthMode } = useSecurity();
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
    const [formDividends, setFormDividends] = useState("");
    const [formRealizedProfit, setFormRealizedProfit] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const investments = summary?.items || [];
    const totalValue = summary?.totalValue || 0;
    const totalCost = summary?.totalCost || 0;
    const totalProfit = summary?.totalProfit || 0;
    const profitPercent = summary?.profitPercent || 0;

    async function loadData() {
        setLoading(true);
        try {
            const res = await apiFetch("/api/investments");
            const result = await res.json();
            if (result.success) {
                setSummary(result);
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
                totalDividends: parseFloat(formDividends) || 0,
                realizedProfit: parseFloat(formRealizedProfit) || 0,
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

    function handleDelete(id: number) {
        setConfirmDeleteId(id);
    }

    async function executeDelete(id: number) {
        setDeletingId(id);
        try {
            const res = await apiFetch(`/api/investments/${id}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
                closeModals();
                toast.success("Investasi dihapus");
                await loadData(); // Full reload to recalculate totals & allocation chart
            } else {
                toast.error("Gagal", result.error || "Gagal menghapus");
            }
        } catch (error) {
            console.error("Error deleting investment:", error);
            toast.error("Gagal menghapus");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
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
        setFormDividends(asset.totalDividends?.toString() || "0");
        setFormRealizedProfit(asset.realizedProfit?.toString() || "0");
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
        setFormDividends("");
        setFormRealizedProfit("");
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
        <div className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            <TierGateOverlay requiredTier="kaya" currentTier={userTier} featureName="Investasi" />

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-foreground tracking-tight">Investasi</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Pantau Portfolio Anda</p>
                        </div>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </motion.header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-6 mt-6 p-6 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-xl shadow-sky-500/20"
            >
                <p className="text-cyan-200 text-xs font-medium mb-1">Total Nilai Aset</p>
                <h2 className="text-2xl font-bold mb-6 tabular-nums">
                    {loading ? "..." : isStealthMode ? "••••••••" : formatCurrency(totalValue)}
                </h2>

                <div className="grid grid-cols-2 gap-y-4 pt-4 border-t border-white/10">
                    <div>
                        <p className="text-cyan-200 text-[10px] uppercase tracking-wider mb-1">Modal Awal</p>
                        <p className="font-medium tabular-nums text-sm">
                            {loading ? "..." : isStealthMode ? "••••••••" : formatCurrency(totalCost)}
                        </p>
                    </div>
                    <div>
                        <p className="text-cyan-200 text-[10px] uppercase tracking-wider mb-1">Passive Income</p>
                        <p className="font-bold text-emerald-300 tabular-nums text-sm">
                            {loading ? "..." : isStealthMode ? "••••••••" : formatCurrency(summary?.totalDividends || 0)}
                        </p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-white/5">
                        <p className="text-cyan-200 text-[10px] uppercase tracking-wider mb-1">Total ROI</p>
                        <div className={cn(
                            "flex items-center gap-2 font-black tabular-nums",
                            totalProfit >= 0 ? "text-emerald-300" : "text-rose-300"
                        )}>
                            {loading ? "..." : (
                                <>
                                    <span className="text-lg">{totalProfit >= 0 ? "+" : ""}{isStealthMode ? "••••••••" : formatCurrency(totalProfit)}</span>
                                    <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">
                                        {profitPercent.toFixed(1)}%
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Asset Allocation Chart */}
            <AnimatePresence>
                {summary && summary.allocation.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mx-6 mt-6 p-6 card-clean"
                    >
                        <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                            <PieChart size={14} />
                            Alokasi Aset
                        </h3>
                        <div className="space-y-4">
                            {/* Pie Chart */}
                            <div className="w-full h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={summary.allocation.map((item) => ({
                                                name: item.label,
                                                value: item.value,
                                                color: item.color,
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={({ name, percent }: any) =>
                                                `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                                            }
                                            labelLine={false}
                                        >
                                            {summary.allocation.map((item, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={item.color}
                                                    stroke="none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => [
                                                isStealthMode
                                                    ? "••••••••"
                                                    : formatCurrency(Number(value)),
                                                "Nilai",
                                            ]}
                                            contentStyle={{
                                                borderRadius: "12px",
                                                border: "none",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                fontSize: "12px",
                                            }}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Bar visualization */}
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                {summary.allocation.map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.value / totalValue) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                                        style={{ backgroundColor: item.color }}
                                        className="h-full first:rounded-l-full last:rounded-r-full"
                                    />
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                {summary.allocation.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                                        </div>
                                        <span className="text-xs font-bold text-foreground">
                                            {Math.round((item.value / totalValue) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                            <p className="font-semibold text-foreground tabular-nums">
                                                {isStealthMode ? "••••••••" : formatCurrency(value)}
                                            </p>
                                            <div className={cn(
                                                "text-xs font-medium flex items-center justify-end gap-1 tabular-nums",
                                                isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                                            )}>
                                                {isProfit ? "+" : ""}{isStealthMode ? "••••••••" : formatCurrency(profit)} ({isStealthMode ? "••%" : profitPct.toFixed(1) + "%"})
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-3 border-t border-slate-50 dark:border-slate-700">
                                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase">
                                            <span>Kepemilikan</span>
                                            <span>{isStealthMode ? "•••" : inv.quantity.toLocaleString('id-ID')} @ {isStealthMode ? "••••" : formatCurrency(inv.currentPrice)}</span>
                                        </div>
                                        {(inv.totalDividends || 0) > 0 && (
                                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Passive Income</span>
                                                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                                                    {isStealthMode ? "••••" : formatCurrency(inv.totalDividends!)}
                                                </span>
                                            </div>
                                        )}
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

            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId)}
                title="Hapus Aset"
                description="Investasi ini akan dihapus secara permanen beserta catatannya. Lanjutkan?"
                loading={!!deletingId}
            />
        </div>
    );
}
