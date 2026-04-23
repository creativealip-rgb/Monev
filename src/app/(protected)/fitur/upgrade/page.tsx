"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft, Gem, Crown, Sparkles, Star, Zap, Info, Ticket, Loader2, X, ChevronDown, BarChart3 } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";
import Link from "next/link";
import { cn } from "@/frontend/lib/utils";
import { TIER_CONFIGS, UserTier } from "@/lib/tier-gate";
import { useSession } from "next-auth/react";
import { useToast } from "@/frontend/components/UI";
import { useRouter } from "next/navigation";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const TIER_CARDS = [
    {
        id: "starter" as UserTier,
        price: "Rp 0",
        description: "Akses dasar aplikasi, cocok untuk pemula",
        icon: Zap,
        color: "slate",
        gradient: "from-slate-400 to-slate-600",
        highlight: false,
    },
    {
        id: "pro" as UserTier,
        price: "Rp 29k",
        period: "/bulan",
        description: "Untuk profesional dan pengguna serius",
        icon: Sparkles,
        color: "sky",
        gradient: "from-sky-500 to-cyan-600",
        highlight: true,
        tag: "Populer",
    },
    {
        id: "sultan" as UserTier,
        price: "Rp 49k",
        period: "/bulan",
        description: "Akses lengkap tanpa batas untuk para sultan",
        icon: Crown,
        color: "amber",
        gradient: "from-amber-400 to-orange-600",
        highlight: false,
    }
];

const MAYAR_PAYMENT_LINKS: Partial<Record<UserTier, string>> = {
    pro: "https://alipcreative.myr.id/plink/Monev-Pro-Monthly",
    sultan: "https://alipcreative.myr.id/plink/Monev-Sultan-Monthly",
};

export default function UpgradePage() {
    const { data: session, update: updateSession } = useSession();
    const currentTier: UserTier = session?.user?.tier || "starter";
    const toast = useToast();
    const router = useRouter();

    const [couponCode, setCouponCode] = useState("");
    const [isApplying, setIsApplying] = useState(false);
    const [showFullMatrix, setShowFullMatrix] = useState(false);

    const handleUpgradeClick = (tier: UserTier) => {
        const paymentLink = MAYAR_PAYMENT_LINKS[tier];
        if (!paymentLink) {
            toast.error("Paket Tidak Tersedia", "Link pembayaran untuk paket ini belum tersedia");
            return;
        }

        window.location.href = paymentLink;
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) {
            toast.error("Input Kosong", "Masukkan kode kupon terlebih dahulu");
            return;
        }

        setIsApplying(true);
        try {
            const res = await apiFetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: couponCode })
            });

            const data = await res.json();

            if (data.success) {
                toast.success("Berhasil!", `Upgrade ke ${data.tier} berhasil diaktifkan! 🚀`);
                setCouponCode("");
                // Refresh session to update tier globally
                await updateSession();
                router.refresh();
            } else {
                toast.error("Gagal", data.error || "Kode kupon tidak valid");
            }
        } catch {
            toast.error("Error", "Terjadi kesalahan saat memproses kupon");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="min-h-screen pb-24 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe pt-3 bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/profile"
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-foreground tracking-tight">Upgrade Akun</h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Buka Akses Premium</p>
                        </div>
                    </div>
                </div>
            </motion.header>

            <div className="p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-900/30 px-4 py-1.5 rounded-full mb-4 border border-sky-100 dark:border-sky-800">
                        <Gem size={14} className="text-sky-600 dark:text-sky-400" />
                        <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-widest">Pricing Plans</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Pilih Tier Kebanggaanmu</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Atur keuangan lebih advanced dengan fitur premium</p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                >
                    {TIER_CARDS.map((tier) => {
                        const config = TIER_CONFIGS[tier.id];
                        const isCurrent = currentTier === tier.id;
                        const Icon = tier.icon;

                        return (
                            <motion.div
                                key={tier.id}
                                variants={itemVariants}
                                className={cn(
                                    "relative p-6 rounded-[2.5rem] border-2 transition-all duration-300",
                                    tier.highlight
                                        ? "bg-white dark:bg-slate-900 border-sky-500 shadow-2xl shadow-sky-500/10"
                                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                                    isCurrent && "ring-4 ring-emerald-500/20 border-emerald-500"
                                )}
                            >
                                {tier.tag && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-sky-500/30">
                                        {tier.tag}
                                    </div>
                                )}

                                {isCurrent && (
                                    <div className="absolute -top-3 right-8 bg-emerald-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                                        <Star size={10} fill="currentColor" />
                                        Aktif
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-6">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg", tier.gradient)}>
                                        <Icon size={24} className="text-white" />
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-baseline justify-end gap-1">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">{tier.price}</span>
                                            {tier.period && <span className="text-xs font-medium text-slate-500">{tier.period}</span>}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tier.id}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{config.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{tier.description}</p>

                                    <div className="space-y-3">
                                        {config.features.map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                                    tier.highlight ? "bg-sky-50 dark:bg-sky-900/30" : "bg-slate-100 dark:bg-slate-800"
                                                )}>
                                                    <Check size={12} className={cn(tier.highlight ? "text-sky-600 dark:text-sky-400" : "text-slate-500")} strokeWidth={3} />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={isCurrent}
                                    onClick={() => handleUpgradeClick(tier.id)}
                                    className={cn(
                                        "w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-lg",
                                        isCurrent
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default"
                                            : tier.highlight
                                                ? "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/25"
                                                : "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-slate-900/20"
                                    )}
                                >
                                    {isCurrent ? "Paket Saat Ini" : `Upgrade ke ${config.name}`}
                                </button>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Coupon Input Section */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-10 p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Ticket size={18} className="text-sky-500" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Punya Kode Kupon?</h3>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Masukkan kode (e.g. MON3V-FREE)"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all uppercase"
                        />
                        <button
                            onClick={handleApplyCoupon}
                            disabled={isApplying}
                            className="bg-slate-900 dark:bg-sky-500 text-white dark:text-white px-6 py-3 rounded-2xl text-sm font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 min-w-[100px] flex items-center justify-center"
                        >
                            {isApplying ? <Loader2 size={18} className="animate-spin" /> : "Pakai"}
                        </button>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-500 font-medium">Kupon akan langsung mengaktifkan tier premium pilihan kamu.</p>
                </motion.div>

                {/* Access Matrix */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden"
                >
                    <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 size={18} className="text-sky-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Perbandingan Fitur</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Apa saja yang kamu dapat di setiap tier</p>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-2">Fitur</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Starter</div>
                        <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider text-center">Pro</div>
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-center">Sultan</div>
                    </div>

                    {/* Matrix Rows */}
                    {(() => {
                        const allRows = [
                            { feature: "Transaksi", starter: "100/bln", pro: "Unlimited", sultan: "Unlimited" },
                            { feature: "Akun Bank", starter: "2", pro: "10", sultan: "Unlimited" },
                            { feature: "Kategori Anggaran", starter: "3", pro: "20", sultan: "Unlimited" },
                            { feature: "Target Tabungan", starter: "1", pro: "10", sultan: "Unlimited" },
                            { feature: "Tagihan", starter: "3", pro: "20", sultan: "Unlimited" },
                            { feature: "Track Investasi", starter: false, pro: "Manual", sultan: "Real-time Sync" },
                            { feature: "AI Chats Web", starter: "5/hari", pro: "100/hari", sultan: "Unlimited" },
                            { feature: "OCR Scans", starter: "5/bln", pro: "100/bln", sultan: "Unlimited" },
                            { feature: "Export Format", starter: "CSV", pro: "CSV + Excel", sultan: "CSV + Excel + PDF" },
                            { feature: "Analitik Lanjutan", starter: false, pro: true, sultan: "Prediksi AI" },
                            { feature: "Telegram Bot", starter: false, pro: "Command-based", sultan: "AI Conversational" },
                            { feature: "Laporan Pajak", starter: false, pro: false, sultan: true },
                            { feature: "Cloud Backup", starter: false, pro: false, sultan: true },
                            { feature: "Support Prioritas", starter: false, pro: "Email", sultan: "WhatsApp" },
                            { feature: "Iklan", starter: true, pro: false, sultan: false },
                            { feature: "Cetak Laporan", starter: false, pro: false, sultan: true },
                            { feature: "Recurring Transfer", starter: false, pro: true, sultan: true },
                            { feature: "Catatan Hutang", starter: false, pro: true, sultan: true },
                            { feature: "Kontrol Keluarga", starter: false, pro: "1 pasangan", sultan: "5 pasangan" },
                        ];

                        const visibleRows = showFullMatrix ? allRows : allRows.slice(0, 6);

                        const renderCell = (value: string | boolean) => {
                            if (typeof value === "boolean") {
                                if (value === true) return <Check size={14} className="text-emerald-500 mx-auto" strokeWidth={3} />;
                                if (value === false) return <X size={14} className="text-slate-300 dark:text-slate-600 mx-auto" strokeWidth={3} />;
                                return <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">-</span>;
                            }
                            return <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{value}</span>;
                        };

                        return (
                            <>
                                {visibleRows.map((row, i) => (
                                    <div
                                        key={row.feature}
                                        className={cn(
                                            "grid grid-cols-4 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 items-center",
                                            i % 2 === 0 ? "bg-transparent" : "bg-slate-50/50 dark:bg-slate-800/20"
                                        )}
                                    >
                                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 pl-2">{row.feature}</div>
                                        <div className="text-center">{renderCell(row.starter)}</div>
                                        <div className="text-center">{renderCell(row.pro)}</div>
                                        <div className="text-center">{renderCell(row.sultan)}</div>
                                    </div>
                                ))}

                                <AnimatePresence>
                                    {showFullMatrix && allRows.slice(6).map((row, i) => (
                                        <motion.div
                                            key={row.feature}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className={cn(
                                                "grid grid-cols-4 px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 items-center",
                                                (i + 6) % 2 === 0 ? "bg-transparent" : "bg-slate-50/50 dark:bg-slate-800/20"
                                            )}
                                        >
                                            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 pl-2">{row.feature}</div>
                                            <div className="text-center">{renderCell(row.starter)}</div>
                                            <div className="text-center">{renderCell(row.pro)}</div>
                                            <div className="text-center">{renderCell(row.sultan)}</div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </>
                        );
                    })()}

                    {/* Expand/Collapse Button */}
                    <button
                        onClick={() => setShowFullMatrix(!showFullMatrix)}
                        className="w-full py-4 flex items-center justify-center gap-2 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all active:scale-[0.98]"
                    >
                        {showFullMatrix ? "Sembunyikan" : `Lihat ${14 - 6} fitur lainnya`}
                        <motion.div
                            animate={{ rotate: showFullMatrix ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ChevronDown size={14} />
                        </motion.div>
                    </button>
                </motion.div>

                {/* Info Note */}
                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-10 p-5 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 flex gap-4"
                >
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-800 flex items-center justify-center shrink-0">
                        <Info size={20} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-widest mb-1">Catatan Penting</h4>
                        <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-300 font-medium">Pembayaran paket Pro dan Sultan akan diarahkan ke halaman checkout Mayar. Setelah pembayaran berhasil, lanjutkan kembali ke aplikasi untuk verifikasi status upgrade.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
