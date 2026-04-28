import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/frontend/lib/utils';
import { motion } from 'framer-motion';

interface SankeyData {
    nodes: Array<{
        id: string;
        name: string;
        kind?: "income" | "expense-category" | "uncategorized-expense" | "savings";
        categoryId?: number;
        value?: number;
    }>;
    links: Array<{
        source: string;
        target: string;
        value: number;
        kind?: "income-to-category" | "income-to-uncategorized" | "income-to-savings";
        categoryId?: number;
        targetName?: string;
    }>;
}

interface SankeyChartProps {
    data: SankeyData | null;
    isLoading: boolean;
    onNodeClick?: (node: SankeyData["nodes"][number]) => void;
    onLinkClick?: (link: SankeyData["links"][number]) => void;
}

interface SankeyTooltipPayloadItem {
    name?: string;
    value?: number;
    payload: {
        source?: { name: string };
        target?: { name: string };
    };
}

interface SankeyTooltipProps {
    active?: boolean;
    payload?: SankeyTooltipPayloadItem[];
}

interface CustomNodeProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    index?: number;
    payload?: { name: string; value?: number } & SankeyData["nodes"][number];
    onClick?: (node: SankeyData["nodes"][number]) => void;
}

type SankeyChartLink = Omit<SankeyData["links"][number], "source" | "target"> & {
    source: number;
    target: number;
    originalLink?: SankeyData["links"][number];
};

interface CustomLinkProps {
    sourceX?: number;
    targetX?: number;
    sourceY?: number;
    targetY?: number;
    linkWidth?: number;
    payload?: SankeyChartLink;
    onClick?: (link: SankeyData["links"][number]) => void;
}

const CustomTooltip = ({ active, payload }: SankeyTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        // Distinguish between Node and Link tooltips
        if (data.payload.source !== undefined) {
            // It's a link
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                    <p className="text-xs font-bold text-slate-500 mb-1">
                        {data.payload.source?.name ?? "Sumber"} ➔ {data.payload.target?.name ?? "Tujuan"}
                    </p>
                    <p className="text-sm font-black text-rose-500">
                        {formatCurrency(data.value ?? 0)}
                    </p>
                </div>
            );
        } else {
            // It's a node
            return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl">
                    <p className="text-sm font-black text-slate-900 dark:text-white mb-1">
                        {data.name}
                    </p>
                    <p className="text-xs font-bold text-sky-500">
                        {formatCurrency(data.value ?? 0)}
                    </p>
                </div>
            );
        }
    }
    return null;
};

// Custom Node rendering for better aesthetics
const CustomNode = ({ x = 0, y = 0, width = 0, height = 0, index = 0, payload, onClick }: CustomNodeProps) => {
    if (!payload) return null;

    const isIncome = index === 0;
    const isSavings = payload.name.includes("Sisa") || payload.name.includes("Tabungan");

    // Choose colors based on node type
    const fill = isIncome ? 'url(#incomeGradient)' : (isSavings ? 'url(#savingsGradient)' : 'url(#expenseGradient)');
    const stroke = isIncome ? '#0ea5e9' : (isSavings ? '#10b981' : '#f43f5e');

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
                rx={4}
                ry={4}
                onClick={() => onClick?.(payload)}
                className={onClick ? "cursor-pointer" : undefined}
            />
            {/* Value Label */}
            <text
                x={isIncome ? x + width + 8 : x - 8}
                y={y + height / 2}
                dy=".35em"
                textAnchor={isIncome ? "start" : "end"}
                className="text-[10px] font-bold fill-slate-700 dark:fill-slate-300 select-none"
            >
                {payload.name}
            </text>
            <text
                x={isIncome ? x + width + 8 : x - 8}
                y={y + height / 2 + 12}
                textAnchor={isIncome ? "start" : "end"}
                className="text-[8px] font-medium fill-slate-500 dark:fill-slate-400 select-none"
            >
                {formatCurrency(payload.value ?? 0)}
            </text>
        </g>
    );
};

const CustomLink = ({ sourceX = 0, targetX = 0, sourceY = 0, targetY = 0, linkWidth = 0, payload, onClick }: CustomLinkProps) => {
    if (!payload) return null;

    const y0 = sourceY + linkWidth / 2;
    const y1 = targetY + linkWidth / 2;
    const path = `M${sourceX},${y0} C${sourceX + (targetX - sourceX) * 0.45},${y0} ${sourceX + (targetX - sourceX) * 0.55},${y1} ${targetX},${y1}`;

    return (
        <path
            d={path}
            fill="none"
            stroke="#cbd5e1"
            strokeOpacity={0.35}
            strokeWidth={Math.max(linkWidth, 10)}
            className={onClick ? "cursor-pointer" : undefined}
            onClick={() => onClick?.(payload.originalLink ?? (payload as unknown as SankeyData["links"][number]))}
        />
    );
};

export const SankeyFlowChart: React.FC<SankeyChartProps> = ({ data, isLoading, onNodeClick, onLinkClick }) => {
    if (isLoading) {
        return (
            <div className="h-[400px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-center animate-pulse">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-sky-500 animate-spin" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memetakan Aliran Uang...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.nodes || data.nodes.length <= 1 || !data.links || data.links.length === 0) {
        return (
            <div className="h-[400px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-2xl">
                    🏜️
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Belum Ada Transaksi</h3>
                <p className="text-xs text-slate-500">Mulai catat pemasukan dan pengeluaran bulan ini untuk melihat peta aliran uang Anda.</p>
            </div>
        );
    }

    const chartData = {
        nodes: data.nodes,
        links: data.links.map((link): SankeyChartLink => {
            const sourceIndex = data.nodes.findIndex((node) => node.id === link.source);
            const targetIndex = data.nodes.findIndex((node) => node.id === link.target);

            return {
                ...link,
                originalLink: link,
                source: sourceIndex >= 0 ? sourceIndex : 0,
                target: targetIndex >= 0 ? targetIndex : 0,
            };
        }),
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[450px] bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-4 relative overflow-hidden"
        >
            <div className="absolute top-6 left-6 z-10 w-full overflow-hidden">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Peta Aliran Kas</h3>
                <p className="text-[10px] font-bold text-slate-400">Distribusi pengeluaran dari sumber dana</p>
            </div>

            <div className="w-full h-[380px] mt-12 pr-6">
                <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                        data={chartData}
                        nodePadding={20}
                        nodeWidth={12}
                        linkCurvature={0.65}
                        margin={{ left: 20, right: 120, top: 20, bottom: 20 }}
                        node={<CustomNode onClick={onNodeClick} />}
                        link={<CustomLink onClick={onLinkClick} />}
                    >
                        <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.8} />
                            </linearGradient>
                            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.8} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip />} />
                    </Sankey>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};
