"use client"

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { Sparkles, Info, RefreshCw, Layers } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

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
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [hoveredLink, setHoveredLink] = useState<number | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/analytics/map?month=${month}&year=${year}`);
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

    // Simple layout algorithm for Sankey
    const layout = useMemo(() => {
        if (!data || data.nodes.length === 0) return null;

        const width = 1000;
        const height = 500;
        const nodeWidth = 20;
        const columnSpace = 300;
        const padding = 40;

        // Group nodes by columns
        const col1 = data.nodes.filter(n => n.id.startsWith("income"));
        const col2 = data.nodes.filter(n => n.id === "inflow");
        const col3 = data.nodes.filter(n => n.id === "outflow");
        const col4 = data.nodes.filter(n => n.id.startsWith("expense") || n.id === "idle_cash");

        const layoutNodes: Record<string, any> = {};

        // Helper to position a column
        const positionColumn = (nodes: any[], x: number) => {
            if (nodes.length === 0) return;

            const totalValue = nodes.reduce((acc, n) => {
                const val = data.links.filter(l => l.source === n.id || l.target === n.id)
                    .reduce((sum, l) => sum + (l.source === n.id ? l.value : 0), 0) ||
                    data.links.filter(l => l.target === n.id).reduce((sum, l) => sum + l.value, 0);
                return acc + val;
            }, 0);

            let currentY = padding;
            const availableHeight = height - (padding * 2);
            const scale = totalValue > 0 ? availableHeight / totalValue : 0;

            // Sort nodes by value for cleaner look
            const sortedNodes = [...nodes].sort((a, b) => {
                const valA = data.links.filter(l => l.source === a.id || l.target === a.id).reduce((sum, l) => sum + l.value, 0);
                const valB = data.links.filter(l => l.source === b.id || l.target === b.id).reduce((sum, l) => sum + l.value, 0);
                return valB - valA;
            });

            sortedNodes.forEach(n => {
                const nodeValue = data.links.filter(l => l.source === n.id || l.target === n.id)
                    .reduce((sum, l) => sum + (l.source === n.id ? l.value : 0), 0) ||
                    data.links.filter(l => l.target === n.id).reduce((sum, l) => sum + l.value, 0);

                const nodeHeight = Math.max(nodeValue * scale, 10);
                layoutNodes[n.id] = {
                    ...n,
                    x,
                    y: currentY,
                    height: nodeHeight,
                    width: nodeWidth,
                    value: nodeValue
                };
                currentY += nodeHeight + 20; // 20px gap
            });
        };

        const colGap = (width - (padding * 2) - nodeWidth) / 3;
        positionColumn(col1, padding);
        positionColumn(col2, padding + colGap);
        positionColumn(col3, padding + (colGap * 2));
        positionColumn(col4, padding + (colGap * 3));

        // Connect links
        const sourceOffsets: Record<string, number> = {};
        const targetOffsets: Record<string, number> = {};

        const layoutLinks = data.links.map((l, idx) => {
            const s = layoutNodes[l.source];
            const t = layoutNodes[l.target];
            if (!s || !t) return null;

            const sOffset = sourceOffsets[l.source] || 0;
            const tOffset = targetOffsets[l.target] || 0;

            const scaleS = s.height / data.links.filter(link => link.source === l.source).reduce((acc, link) => acc + link.value, 0);
            const scaleT = t.height / data.links.filter(link => link.target === l.target).reduce((acc, link) => acc + link.value, 0);

            const thickness = l.value * scaleS;
            const yS = s.y + sOffset + (thickness / 2);
            const yT = t.y + tOffset + (l.value * scaleT / 2);

            sourceOffsets[l.source] = sOffset + thickness;
            targetOffsets[l.target] = tOffset + (l.value * scaleT);

            return {
                ...l,
                id: idx,
                xS: s.x + nodeWidth,
                yS,
                xT: t.x,
                yT,
                thickness
            };
        }).filter(Boolean);

        return { nodes: Object.values(layoutNodes), links: layoutLinks };
    }, [data]);

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

    if (!layout || layout.nodes.length === 0) {
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
                <svg
                    viewBox="0 0 1000 500"
                    className="w-full min-w-[800px] h-auto"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        <linearGradient id="linkGradient" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>

                    {/* Links */}
                    {layout.links.map((link: any) => {
                        const isHovered = hoveredLink === link.id || hoveredNode === link.source || hoveredNode === link.target;
                        return (
                            <motion.path
                                key={link.id}
                                d={`M ${link.xS} ${link.yS} C ${(link.xS + link.xT) / 2} ${link.yS}, ${(link.xS + link.xT) / 2} ${link.yT}, ${link.xT} ${link.yT}`}
                                fill="none"
                                stroke={link.source.startsWith("income") ? "#10b981" : link.target === "idle_cash" ? "#8b5cf6" : "#3b82f6"}
                                strokeWidth={link.thickness}
                                strokeOpacity={isHovered ? 0.4 : 0.15}
                                onMouseEnter={() => setHoveredLink(link.id)}
                                onMouseLeave={() => setHoveredLink(null)}
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut", delay: link.id * 0.05 }}
                                className="transition-all cursor-pointer"
                            />
                        );
                    })}

                    {/* Nodes */}
                    {layout.nodes.map((node: any) => {
                        const isHovered = hoveredNode === node.id;
                        const isLinkHovered = layout.links.some((l: any) =>
                            hoveredLink === l.id && (l.source === node.id || l.target === node.id)
                        );

                        return (
                            <g
                                key={node.id}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                            >
                                <motion.rect
                                    x={node.x}
                                    y={node.y}
                                    width={node.width}
                                    height={node.height}
                                    rx={6}
                                    fill={node.color || (node.id.startsWith("income") ? "#10b981" : node.id === "idle_cash" ? "#8b5cf6" : "#3b82f6")}
                                    initial={{ opacity: 0, scaleY: 0 }}
                                    animate={{ opacity: (isHovered || isLinkHovered) ? 1 : 0.8, scaleY: 1 }}
                                    className="cursor-pointer transition-all"
                                />
                                <text
                                    x={node.x + (node.x < 500 ? -12 : node.width + 12)}
                                    y={node.y + (node.height / 2)}
                                    textAnchor={node.x < 500 ? "end" : "start"}
                                    dominantBaseline="middle"
                                    className={cn(
                                        "text-[12px] font-black tracking-tighter transition-all pointer-events-none",
                                        (isHovered || isLinkHovered) ? "fill-slate-900 dark:fill-white font-black" : "fill-slate-400"
                                    )}
                                >
                                    {node.name.toUpperCase()}
                                </text>
                                <text
                                    x={node.x + (node.x < 500 ? -12 : node.width + 12)}
                                    y={node.y + (node.height / 2) + 16}
                                    textAnchor={node.x < 500 ? "end" : "start"}
                                    dominantBaseline="middle"
                                    className={cn(
                                        "text-[10px] font-bold tabular-nums transition-all border pointer-events-none",
                                        (isHovered || isLinkHovered) ? "fill-emerald-500" : "fill-slate-300 dark:fill-slate-700"
                                    )}
                                >
                                    {hideBalance ? "******" : formatCurrency(node.value || 0).replace("Rp", "Rp ")}
                                </text>
                            </g>
                        );
                    })}
                </svg>
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
