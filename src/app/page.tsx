"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight, ShieldCheck, Zap, Brain, Bot, Scan,
    BarChart3, TrendingUp, Star, Check, X, ChevronDown,
    Users, CreditCard, PiggyBank, Receipt, Lock,
    FileText, MessageCircle, Camera, Mic, Bell
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

function Skeleton() {
    return (
        <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl" />
    );
}

const AppScreenshots = dynamic(
    () => import("./components/AppScreenshots").then(mod => mod.AppScreenshots),
    { ssr: false, loading: () => <Skeleton /> }
);

const TestimonialSection = dynamic(
    () => import("./components/TestimonialSection").then(mod => mod.TestimonialSection),
    { ssr: false, loading: () => <Skeleton /> }
);

const FAQSection = dynamic(
    () => import("./components/FAQSection").then(mod => mod.FAQSection),
    { ssr: false, loading: () => <Skeleton /> }
);

const StickyCTA = dynamic(
    () => import("./components/StickyCTA").then(mod => mod.StickyCTA),
    { ssr: false }
);

// Feature categories with ALL features
const featureCategories = [
    {
        category: "📸 Smart Input",
        description: "Catat transaksi dalam hitungan detik",
        icon: Camera,
        color: "emerald",
        features: [
            {
                icon: Camera,
                title: "Screenshot Agent",
                desc: "Upload screenshot mutasi bank, AI auto-extract"
            },
            {
                icon: Mic,
                title: "Voice Input",
                desc: "Rekam 'tadi beli kopi 35rb', AI catat otomatis"
            },
            {
                icon: Bell,
                title: "Notification Auto-Detect",
                desc: "Notifikasi transfer langsung tercatat"
            }
        ]
    },
    {
        category: "🤖 AI Features",
        description: "Asisten keuangan pribadi 24/7",
        icon: Brain,
        color: "purple",
        features: [
            {
                icon: MessageCircle,
                title: "Monev AI Chat",
                desc: "Tanya apapun tentang keuanganmu, 24/7"
            },
            {
                icon: Brain,
                title: "Auto-Categorization",
                desc: "AI kategorisasi transaksi otomatis"
            },
            {
                icon: TrendingUp,
                title: "Financial Persona",
                desc: "Profil psikologi keuangan personalized"
            },
            {
                icon: Zap,
                title: "Proactive Insights",
                desc: "AI kasih insight sebelum kamu tanya"
            }
        ]
    },
    {
        category: "💰 Money Management",
        description: "Kelola semua aspek keuangan",
        icon: CreditCard,
        color: "sky",
        features: [
            {
                icon: BarChart3,
                title: "Budget Tracking",
                desc: "Set limit per kategori, dapat alert"
            },
            {
                icon: Receipt,
                title: "Bill Management",
                desc: "Track tagihan rutin, auto-reminder"
            },
            {
                icon: PiggyBank,
                title: "Goal/Target Savings",
                desc: "Set target, track progress visual"
            },
            {
                icon: CreditCard,
                title: "Debt Tracking",
                desc: "Catat hutang/piutang, track repayment"
            },
            {
                icon: TrendingUp,
                title: "Investment Portfolio",
                desc: "Track saham, reksadana, crypto"
            },
            {
                icon: Zap,
                title: "Recurring Transactions",
                desc: "Set gaji, cicilan, auto-catat bulanan"
            }
        ]
    },
    {
        category: "📊 Analytics & Reports",
        description: "Pahami pola keuanganmu",
        icon: FileText,
        color: "amber",
        features: [
            {
                icon: BarChart3,
                title: "Spending Heatmap",
                desc: "Lihat pola pengeluaran per kategori"
            },
            {
                icon: TrendingUp,
                title: "Cash Flow Analysis",
                desc: "Pemasukan vs pengeluaran bulanan"
            },
            {
                icon: FileText,
                title: "Export Data",
                desc: "CSV, Excel, PDF kapan saja"
            },
            {
                icon: FileText,
                title: "Bank Templates",
                desc: "Export template BCA, Mandiri, BNI"
            }
        ]
    },
    {
        category: "🔒 Security",
        description: "Data kamu aman 100%",
        icon: Lock,
        color: "rose",
        features: [
            {
                icon: Lock,
                title: "PIN Protection",
                desc: "6 digit PIN untuk akses app"
            },
            {
                icon: ShieldCheck,
                title: "Biometric Lock",
                desc: "Fingerprint/Face ID support"
            },
            {
                icon: ShieldCheck,
                title: "End-to-End Encryption",
                desc: "Data terenkripsi, tidak dijual"
            }
        ]
    }
];

// Comparison data
const comparisonData = {
    headers: ["Fitur", "Monev", "Excel/Notes"],
    rows: [
        { feature: "Auto-Input (Voice/Foto)", monev: true, other: false },
        { feature: "Auto-Categorization", monev: true, other: false },
        { feature: "AI Insights", monev: true, other: false },
        { feature: "Bill Reminders", monev: true, other: false },
        { feature: "Mobile App", monev: true, other: false },
        { feature: "Bank Export Templates", monev: true, other: false },
        { feature: "Security (PIN/Biometric)", monev: true, other: false },
        { feature: "Gratis Selamanya", monev: true, other: true },
    ]
};

// Use cases
const useCases = [
    {
        icon: Users,
        title: "Freelancer",
        desc: "Track project income & expenses automatically. Pisahkan uang pribadi & bisnis.",
        color: "blue"
    },
    {
        icon: CreditCard,
        title: "UMKM Owner",
        desc: "Kelola cashflow, track inventory, monitor profit margin dengan mudah.",
        color: "emerald"
    },
    {
        icon: PiggyBank,
        title: "Professional",
        desc: "Budget management, investment tracking, dan retirement planning dalam satu app.",
        color: "purple"
    },
    {
        icon: Star,
        title: "Student",
        desc: "Belajar financial discipline dari dini. Track uang saku & nabung untuk goals.",
        color: "amber"
    }
];

// FAQ data
const faqData = [
    {
        question: "Apakah benar-benar gratis?",
        answer: "Ya! Paket Gratis bisa dipakai selamanya tanpa batas waktu. Kamu bisa catat sampai 100 transaksi per bulan, pakai fitur dasar, dan 10 Monev AI Chat per hari. Smart Input AI tersedia mulai Pro."
    },
    {
        question: "Aman nggak data saya?",
        answer: "100% aman! Kami pakai enkripsi bank-level (AES-256) dan tidak pernah menjual data ke pihak ketiga. Data kamu hanya bisa diakses oleh kamu sendiri."
    },
    {
        question: "Bisa export data nggak?",
        answer: "Bisa banget! Kamu bisa export ke CSV, Excel, atau PDF kapan saja. Ada juga template khusus untuk BCA, Mandiri, dan BNI biar gampang import ke mobile banking."
    },
    {
        question: "Gimana kalau nggak cocok?",
        answer: "Tenang! Kami ada garansi 30 hari - uang kembali tanpa pertanyaan. Tapi kami yakin kamu bakal suka Monev! 😊"
    },
    {
        question: "Bisa dipakai di iPhone?",
        answer: "Saat ini Monev tersedia sebagai web app yang bisa diakses dari browser apapun (Chrome, Safari, Firefox). Aplikasi Android sedang dalam pengembangan dan akan segera rilis!"
    },
    {
        question: "Apa bedanya paket Gratis, Pro, dan Sultan?",
        answer: "Gratis: 100 transaksi/bulan, fitur dasar, 10 Monev AI Chat/hari, Wawasan disensor. Pro (Rp 29rb): unlimited transaksi, Smart Input AI voice/foto, 100 Monev AI Chat/hari, export CSV+Excel. Sultan (Rp 49rb): semua fitur Pro + Telegram bot AI, AI unlimited, PDF, dan support WhatsApp."
    }
];

export default function LandingPage() {
    const router = useRouter();
    const { status } = useSession();
    const isApk = process.env.NEXT_PUBLIC_IS_APK === "true";

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
            return;
        }

        // TWA/PWA standalone mode → skip landing, go to dashboard
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true;
        if (isApk || isStandalone) {
            router.replace("/dashboard");
        }
    }, [isApk, router, status]);

    // Don't render anything while redirecting in APK/TWA mode to avoid flicker
    if (isApk || status === "authenticated") return <div className="min-h-screen bg-slate-950" />;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-sky-100 selection:text-sky-900 overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-sky-200/30 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-indigo-200/20 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-cyan-200/20 blur-[120px] rounded-full" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 px-6 py-3 pt-safe shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-black text-lg">M</span>
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Monev</span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-1">
                        <Link href="#features" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            Fitur
                        </Link>
                        <Link href="#pricing" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            Harga
                        </Link>
                        <Link href="/help/faq" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            FAQ
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors px-4">
                            Masuk
                        </Link>
                        <Link href="/register" className="px-5 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl text-sm font-bold hover:from-sky-600 hover:to-sky-700 transition-all shadow-lg shadow-sky-500/20">
                            Coba Gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative flex min-h-[100svh] items-center px-6 pb-16 pt-safe sm:pt-32 sm:pb-20 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10 pt-28">
                    {/* Trust Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-4"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-50 text-sky-700 rounded-full text-xs font-bold mb-4">
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            10.000+ UMKM & Freelancer Percaya
                        </span>

                        {/* Main Headline */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-[0.95] tracking-tight">
                            Gaji Numpang Lewat? <br />
                            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                Monev Aja.
                            </span>
                        </h1>
                        
                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                            AI yang bikin kamu paham kemana uang pergi. 
                            Catat dalam 2 detik, gratis selamanya.
                        </p>
                        
                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/register" className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-2xl hover:from-sky-600 hover:to-indigo-700 transition-all shadow-2xl shadow-sky-500/30 flex items-center justify-center gap-2 active:scale-95">
                                Mulai Gratis Sekarang
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 transition-all flex items-center justify-center gap-2">
                                <Zap size={18} className="text-amber-500 fill-amber-500" />
                                Demo 60 Detik
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-emerald-500" />
                                <span>Gratis Selamanya</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-emerald-500" />
                                <span>Tanpa Kartu Kredit</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-emerald-500" />
                                <span>Setup 60 Detik</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check size={16} className="text-emerald-500" />
                                <span>🔒 Data Terenkripsi</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-12 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: "10.000+", label: "User Aktif" },
                            { value: "4.9/5", label: "Rating App" },
                            { value: "500.000+", label: "Transaksi/Bulan" },
                            { value: "99.9%", label: "Uptime" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                            Dibuat Untuk Kamu
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">
                            Apapun profesimu, Monev bantu kelola keuangan dengan lebih cerdas
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {useCases.map((useCase, i) => {
                            const Icon = useCase.icon;
                            const colors: Record<string, string> = {
                                blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                                emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                                purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                                amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                            };

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all"
                                >
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", colors[useCase.color])}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {useCase.desc}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Section (Bento Grid) */}
            <section id="features" className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            Semua Fitur yang Kamu Butuhkan
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto">
                            25+ fitur lengkap untuk kelola keuangan pribadi & bisnis
                        </p>
                    </div>

                    {/* Feature Categories */}
                    <div className="space-y-16">
                        {featureCategories.map((category, catIndex) => {
                            const Icon = category.icon;
                            const colors: Record<string, string> = {
                                emerald: "from-emerald-500 to-teal-600",
                                purple: "from-purple-500 to-pink-600",
                                sky: "from-sky-500 to-blue-600",
                                amber: "from-amber-500 to-orange-600",
                                rose: "from-rose-500 to-red-600"
                            };

                            return (
                                <motion.div
                                    key={catIndex}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: catIndex * 0.1 }}
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", colors[category.color])}>
                                            <Icon size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                                {category.category}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                                {category.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Features Grid */}
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {category.features.map((feature, featIndex) => {
                                            const FeatureIcon = feature.icon;
                                            return (
                                                <motion.div
                                                    key={featIndex}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    whileInView={{ opacity: 1, scale: 1 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: featIndex * 0.05 }}
                                                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg transition-all group"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <FeatureIcon size={20} className="text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                                        {feature.title}
                                                    </h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        {feature.desc}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                            Kenapa Monev Lebih Baik?
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Bandingkan dengan cara lama kelola keuangan
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900">
                                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {comparisonData.headers[0]}
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20">
                                        {comparisonData.headers[1]}
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                                        {comparisonData.headers[2]}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {comparisonData.rows.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {row.feature}
                                        </td>
                                        <td className="px-6 py-4 text-center bg-sky-50 dark:bg-sky-900/10">
                                            <Check size={20} className="inline text-emerald-500" />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <X size={20} className="inline text-slate-300 dark:text-slate-700" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                        Dan masih banyak fitur lainnya! 🚀
                    </p>
                </div>
            </section>

            {/* App Screenshots Section */}
            <AppScreenshots />

            {/* Testimonial Section */}
            <TestimonialSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* How it Works */}
            <section className="py-32 bg-gradient-to-br from-sky-500 to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,White_0%,transparent_100%)]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-white">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-8 leading-[1.1]">
                                Mulai dalam 60 detik <br /> 
                                untuk menguasai keuanganmu.
                            </h2>
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Daftar Gratis", desc: "Cuma butuh email & password. Nggak perlu kartu kredit." },
                                    { step: "02", title: "Catat Transaksi Pertama", desc: "Ketik 'beli kopi 35rb' atau upload struk. AI kami yang urus sisanya." },
                                    { step: "03", title: "Lihat Progress Real-Time", desc: "Dashboard update otomatis. AI kasih insights personalized." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <span className="text-4xl font-black opacity-70 tracking-tighter">{item.step}</span>
                                        <div>
                                            <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                                            <p className="opacity-90">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="bg-white/10 backdrop-blur-lg p-6 rounded-[2.5rem] border border-white/20 shadow-2xl"
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 aspect-square flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-sky-100 to-white dark:from-indigo-900/30 dark:to-slate-800 rounded-3xl flex items-center justify-center mb-8">
                                        <TrendingUp size={48} className="text-sky-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Peningkatkan Kinerja</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 italic">"Meningkatkan efisiensi keuangan bisnis hingga 50%"</p>
                                    <div className="flex gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} size={20} className="text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 text-xs">@umkm_jaya</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-[3rem] p-12 text-center text-white shadow-2xl shadow-sky-500/30 relative overflow-hidden"
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
                                Siap Kuasai Keuanganmu?
                            </h2>
                            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto font-medium">
                                10.000+ user sudah mulai. Sekarang giliranmu.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                                <Link href="/register" className="group w-full sm:w-auto px-10 py-5 bg-white text-sky-600 font-black rounded-2xl hover:bg-sky-50 transition-all shadow-2xl flex items-center justify-center gap-2 active:scale-95 text-lg">
                                    Mulai Gratis Sekarang
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-white" />
                                    <span>Gratis Selamanya</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-white" />
                                    <span>Tanpa Kartu Kredit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-white" />
                                    <span>Cancel Kapan Saja</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-white" />
                                    <span>Garansi 30 Hari</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-black text-sm">M</span>
                                </div>
                                <span className="text-lg font-black text-slate-900 dark:text-white">Monev</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                Solusi keuangan AI pertama untuk UMKM dan pekerja lepas di Indonesia.
                            </p>
                            <div className="flex gap-4">
                                <Link href="#" className="text-slate-400 hover:text-sky-500 transition-colors">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                </Link>
                                <Link href="#" className="text-slate-400 hover:text-sky-500 transition-colors">
                                    <span className="sr-only">GitHub</span>
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Produk</h4>
                            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                <li><Link href="#pricing" className="hover:text-sky-500 transition-colors">Harga</Link></li>
                                <li><Link href="#features" className="hover:text-sky-500 transition-colors">Fitur</Link></li>
                                <li><Link href="/help/docs" className="hover:text-sky-500 transition-colors">Dokumentasi</Link></li>
                                <li><Link href="/help/faq" className="hover:text-sky-500 transition-colors">FAQ</Link></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                <li><Link href="/about" className="hover:text-sky-500 transition-colors">Tentang</Link></li>
                                <li><Link href="/blog" className="hover:text-sky-500 transition-colors">Blog</Link></li>
                                <li><Link href="mailto:alifpm55@gmail.com" className="hover:text-sky-500 transition-colors">Kontak</Link></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                <li><Link href="/privacy" className="hover:text-sky-500 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-sky-500 transition-colors">Terms of Service</Link></li>
                                <li><Link href="/security" className="hover:text-sky-500 transition-colors">Security</Link></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-sm text-slate-400">
                            &copy; {new Date().getFullYear()} PT Monev Teknologi Indonesia. Hak cipta dilindungi.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Sticky CTA */}
            <StickyCTA />
        </div>
    );
}
