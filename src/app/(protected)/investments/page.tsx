"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart, Award, Bitcoin, Globe, Briefcase, X, Trash2, SlidersHorizontal, ArrowUpDown } from "lucide-react";
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
import { ErrorEmpty, NoInvestmentsEmpty, useToast } from "@/frontend/components/UI";
import { useSession } from "next-auth/react";
import { UserTier, canCreateInvestment, getTierConfig } from "@/lib/tier-gate";
import { TierGateOverlay } from "@/frontend/components/TierGateOverlay";
import { Investment, InvestmentSummary } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";
import { Portal } from "@/frontend/components/Portal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import { useSecurity } from "@/components/SecurityProvider";

type InvestmentFilter = "all" | Investment["type"];
type InvestmentSort = "name" | "value" | "profit" | "type";
type SortOrder = "asc" | "desc";

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
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Investment | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    
    // Filter & Sort state
    const [filterType, setFilterType] = useState<InvestmentFilter>("all");
    const [sortBy, setSortBy] = useState<InvestmentSort>("name");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    
    const { isStealthMode } = useSecurity();
    const toast = useToast();
    const { data: session } = useSession();
    const userTier: UserTier = session?.user?.tier || "starter";
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

    useEffect(() => {
        const isSheetOpen = isAddModalOpen || isEditModalOpen;
        window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: isSheetOpen }));
        if (!isSheetOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") closeModals();
        };
        document.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keydown", handleKeyDown, true);
            window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: false }));
        };
    }, [isAddModalOpen, isEditModalOpen]);

    const investments = summary?.items || [];
    const totalValue = summary?.totalValue || 0;
    const totalCost = summary?.totalCost || 0;
    const totalProfit = summary?.totalProfit || 0;
    const profitPercent = summary?.profitPercent || 0;

    // Filter & Sort investments
    const displayInvestments = investments
        .filter(inv => {
            if (filterType === "all") return true;
            return inv.type === filterType;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortBy === "name") {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === "value") {
                const valueA = (a.quantity || 0) * (a.currentPrice || 0);
                const valueB = (b.quantity || 0) * (b.currentPrice || 0);
                comparison = valueA - valueB;
            } else if (sortBy === "profit") {
                const profitA = ((a.currentPrice || 0) - (a.avgBuyPrice || 0)) * (a.quantity || 0);
                const profitB = ((b.currentPrice || 0) - (b.avgBuyPrice || 0)) * (b.quantity || 0);
                comparison = profitA - profitB;
            } else if (sortBy === "type") {
                comparison = a.type.localeCompare(b.type);
            }
            return sortOrder === "desc" ? -comparison : comparison;
        });

    async function loadData() {
        setLoading(true);
        setLoadError(null);
        try {
            const res = await apiFetch("/api/investments");
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.error || "Gagal memuat investasi");
            }
            setSummary(result);
        } catch (error) {
            console.error("Error loading investments:", error);
            setLoadError(error instanceof Error ? error.message : "Gagal memuat investasi");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (isSubmitting) return;

        const quantityValue = Number(formQuantity);
        const buyPriceValue = Number(formBuyPrice);
        const currentPriceValue = Number(formCurrentPrice);
        const dividendsValue = formDividends ? Number(formDividends) : 0;
        const realizedProfitValue = formRealizedProfit ? Number(formRealizedProfit) : 0;

        if (!formName.trim() || !Number.isFinite(quantityValue) || quantityValue <= 0 || !Number.isFinite(buyPriceValue) || buyPriceValue <= 0 || !Number.isFinite(currentPriceValue) || currentPriceValue < 0 || !Number.isFinite(dividendsValue) || !Number.isFinite(realizedProfitValue)) {
            toast.error("Data tidak valid", "Nama, jumlah, dan harga wajib diisi dengan angka valid");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                name: formName.trim(),
                type: formType,
                quantity: quantityValue,
                avgBuyPrice: buyPriceValue,
                currentPrice: currentPriceValue,
                platform: formPlatform.trim() || undefined,
                totalDividends: dividendsValue,
                realizedProfit: realizedProfitValue,
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

    const filterOptions: Array<{ value: InvestmentFilter; label: string }> = [
        { value: "all", label: "Semua" },
        { value: "stock", label: "Saham" },
        { value: "crypto", label: "Kripto" },
        { value: "bond", label: "Obligasi" },
        { value: "mutual_fund", label: "Reksa Dana" },
        { value: "gold", label: "Emas" },
        { value: "other", label: "Lainnya" },
    ];

    const sortOptions: Array<{ value: InvestmentSort; label: string }> = [
        { value: "name", label: "Nama" },
        { value: "value", label: "Nilai" },
        { value: "profit", label: "Profit" },
        { value: "type", label: "Tipe" },
    ];

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
        <div className="min-h-screen pb-36 bg-sky-50 dark:bg-slate-950">
            <TierGateOverlay requiredTier="pro" currentTier={userTier} featureName="Investasi" />

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Investasi</h1>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Pantau Portfolio Anda</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as InvestmentFilter)}
                                className="px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                {filterOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as InvestmentSort)}
                                className="px-2 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={openAddModal}
                            aria-label="Tambah aset investasi"
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-all"
                        >
                            <Plus size={24} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </motion.header>

            <div className="mx-4 mt-4 rounded-2xl border border-sky-100 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 md:hidden">
                <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <SlidersHorizontal size={14} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as InvestmentFilter)}
                            className="min-w-0 flex-1 bg-transparent focus:outline-none"
                            aria-label="Filter tipe aset"
                        >
                            {filterOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <ArrowUpDown size={14} />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as InvestmentSort)}
                            className="min-w-0 flex-1 bg-transparent focus:outline-none"
                            aria-label="Urutkan aset"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="mt-2 w-full rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 transition active:scale-[0.98] dark:bg-sky-900/30 dark:text-sky-300"
                    aria-label={`Urutan ${sortOrder === "asc" ? "naik" : "turun"}`}
                >
                    Urutan: {sortOrder === "asc" ? "Naik" : "Turun"}
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 sm:mx-6 mt-6 p-6 bg-gradient-to-br from-sky-500 to-cyan-600 backdrop-blur-xl border border-white/10 rounded-2xl text-white shadow-lg shadow-sky-500/10 shadow-sky-500/20"
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
                                    {!isStealthMode && (
                                        <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">
                                            {profitPercent.toFixed(1)}%
                                        </span>
                                    )}
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
                        className="mx-4 sm:mx-6 mt-6 p-5 sm:p-6 card-clean"
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
                                            label={({ name, percent }: { name?: string; percent?: number }) =>
                                                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
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
                                            formatter={(value: number | string | readonly (number | string)[] | undefined) => [
                                                isStealthMode || value === undefined || Array.isArray(value)
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

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 pt-2">
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

            <div className="px-4 sm:px-6 mt-4 sm:mt-6">
                <h3 className="text-sm font-bold text-foreground mb-4">Daftar Aset</h3>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 h-24 animate-pulse" />
                        ))}
                    </div>
                ) : loadError ? (
                    <div className="card-clean">
                        <ErrorEmpty
                            title="Gagal memuat investasi"
                            description={loadError}
                            onRetry={() => { void loadData(); }}
                        />
                    </div>
                ) : investments.length === 0 ? (
                    <NoInvestmentsEmpty onAddNew={() => setIsAddModalOpen(true)} />
                ) : displayInvestments.length === 0 ? (
                    <div className="card-clean">
                        <ErrorEmpty
                            title="Tidak ada aset yang cocok"
                            description="Ubah filter atau urutan untuk melihat aset lainnya."
                            onRetry={() => setFilterType("all")}
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayInvestments.map((inv, i) => {
                            const value = inv.quantity * inv.currentPrice;
                            const profit = value - (inv.quantity * inv.avgBuyPrice);
                            const profitPct = ((inv.currentPrice - inv.avgBuyPrice) / inv.avgBuyPrice) * 100;
                            const isProfit = profit >= 0;

                            return (
                                <motion.button
                                    type="button"
                                    key={inv.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    onClick={() => openEditModal(inv)}
                                    className="card-clean w-full p-5 text-left group relative cursor-pointer hover:shadow-lg hover:shadow-sky-200/40 dark:hover:shadow-sky-900/20 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-500/40"
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
                                </motion.button>
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
                                aria-hidden="true"
                                className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: "100%" }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: "100%" }}
                                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-t-[2.5rem] p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-12 z-[999999] shadow-2xl mx-auto max-w-[500px] max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="investment-sheet-title"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h2 id="investment-sheet-title" className="text-xl font-bold text-foreground">
                                        {isEditModalOpen ? "Edit Aset" : "Tambah Aset"}
                                    </h2>
                                    {isEditModalOpen && selectedAsset && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(selectedAsset.id)}
                                            aria-label="Hapus aset investasi"
                                            className="ml-auto mr-3 flex h-11 w-11 items-center justify-center rounded-full text-rose-500 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={closeModals}
                                        aria-label="Tutup form aset investasi"
                                        className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                onChange={(e) => setFormType(e.target.value as Investment["type"])}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm"
                                            >
                                                {typeOptions.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                    type="button"
                                                    key={opt.name}
                                                    aria-pressed={formIcon === opt.name}
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
                                                    type="button"
                                                    key={c}
                                                    aria-label={`Pilih warna ${c}`}
                                                    aria-pressed={formColor === c}
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

                                    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                <span>💰 Dividen / Passive Income</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={formDividends}
                                                onChange={(e) => setFormDividends(e.target.value)}
                                                placeholder="Rp 0"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 dark:border-emerald-900/30 dark:bg-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors text-sm text-emerald-600 dark:text-emerald-400"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Total dividen yang sudah diterima</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                <span>📈 Profit Realisasi</span>
                                            </label>
                                            <input
                                                type="number"
                                                value={formRealizedProfit}
                                                onChange={(e) => setFormRealizedProfit(e.target.value)}
                                                placeholder="Rp 0"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-amber-100 dark:border-amber-900/30 dark:bg-slate-800 dark:text-white focus:border-amber-500 focus:outline-none transition-colors text-sm text-amber-600 dark:text-amber-400"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Profit yang sudah direalisasikan dari penjualan</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 block flex items-center gap-2">
                                                <span>📝 Catatan</span>
                                            </label>
                                            <textarea
                                                value={formNotes}
                                                onChange={(e) => setFormNotes(e.target.value)}
                                                placeholder="Catatan tentang investasi ini..."
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-sky-500 focus:outline-none transition-colors text-sm resize-none"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Tambahkan catatan pribadi untuk investasi ini</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!formName.trim() || !Number.isFinite(Number(formQuantity)) || Number(formQuantity) <= 0 || !Number.isFinite(Number(formBuyPrice)) || Number(formBuyPrice) <= 0 || !Number.isFinite(Number(formCurrentPrice)) || Number(formCurrentPrice) < 0 || isSubmitting}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-sm font-bold transition-all mt-4",
                                            formName.trim() && Number.isFinite(Number(formQuantity)) && Number(formQuantity) > 0 && Number.isFinite(Number(formBuyPrice)) && Number(formBuyPrice) > 0 && Number.isFinite(Number(formCurrentPrice)) && Number(formCurrentPrice) >= 0 && !isSubmitting
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
