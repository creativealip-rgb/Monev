"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    Check, X, Zap, Crown, Rocket,
    ArrowRight, ChevronLeft, HelpCircle
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";

const tiers = [
    {
        name: "Miskin",
        price: "Gratis",
        description: "Untuk kamu yang baru mau mulai rapih-rapih keuangan.",
        features: [
            "Catat 50 transaksi / bulan",
            "Dashboard Keuangan Dasar",
            "Maksimal 2 Anggaran",
            "Maksimal 3 Daftar Tagihan",
            "1 Target Tabungan",
            "AI Assistant (3 tanya / hari)",
            "Analisa Keuangan Dasar"
        ],
        notIncluded: [
            "Smart Input (Voice & Foto)",
            "Investasi Portfolio",
            "Telegram Bot Integration",
            "Export Data (CSV/Excel)",
            "Tanpa Iklan",
            "Support Prioritas"
        ],
        cta: "Mulai Gratis",
        href: "/register",
        highlight: false,
        color: "slate"
    },
    {
        name: "Kaya",
        price: "Rp 29.000",
        period: "/bulan",
        description: "Pilihan terbaik untuk mengelola gaya hidup aktif.",
        features: [
            "Transaksi Unlimited",
            "Smart Input (Voice & Foto)",
            "Dashboard Analitik Lengkap",
            "Portfolio Investasi (5 aset)",
            "Maksimal 10 Anggaran",
            "Maksimal 20 Daftar Tagihan",
            "AI Assistant Unlimited",
            "Export CSV & Excel",
            "Bebas Iklan"
        ],
        notIncluded: [
            "Telegram Bot Integration",
            "Insight AI Prioritas",
            "Laporan PDF Custom",
            "Support 24/7"
        ],
        cta: "Pilih Kaya",
        href: "/register?tier=kaya",
        highlight: true,
        color: "sky"
    },
    {
        name: "Sultan",
        price: "Rp 59.000",
        period: "/bulan",
        description: "Kendali penuh finansial dengan asisten pribadi AI.",
        features: [
            "Semua fitur di paket Kaya",
            "Integrasi Telegram Bot (24/7)",
            "Investasi Portfolio Unlimited",
            "Insight AI Proaktif & Prioritas",
            "Laporan PDF Custom",
            "Anggaran & Tagihan Unlimited",
            "Target Tabungan Unlimited",
            "Support Prioritas 24/7"
        ],
        notIncluded: [],
        cta: "Jadi Sultan",
        href: "/register?tier=sultan",
        highlight: false,
        color: "indigo"
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-sky-100 selection:text-sky-900 overflow-x-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-sky-100/40 dark:bg-sky-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-indigo-100/40 dark:bg-indigo-900/10 blur-[120px] rounded-full" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between glass-card py-3 px-6 rounded-2xl border-white/50">
                    <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
                        <Image src="/icon-192.png" alt="Monev Logo" width={32} height={32} className="rounded-lg shadow-md group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Monev</span>
                    </Link>
                    <Link href="/login" className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-slate-950 text-white text-sm font-bold rounded-xl active:scale-95 transition-all">
                        Masuk
                    </Link>
                </div>
            </nav>

            <main className="relative z-10 pt-28 sm:pt-32 pb-20 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8 sm:mb-16 space-y-3 sm:space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-[13px] font-bold border border-sky-100 dark:border-sky-800 shadow-sm"
                        >
                            <Zap size={14} />
                            <span>Pilih Investasi Masa Depanmu</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
                        >
                            Harga Transparan, <br />
                            <span className="text-sky-500">Tanpa Rahasia.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto"
                        >
                            Pilih paket yang sesuai dengan kebutuhan finansialmu. Batalkan kapan saja tanpa komitmen.
                        </motion.p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-24">
                        {tiers.map((tier, idx) => (
                            <motion.div
                                key={tier.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className={cn(
                                    "relative p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col h-full transition-all duration-500 group",
                                    tier.highlight
                                        ? "bg-white dark:bg-slate-900 border-2 border-sky-500 shadow-2xl shadow-sky-500/20 scale-105 z-10"
                                        : "bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-100 dark:border-slate-800 hover:border-sky-200"
                                )}
                            >
                                {tier.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-sky-500 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                        Paling Populer
                                    </div>
                                )}

                                <div className="mb-5 sm:mb-8">
                                    <div className={cn(
                                        "w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-white shadow-lg",
                                        tier.color === "slate" && "bg-slate-500",
                                        tier.color === "sky" && "bg-sky-500",
                                        tier.color === "indigo" && "bg-indigo-500"
                                    )}>
                                        {tier.name === "Miskin" && <Zap size={24} />}
                                        {tier.name === "Kaya" && <Rocket size={24} />}
                                        {tier.name === "Sultan" && <Crown size={24} />}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{tier.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{tier.description}</p>
                                </div>

                                <div className="mb-5 sm:mb-8 flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">{tier.price}</span>
                                    {tier.period && <span className="text-slate-400 font-bold">{tier.period}</span>}
                                </div>

                                <Link
                                    href={tier.href}
                                    className={cn(
                                        "w-full py-3.5 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mb-6 sm:mb-10 active:scale-95",
                                        tier.highlight
                                            ? "bg-sky-500 text-white shadow-xl shadow-sky-500/30 hover:bg-sky-600"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-sky-50"
                                    )}
                                >
                                    {tier.cta}
                                    <ArrowRight size={18} />
                                </Link>

                                <div className="space-y-4 flex-1">
                                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fitur Unggulan</p>
                                    <ul className="space-y-3">
                                        {tier.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                                                    <Check size={12} className="text-sky-600" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                                            </li>
                                        ))}
                                        {tier.notIncluded.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 opacity-40">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                    <X size={12} className="text-slate-400" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-500 line-through decoration-slate-400">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Detailed Comparison Link or Info */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="p-10 rounded-[3rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center"
                    >
                        <HelpCircle size={32} className="mx-auto text-sky-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Punya pertanyaan khusus?</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-6 max-w-lg mx-auto">
                            Tim kami siap membantu menjelaskan detail teknis dari setiap tier.
                        </p>
                        <Link href="/register" className="text-sky-600 font-bold hover:underline inline-flex items-center gap-1">
                            Hubungi Support <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 text-center">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black">M</div>
                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Monev</span>
                    </div>
                    <p className="text-sm text-slate-400 font-bold">
                        &copy; {new Date().getFullYear()} Monev. Hak cipta dilindungi.
                    </p>
                </div>
            </footer>
        </div>
    );
}
