"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/frontend/lib/utils";
import { Wallet, TrendingUp, PiggyBank, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface NetWorthProps {
    balance: number;
    investments: number;
    goals: number;
    isLoading?: boolean;
}

export function NetWorthCard({ balance, investments, goals, isLoading = false }: NetWorthProps) {
    const [showAmount, setShowAmount] = useState(true);
    const total = balance + investments + goals;

    if (isLoading) {
        return (
            <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-[2rem] animate-pulse" />
        );
    }

    return (
        <div className="card-clean p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white dark:from-slate-800 dark:to-slate-900">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Total Net Worth</span>
                <button
                    onClick={() => setShowAmount(!showAmount)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    {showAmount ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
            </div>

            <motion.h2
                key={showAmount ? "show" : "hide"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black tracking-tight mb-6"
            >
                {showAmount ? formatCurrency(total) : "********"}
            </motion.h2>

            <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Wallet size={12} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Cash</span>
                    </div>
                    <p className="text-sm font-bold">
                        {showAmount ? formatCurrency(balance) : "****"}
                    </p>
                </div>

                <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <TrendingUp size={12} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Invest</span>
                    </div>
                    <p className="text-sm font-bold">
                        {showAmount ? formatCurrency(investments) : "****"}
                    </p>
                </div>

                <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
                    <div className="flex items-center gap-1.5 text-blue-400">
                        <PiggyBank size={12} />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Goals</span>
                    </div>
                    <p className="text-sm font-bold">
                        {showAmount ? formatCurrency(goals) : "****"}
                    </p>
                </div>
            </div>
        </div>
    );
}
