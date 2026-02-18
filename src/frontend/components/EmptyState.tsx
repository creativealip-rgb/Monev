"use client";

import { motion } from "framer-motion";
import { 
    Inbox, 
    Search, 
    Wallet, 
    TrendingUp, 
    PiggyBank, 
    Receipt,
    FileText,
    CreditCard,
    AlertCircle,
    Wifi,
    LucideIcon
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface EmptyStateProps {
    icon?: LucideIcon;
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
        iconBg: "bg-slate-100",
        iconColor: "text-slate-400",
        titleColor: "text-slate-700",
        descColor: "text-slate-500"
    },
    search: {
        iconBg: "bg-sky-50",
        iconColor: "text-sky-500",
        titleColor: "text-slate-700",
        descColor: "text-slate-500"
    },
    error: {
        iconBg: "bg-rose-50",
        iconColor: "text-rose-500",
        titleColor: "text-slate-700",
        descColor: "text-slate-500"
    },
    success: {
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-500",
        titleColor: "text-slate-700",
        descColor: "text-slate-500"
    }
};

export function EmptyState({
    icon: Icon,
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
                "flex flex-col items-center justify-center py-12 px-6 text-center",
                className
            )}
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center mb-6",
                    config.iconBg
                )}
            >
                {Icon ? (
                    <Icon className={cn("w-10 h-10", config.iconColor)} strokeWidth={1.5} />
                ) : (
                    <Inbox className={cn("w-10 h-10", config.iconColor)} strokeWidth={1.5} />
                )}
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

export function NoTransactionsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            icon={CreditCard}
            title="Belum ada transaksi"
            description="Mulai catat pengeluaran dan pemasukanmu untuk melihat riwayat keuangan"
            action={onAddNew ? { label: "Tambah Transaksi", onClick: onAddNew } : undefined}
        />
    );
}

export function NoSearchResultsEmpty({ query }: { query?: string }) {
    return (
        <EmptyState
            icon={Search}
            variant="search"
            title="Tidak ada hasil"
            description={query ? `Tidak ditemukan hasil untuk "${query}"` : "Coba kata kunci lain"}
        />
    );
}

export function NoBudgetsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            icon={Wallet}
            title="Belum ada budget"
            description="Atur batas pengeluaran bulananmu untuk kategori tertentu"
            action={onAddNew ? { label: "Buat Budget", onClick: onAddNew } : undefined}
        />
    );
}

export function NoGoalsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            icon={PiggyBank}
            title="Belum ada tabungan"
            description="Mulai menabung untuk impianmu! Buat goal dan pantau progressnya"
            action={onAddNew ? { label: "Buat Goal", onClick: onAddNew } : undefined}
        />
    );
}

export function NoBillsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            icon={Receipt}
            title="Tidak ada tagihan"
            description="Catat tagihan rutin seperti listrik, internet, atau langganan bulanan"
            action={onAddNew ? { label: "Tambah Tagihan", onClick: onAddNew } : undefined}
        />
    );
}

export function NoInvestmentsEmpty({ onAddNew }: { onAddNew?: () => void }) {
    return (
        <EmptyState
            icon={TrendingUp}
            title="Belum ada investasi"
            description="Mulai investasi dan catat portfolio kamu di sini"
            action={onAddNew ? { label: "Tambah Investasi", onClick: onAddNew } : undefined}
        />
    );
}

export function NoDataEmpty({ onRefresh }: { onRefresh?: () => void }) {
    return (
        <EmptyState
            icon={FileText}
            title="Data tidak tersedia"
            description="Belum ada data untuk ditampilkan saat ini"
            action={onRefresh ? { label: "Muat Ulang", onClick: onRefresh } : undefined}
        />
    );
}

export function OfflineEmpty({ onRetry }: { onRetry?: () => void }) {
    return (
        <EmptyState
            icon={Wifi}
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
            icon={AlertCircle}
            variant="error"
            title={title}
            description={description}
            action={onRetry ? { label: "Coba Lagi", onClick: onRetry } : undefined}
        />
    );
}
