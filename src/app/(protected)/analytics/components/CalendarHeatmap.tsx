"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/frontend/lib/utils";
import { cn } from "@/frontend/lib/utils";

interface HeatmapData {
    date: string;
    count: number;
    total: number;
}

export function CalendarHeatmap({ data }: { data: HeatmapData[] }) {
    // Generate dates for current month view or last 30 days
    // Let's assume data passed is for the selected month
    if (!data || data.length === 0) return null;

    // Helper to get color intensity based on count/amount
    const maxCount = Math.max(...data.map(d => d.count));

    // Create a map for quick lookup
    const dataMap = new Map(data.map(d => [d.date, d]));

    // Get days in month
    const firstDate = new Date(data[0].date);
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        const dateStr = d.toISOString().split('T')[0];
        return {
            date: dateStr,
            day: i + 1,
            data: dataMap.get(dateStr) || { count: 0, total: 0 }
        };
    });

    const getColor = (count: number) => {
        if (count === 0) return "bg-slate-100 dark:bg-slate-800";
        if (count === 1) return "bg-emerald-200 dark:bg-emerald-900/40";
        if (count <= 3) return "bg-emerald-300 dark:bg-emerald-800/60";
        if (count <= 5) return "bg-emerald-400 dark:bg-emerald-700/80";
        return "bg-emerald-500 dark:bg-emerald-600";
    };

    return (
        <div className="card-clean p-6">
            <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Aktivitas Transaksi</h3>

            <div className="grid grid-cols-7 gap-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, i) => (
                    <div key={i} className="text-center text-[10px] text-muted-foreground font-medium mb-2">
                        {day}
                    </div>
                ))}

                {/* Add empty slots for days before start of month if needed, simplified here to just list days */}
                {/* Correct generic calendar grid logic can be complex, sticking to simple day list or 
                    just a grid of days. Let's do a simple grid of all days in month. 
                    We need to know the starting day of week for the 1st of the month.
                */}
                {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}

                {days.map((day) => (
                    <motion.div
                        key={day.date}
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                            "aspect-square rounded-lg flex items-center justify-center relative group cursor-default",
                            getColor(day.data.count)
                        )}
                    >
                        <span className={cn(
                            "text-[10px] font-medium",
                            day.data.count > 3 ? "text-white" : "text-slate-500 dark:text-slate-400"
                        )}>
                            {day.day}
                        </span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            <p>{day.data.count} Transaksi</p>
                            <p>{formatCurrency(day.data.total)}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-muted-foreground">
                <span>Sedikit</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-900/40" />
                    <div className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-800/60" />
                    <div className="w-3 h-3 rounded bg-emerald-400 dark:bg-emerald-700/80" />
                    <div className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-600" />
                </div>
                <span>Banyak</span>
            </div>
        </div>
    );
}
