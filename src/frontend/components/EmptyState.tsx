"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
    LucideIcon,
    ReceiptText,
    WalletCards
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const lottieAnimations: Record<string, () => Promise<unknown>> = {
    transaction: () => import("@/../public/lottie/empty-transaction.json"),
    search: () => import("@/../public/lottie/empty-search.json"),
    wallet: () => import("@/../public/lottie/empty-wallet.json"),
    piggy: () => import("@/../public/lottie/empty-piggy.json"),
    receipt: () => import("@/../public/lottie/empty-receipt.json"),
    trending: () => import("@/../public/lottie/empty-trending.json"),
    error: () => import("@/../public/lottie/error.json"),
    offline: () => import("@/../public/lottie/offline.json"),
};

interface EmptyStateProps {
    icon?: LucideIcon;
    lottieKey?: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: "default" | "search" | "error" | "success";
    className?: string;
}

const variantConfig = {
    default: {
        iconBg: "bg-sky-100 dark:bg-sky-900/50 border-sky-200 dark:border-sky-700/70 shadow-sky-500/10 dark:shadow-sky-500/20",
        iconColor: "text-sky-600 dark:text-sky-200",
        titleColor: "text-foreground",
        descColor: "text-muted-foreground"
    },
    search: {
        iconBg: "bg-sky-50 dark:bg-sky-900/30",
        iconColor: "text-sky-500 dark:text-sky-400",
        titleColor: "text-foreground",
        descColor: "text-muted-foreground"
    },
    error: {
        iconBg: "bg-rose-50 dark:bg-rose-900/30",
        iconColor: "text-rose-500 dark:text-rose-400",
        titleColor: "text-foreground",
        descColor: "text-muted-foreground"
    },
    success: {
        iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
        iconColor: "text-emerald-500 dark:text-emerald-400",
        titleColor: "text-foreground",
        descColor: "text-muted-foreground"
    }
};

function LottieIcon({ animationKey, className }: { animationKey: string; className?: string }) {
    const [animationData, setAnimationData] = React.useState<Record<string, unknown> | null>(null);

    React.useEffect(() => {
        import(`@/../public/lottie/${animationKey}.json`)
            .then((module) => {
                setAnimationData(module.default || module);
            })
            .catch(() => {
                setAnimationData(null);
            });
    }, [animationKey]);

    if (!animationData) {
        return null;
    }

    return (
        <Lottie
            animationData={animationData}
            loop={true}
            className={className}
        />
    );
}

import React from "react";

export function EmptyState({
    icon: Icon,
    lottieKey,
    title,
    description,
    action,
    variant = "default",
    className
}: EmptyStateProps) {
    const config = variantConfig[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col items-center justify-center py-8 sm:py-12 px-6 text-center",
                className
            )}
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                    "w-24 h-24 rounded-3xl flex items-center justify-center mb-5 shadow-lg border",
                    config.iconBg
                )}
            >
                {lottieKey ? (
                    <LottieIcon animationKey={lottieKey} className="w-16 h-16" />
                ) : Icon ? (
                    <Icon className={cn("w-12 h-12", config.iconColor)} strokeWidth={1.8} />
                ) : null}
            </motion.div>

            <h3 className={cn("text-lg font-bold mb-2", config.titleColor)}>
                {title}
            </h3>

            {description && (
                <p className={cn("text-sm max-w-xs mb-6", config.descColor)}>
                    {description}
                </p>
            )}

            {action && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/25"
                >
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
}

export function NoTransactionsEmpty({ onAddNew, noAccounts }: { onAddNew?: () => void; noAccounts?: boolean }) {
    return (
        <EmptyState
            icon={ReceiptText}
            title={noAccounts ? "Tambahkan akun dulu" : "Belum ada transaksi"}
            description={
                noAccounts
                    ? "Buat akun saldo seperti Cash, Bank, atau E-Wallet sebelum mencatat transaksi."
                    : "Catat pemasukan atau pengeluaran pertamamu supaya riwayat keuangan mulai kebaca."
            }
            action={
                noAccounts
                    ? { label: "+ Tambah Akun", onClick: () => { window.location.href = "/saldo"; } }
                    : onAddNew ? { label: "+ Tambah Transaksi", onClick: onAddNew } : undefined
            }
        />
    );
}

export function NoSearchResultsEmpty({ query }: { query?: string }) {
    return (
        <EmptyState
            lottieKey="search"
            variant="search"
            title="Tidak ada hasil"
            description={query ? `Tidak ditemukan hasil untuk "${query}"` : "Coba kata kunci lain"}
        />
    );
}

export function NoBudgetsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            icon={WalletCards}
            title="Belum ada budget"
            description="Atur batas pengeluaran bulananmu untuk kategori tertentu"
            action={onAddNew ? { label: "Buat Budget", onClick: onAddNew } : undefined}
        />
    );
}

export function NoGoalsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            lottieKey="piggy"
            title="Belum ada tabungan"
            description="Mulai menabung untuk impianmu! Buat target dan pantau progresnya."
            action={onAddNew ? { label: "Buat Target", onClick: onAddNew } : undefined}
        />
    );
}

export function NoBillsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            icon={ReceiptText}
            title="Tidak ada tagihan"
            description="Catat tagihan rutin seperti listrik, internet, atau langganan bulanan"
            action={onAddNew ? { label: "Tambah Tagihan", onClick: onAddNew } : undefined}
        />
    );
}

export function NoInvestmentsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            lottieKey="trending"
            title="Belum ada investasi"
            description="Mulai investasi dan catat portfolio kamu di sini"
            action={onAddNew ? { label: "Tambah Investasi", onClick: onAddNew } : undefined}
        />
    );
}

export function NoDataEmpty({ onRefresh }: { onRefresh?: () => void }) {
    return (
        <EmptyState
            lottieKey="wallet"
            title="Data tidak tersedia"
            description="Belum ada data untuk ditampilkan saat ini"
            action={onRefresh ? { label: "Muat Ulang", onClick: onRefresh } : undefined}
        />
    );
}

export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
    return (
        <EmptyState
            lottieKey="offline"
            variant="error"
            title="Tidak ada koneksi"
            description="Periksa koneksi internetmu dan coba lagi"
            action={onRetry ? { label: "Coba Lagi", onClick: onRetry } : undefined}
        />
    );
}

export function ErrorEmpty({
    title = "Terjadi kesalahan",
    description = "Gagal memuat data. Silakan coba lagi.",
    onRetry
}: {
    title?: string;
    description?: string;
    onRetry?: () => void
}) {
    return (
        <EmptyState
            lottieKey="error"
            variant="error"
            title={title}
            description={description}
            action={onRetry ? { label: "Coba Lagi", onClick: onRetry } : undefined}
        />
    );
}
