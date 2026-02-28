"use client"

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { Sparkles, Info, RefreshCw, Layers } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { SankeyFlowChart } from "@/frontend/components/SankeyFlowChart";

interface Node {
    id: string;
    name: string;
    color?: string;
    value?: number;
    y?: number;
    height?: number;
}

interface Link {
    source: string;
    target: string;
    value: number;
    ySource?: number;
    yTarget?: number;
    thickness?: number;
}

interface FinancialMapProps {
    month: number;
    year: number;
    hideBalance: boolean;
}

export function FinancialMap({ month, year, hideBalance }: FinancialMapProps) {
    const [data, setData] = useState<{ nodes: Node[], links: Link[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/analytics/sankey?month=${month}&year=${year}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [month, year]);



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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Flow Visualizer</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-100 dark:border-emerald-800/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE FLOW
                    </div>
                </div>
            </div>

            <div className="relative w-full overflow-x-auto no-scrollbar pt-4">
                <SankeyFlowChart data={data as any} isLoading={isLoading} />
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
