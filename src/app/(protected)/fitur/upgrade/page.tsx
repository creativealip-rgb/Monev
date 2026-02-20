"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Gem, Crown, Sparkles, Star, Zap, Info, Ticket, Loader2 } from "lucide-react";
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
        id: "miskin" as UserTier,
        price: "Rp 0",
        description: "Untuk kamu yang baru mulai belajar hemat",
        icon: Zap,
        color: "slate",
        gradient: "from-slate-400 to-slate-600",
        highlight: false,
    },
    {
        id: "kaya" as UserTier,
        price: "Rp 29k",
        period: "/bulan",
        description: "Pilihan paling cerdas untuk pengelolaan serius",
        icon: Sparkles,
        color: "sky",
        gradient: "from-sky-500 to-cyan-600",
        highlight: true,
        tag: "Populer",
    },
    {
        id: "sultan" as UserTier,
        price: "Rp 99k",
        period: "/bulan",
        description: "Akses eksklusif tanpa batas untuk sang Sultan",
        icon: Crown,
        color: "amber",
        gradient: "from-amber-400 to-orange-600",
        highlight: false,
    }
];

export default function UpgradePage() {
    const { data: session, update: updateSession } = useSession();
    // @ts-ignore
    const currentTier = (session?.user?.tier || "miskin") as UserTier;
    const toast = useToast();
    const router = useRouter();

    const [couponCode, setCouponCode] = useState("");
    const [isApplying, setIsApplying] = useState(false);

    const handleApplyCoupon = async () => {
        if (!couponCode) {
            toast.error("Input Kosong", "Masukkan kode kupon terlebih dahulu");
            return;
        }

        setIsApplying(true);
        try {
            const res = await fetch("/api/coupons/validate", {
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
        } catch (error) {
            toast.error("Error", "Terjadi kesalahan saat memproses kupon");
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 pt-safe pb-4"
            >
                <div className="flex items-center gap-3 pt-2">
                    <Link
                        href="/profile"
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95"
                    >
                        <ArrowLeft size={16} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Upgrade Akun</h1>
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
                                    disabled={isCurrent}
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
                        <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-300 font-medium">Pembayaran saat ini dilakukan secara manual. Setelah melakukan pembayaran, harap konfirmasi melalui menu bantuan atau hubungi admin di Telegram.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
