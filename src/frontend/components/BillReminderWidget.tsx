"use client";

import { motion } from "framer-motion";
import { Clock, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
import Link from "next/link";
import { useMemo } from "react";

import { Bill } from "@/types";

interface BillReminderWidgetProps {
    bills?: Bill[];
}

function getDefaultBills(): Bill[] {
    return [
        {
            id: 1,
            name: "Netflix",
            amount: 54000,
            dueDate: 15,
            category: "Hiburan",
            isPaid: false,
            color: "#e11d48",
            userId: 1,
            createdAt: new Date(),
            frequency: "monthly",
            icon: "Receipt",
            isActive: true,
            isSubscription: true,
            lastPaidAt: null,
            lastDetectedDate: null,
            notes: null
        } as unknown as Bill,
        {
            id: 2,
            name: "Listrik PLN",
            amount: 350000,
            dueDate: 20,
            category: "Tagihan",
            isPaid: false,
            color: "#eab308",
            userId: 1,
            createdAt: new Date(),
            frequency: "monthly",
            icon: "Receipt",
            isActive: true,
            isSubscription: false,
            lastPaidAt: null,
            lastDetectedDate: null,
            notes: null
        } as unknown as Bill
    ];
}

export function BillReminderWidget({ bills: propBills }: BillReminderWidgetProps) {
    const bills = propBills || getDefaultBills();

    const { nearestBill, daysRemaining } = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const upcoming = (bills || [])
            .filter(bill => !bill.isPaid)
            .map(bill => {
                let dueDate = new Date(currentYear, currentMonth, bill.dueDate);
                if (bill.dueDate < currentDay) {
                    // It's for next month
                    dueDate.setMonth(currentMonth + 1);
                }
                return { ...bill, calculatedDueDate: dueDate };
            })
            .sort((a, b) => a.calculatedDueDate.getTime() - b.calculatedDueDate.getTime());

        if (upcoming.length === 0) {
            return { nearestBill: null, daysRemaining: 0 };
        }

        const nearest = upcoming[0];
        const diff = nearest.calculatedDueDate.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

        return { nearestBill: nearest, daysRemaining: days };
    }, [bills]);

    if (!nearestBill) {
        return null;
    }

    const isUrgent = daysRemaining <= 3;
    const progressPercent = Math.min(100, Math.max(0, (1 - daysRemaining / 30) * 100));

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-6 mb-8"
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">
                    Tagihan Mendekati
                </h2>
                <Link
                    href="/bills"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
                >
                    Lihat Semua
                    <ArrowRight size={14} />
                </Link>
            </div>

            <Link href="/bills">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        "relative overflow-hidden rounded-3xl p-6 shadow-lg border transition-all",
                        isUrgent
                            ? "bg-gradient-to-br from-rose-500 to-rose-600 border-rose-400/30"
                            : "bg-gradient-to-br from-sky-500 to-sky-600 border-sky-400/30"
                    )}
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-60" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl -ml-8 -mb-8 opacity-40" />

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className={cn(
                                    "text-xs font-medium mb-1",
                                    isUrgent ? "text-rose-100" : "text-sky-100"
                                )}>
                                    Tagihan Terdekat
                                </p>
                                <h3 className="text-xl font-bold text-white">
                                    {nearestBill.name}
                                </h3>
                            </div>
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                isUrgent ? "bg-white/20" : "bg-cyan-400/20"
                            )}>
                                <Calendar size={24} className="text-white" />
                            </div>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className={cn(
                                    "text-[11px] font-medium mb-1",
                                    isUrgent ? "text-rose-200" : "text-sky-200"
                                )}>
                                    Jumlah Tagihan
                                </p>
                                <p className="text-2xl font-bold text-white tabular-nums">
                                    {formatCurrency(nearestBill.amount).replace("Rp", "Rp ")}
                                </p>
                            </div>

                            <div className="text-right">
                                <div className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-1",
                                    isUrgent ? "bg-white/20" : "bg-cyan-400/20"
                                )}>
                                    <Clock size={14} className="text-white" />
                                    <span className="text-sm font-bold text-white">
                                        {daysRemaining} hari lagi
                                    </span>
                                </div>
                                {daysRemaining === 0 && (
                                    <span className="text-xs text-rose-200 font-medium">
                                        Jatuh tempo hari ini!
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className={cn(
                                "w-full h-2 rounded-full overflow-hidden",
                                isUrgent ? "bg-white/20" : "bg-sky-400/30"
                            )}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={cn(
                                        "h-full rounded-full",
                                        isUrgent ? "bg-white" : "bg-cyan-300"
                                    )}
                                />
                            </div>
                            <p className={cn(
                                "text-[10px] mt-2 font-medium",
                                isUrgent ? "text-rose-200" : "text-sky-200"
                            )}>
                                Progress menuju jatuh tempo
                            </p>
                        </div>
                    </div>
                </motion.div>
            </Link>
        </motion.section>
    );
}
