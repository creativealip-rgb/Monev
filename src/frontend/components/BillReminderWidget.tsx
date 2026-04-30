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
                const dueDate = new Date(currentYear, currentMonth, bill.dueDate);
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
            className="px-4 mb-4 sm:px-6 sm:mb-6"
        >
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.18em]">
                    Tagihan Mendekati
                </h2>
                <Link
                    href="/bills"
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
                >
                    Semua
                    <ArrowRight size={13} />
                </Link>
            </div>

            <Link href="/bills">
                <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                        "relative overflow-hidden rounded-[24px] border p-4 shadow-sm transition-all",
                        isUrgent
                            ? "bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/40"
                            : "bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/40"
                    )}
                >
                    <div className={cn(
                        "absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl",
                        isUrgent ? "bg-rose-300/30" : "bg-sky-300/30"
                    )} />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                            isUrgent ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300" : "bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300"
                        )}>
                            <Calendar size={21} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex items-center gap-2">
                                <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">
                                    {nearestBill.name}
                                </h3>
                                <div className={cn(
                                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black",
                                    isUrgent ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200" : "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200"
                                )}>
                                    <Clock size={11} />
                                    {daysRemaining} hari
                                </div>
                            </div>
                            <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">
                                {formatCurrency(nearestBill.amount).replace("Rp", "Rp ")}
                            </p>
                            <div className={cn(
                                "mt-2 h-1.5 w-full overflow-hidden rounded-full",
                                isUrgent ? "bg-rose-200/70 dark:bg-rose-900/60" : "bg-sky-200/70 dark:bg-sky-900/60"
                            )}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={cn("h-full rounded-full", isUrgent ? "bg-rose-500" : "bg-sky-500")}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        </motion.section>
    );
}
