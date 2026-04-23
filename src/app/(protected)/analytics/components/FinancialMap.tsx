"use client"

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Info, RefreshCw, Layers, AlertCircle } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";
import type { AnalyticsDrilldownFilter } from "./types";

const loadSankeyFlowChart = () => import("@/frontend/components/SankeyFlowChart").then((mod) => mod.SankeyFlowChart);

const SankeyFlowChart = dynamic(loadSankeyFlowChart, {
    loading: () => <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
});

const financialMapCache = new Map<string, { nodes: Node[]; links: Link[] }>();

export function preloadFinancialMapChart() {
    return loadSankeyFlowChart();
}

export async function prefetchFinancialMapData({
    month,
    year,
    startDate,
    endDate,
    accountId = "all",
    categoryId = "all",
}: {
    month: number;
    year: number;
    startDate?: string | null;
    endDate?: string | null;
    accountId?: string;
    categoryId?: string;
}) {
    const params = new URLSearchParams({
        month: String(month),
        year: String(year),
    });

    if (startDate && endDate) {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
    }

    if (accountId !== "all") {
        params.set("accountId", accountId);
    }

    if (categoryId !== "all") {
        params.set("categoryId", categoryId);
    }

    const requestUrl = `/api/analytics/sankey?${params.toString()}`;
    if (financialMapCache.has(requestUrl)) {
        return;
    }

    const res = await apiFetch(requestUrl);
    const json = await res.json();
    if (json.success) {
        financialMapCache.set(requestUrl, json.data);
    }
}

interface Node {
    id: string;
    name: string;
    kind?: "income" | "expense-category" | "uncategorized-expense" | "savings";
    categoryId?: number;
    color?: string;
    value?: number;
    y?: number;
    height?: number;
}

interface Link {
    source: string;
    target: string;
    value: number;
    kind?: "income-to-category" | "income-to-uncategorized" | "income-to-savings";
    categoryId?: number;
    targetName?: string;
    ySource?: number;
    yTarget?: number;
    thickness?: number;
}

interface FinancialMapProps {
    month: number;
    year: number;
    startDate?: string | null;
    endDate?: string | null;
    accountId?: string;
    categoryId?: string;
    focusLabel?: string | null;
    onOpenDrilldown?: (filter: AnalyticsDrilldownFilter) => void;
}

export function FinancialMap({
    month,
    year,
    startDate = null,
    endDate = null,
    accountId = "all",
    categoryId = "all",
    focusLabel = null,
    onOpenDrilldown,
}: FinancialMapProps) {
    const [data, setData] = useState<{ nodes: Node[], links: Link[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const periodLabel = startDate && endDate
        ? `${startDate} s/d ${endDate}`
        : new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
        });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                month: String(month),
                year: String(year),
            });

            if (startDate && endDate) {
                params.set("startDate", startDate);
                params.set("endDate", endDate);
            }

            if (accountId !== "all") {
                params.set("accountId", accountId);
            }

            if (categoryId !== "all") {
                params.set("categoryId", categoryId);
            }

            const requestUrl = `/api/analytics/sankey?${params.toString()}`;
            const cachedData = financialMapCache.get(requestUrl);
            if (cachedData) {
                setData(cachedData);
                return;
            }

            const res = await apiFetch(requestUrl);
            const json = await res.json();
            if (json.success) {
                financialMapCache.set(requestUrl, json.data);
                setData(json.data);
            } else {
                setError("Peta keuangan belum bisa dimuat untuk periode ini.");
            }
        } catch (e) {
            console.error(e);
            setError("Gagal memuat peta keuangan.");
        } finally {
            setIsLoading(false);
        }
    }, [accountId, categoryId, endDate, month, startDate, year]);

    const sharedFilter = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        accountId: accountId !== "all" ? Number(accountId) : undefined,
    };

    const handleNodeClick = (node: Node) => {
        if (!onOpenDrilldown) {
            return;
        }

        if (node.kind === "income") {
            onOpenDrilldown({
                title: "Aliran Pemasukan",
                description: "Semua transaksi pemasukan pada periode aktif.",
                type: "income",
                ...sharedFilter,
            });
            return;
        }

        if (node.kind === "expense-category" && node.categoryId) {
            onOpenDrilldown({
                title: `Peta: ${node.name}`,
                description: `Transaksi pengeluaran kategori ${node.name} pada periode aktif.`,
                type: "expense",
                categoryId: node.categoryId,
                ...sharedFilter,
            });
            return;
        }

        if (node.kind === "uncategorized-expense") {
            onOpenDrilldown({
                title: "Pengeluaran Lainnya",
                description: "Transaksi pengeluaran tanpa kategori pada periode aktif.",
                type: "expense",
                ...sharedFilter,
            });
            return;
        }
    };

    const handleLinkClick = (link: Link) => {
        if (!onOpenDrilldown) {
            return;
        }

        if (link.kind === "income-to-category" && link.categoryId) {
            onOpenDrilldown({
                title: `Aliran ke ${link.targetName || "Kategori"}`,
                description: `Transaksi pengeluaran untuk ${link.targetName || "kategori"} pada periode aktif.`,
                type: "expense",
                categoryId: link.categoryId,
                ...sharedFilter,
            });
            return;
        }

        if (link.kind === "income-to-uncategorized") {
            onOpenDrilldown({
                title: "Aliran ke Pengeluaran Lainnya",
                description: "Transaksi pengeluaran tanpa kategori pada periode aktif.",
                type: "expense",
                ...sharedFilter,
            });
            return;
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);



    if (error) {
        return (
            <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto max-w-sm text-center">
                    <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rose-400" />
                    <h4 className="mb-2 font-bold text-slate-900 dark:text-white">Peta Keuangan Gagal Dimuat</h4>
                    <p className="text-xs text-slate-500">{error}</p>
                    <button
                        onClick={loadData}
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
                    >
                        <RefreshCw size={12} />
                        Muat Ulang
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="w-full aspect-[2/1] bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-slate-300 animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Menyusun Peta Keuangan...</p>
                </div>
            </div>
        );
    }

    if (!data || data.nodes.length === 0) {
        return (
            <div className="w-full aspect-[2/1] bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-center justify-center p-8">
                <div className="text-center max-w-xs">
                    <Layers className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <h4 className="font-bold text-slate-900 dark:text-white mb-2">Data Belum Cukup</h4>
                    <p className="text-xs text-slate-500 font-medium">Catat lebih banyak transaksi bulan ini untuk memvisualisasikan aliran uang Bos!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6">
            <div className="flex items-center justify-between mb-8 px-2">
                <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Financial Map
                        <Sparkles size={16} className="text-amber-500" />
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Flow Visualizer · {periodLabel}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {focusLabel && (
                        <div className="flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[10px] font-bold text-sky-600 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-300">
                            FOKUS: {focusLabel}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-100 dark:border-emerald-800/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE FLOW
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-x-auto no-scrollbar pt-4">
                <SankeyFlowChart
                    data={data}
                    isLoading={isLoading}
                    onNodeClick={handleNodeClick}
                    onLinkClick={handleLinkClick}
                />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-start gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-400 shrink-0">
                    <Info size={14} />
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Financial Map menunjukkan alur uang Bos dari sumber pemasukan (kiri) menuju alokasi pengeluaran dan tabungan (kanan). Ketebalan garis mewakili besaran nominal uang.
                </p>
            </div>
        </div>
    );
}
