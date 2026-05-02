"use client";

import {
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    EyeOff,
    ArrowRightLeft,
} from "lucide-react";
import { ThemeSelector } from "@/frontend/components/ThemeSelector";
import { useHeroTheme } from "@/frontend/lib/hero-theme";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { useI18n } from "@/lib/i18n";

export interface HeroBalanceCardProps {
    stats: {
        income: number;
        expense: number;
        balance: number;
        growth?: number;
        incomeGrowth?: number;
        expenseGrowth?: number;
        totalGoals?: number;
        totalInvestments?: number;
        fees?: number;
        totalAccounts?: number;
        accountCount?: number;
    };
    mounted: boolean;
    onBalanceClick: () => void;
    onTransferClick: () => void;
    hideBalance: boolean;
    onToggleHideBalance: () => void;
}

export function HeroBalanceCard({
    stats,
    mounted,
    onBalanceClick,
    onTransferClick,
    hideBalance,
    onToggleHideBalance,
}: HeroBalanceCardProps) {
    const { t, locale } = useI18n();
    const { themeConfig } = useHeroTheme();

    return (
        <div className={cn(
            "card-clean relative overflow-hidden rounded-[28px] border border-white/10 text-white p-4 cursor-pointer sm:rounded-[32px] sm:p-6",
            "bg-gradient-to-br transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 hover:brightness-110 hover:shadow-2xl hover:shadow-sky-500/10",
            themeConfig.gradient,
            themeConfig.shadowColor
        )}>
            <div className={cn("absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 opacity-60", themeConfig.glowColor)} />
            <div className={cn("absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl -ml-10 -mb-10 opacity-40", themeConfig.bgEffect)} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 opacity-20" />

            <div
                className="relative z-10 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-600"
                role="button"
                tabIndex={0}
                aria-label="Buka rincian saldo"
                onClick={onBalanceClick}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onBalanceClick();
                    }
                }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <p className="text-white/70 text-xs font-medium group-hover:text-white transition-colors">{t("dashboard.totalWealth")}</p>
                        <ChevronRight size={14} className="text-white/50 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                            <ThemeSelector />
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleHideBalance();
                            }}
                            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            title={hideBalance ? (locale === "id" ? "Tampilkan saldo" : "Show balance") : (locale === "id" ? "Sembunyikan saldo" : "Hide balance")}
                        >
                            {hideBalance ? (
                                <EyeOff size={14} className="text-white/70" />
                            ) : (
                                <Eye size={14} className="text-white/70" />
                            )}
                        </button>
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full",
                            (stats.growth || 0) >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                        )}>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                (stats.growth || 0) >= 0 ? "bg-emerald-400" : "bg-rose-400"
                            )} />
                            <span className={cn(
                                "text-[10px] font-semibold",
                                (stats.growth || 0) >= 0 ? "text-emerald-300" : "text-rose-300"
                            )}>
                                {(stats.growth || 0) >= 0 ? "+" : ""}{(stats.growth || 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold tracking-tight mb-1 group-hover:scale-[1.02] transition-transform origin-left tabular-nums sm:text-3xl">
                    {!mounted ? "Loading..." : hideBalance ? "******" : formatCurrency(stats.totalAccounts || 0)}
                </h2>
                <p className="text-white/60 text-[10px] font-medium mb-4 sm:mb-6">
                    Saldo dari {stats.accountCount || 0} akun
                </p>
            </div>

            <div className="flex gap-3">
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border sm:p-4 border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <ArrowDownRight size={14} className="text-emerald-300" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{t("dashboard.income")}</p>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                        <p className="truncate font-bold text-[12px] text-emerald-300 tabular-nums sm:text-[13px]">
                            + {!mounted ? "..." : hideBalance ? "******" : formatCurrency(stats.income).replace("Rp", "")}
                        </p>
                        {mounted && !hideBalance && stats.incomeGrowth !== undefined && stats.incomeGrowth !== 0 && (
                            <span className={cn(
                                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                stats.incomeGrowth > 0
                                    ? "bg-emerald-400/20 text-emerald-200"
                                    : "bg-rose-400/20 text-rose-200"
                            )}>
                                {stats.incomeGrowth > 0 ? (
                                    <ArrowUpRight size={8} />
                                ) : (
                                    <ArrowDownRight size={8} />
                                )}
                                {stats.incomeGrowth > 0 ? "+" : ""}{stats.incomeGrowth.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-3 border sm:p-4 border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                            <ArrowUpRight size={14} className="text-rose-300" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">{t("dashboard.expense")}</p>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                        <p className="truncate font-bold text-[12px] text-rose-300 tabular-nums sm:text-[13px]">
                            − {!mounted ? "..." : hideBalance ? "******" : formatCurrency(stats.expense + (stats.fees || 0)).replace("Rp", "")}
                        </p>
                        {mounted && !hideBalance && stats.expenseGrowth !== undefined && stats.expenseGrowth !== 0 && (
                            <span className={cn(
                                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
                                stats.expenseGrowth > 0
                                    ? "bg-rose-400/20 text-rose-200"
                                    : "bg-emerald-400/20 text-emerald-200"
                            )}>
                                {stats.expenseGrowth > 0 ? (
                                    <ArrowUpRight size={8} />
                                ) : (
                                    <ArrowDownRight size={8} />
                                )}
                                {stats.expenseGrowth > 0 ? "+" : ""}{stats.expenseGrowth.toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onTransferClick}
                className="mt-4 w-full py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
            >
                <ArrowRightLeft size={16} />
                {t("common.transfer")}
            </button>
        </div>
    );
}
