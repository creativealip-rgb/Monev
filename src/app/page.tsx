"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight, ShieldCheck,
    Brain, Bot, Scan,
    BarChart3, TrendingUp, ChevronRight, Star
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import dynamic from "next/dynamic";

function ScreenshotsSkeleton() {
    return (
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <div className="mx-auto w-40 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    <div className="mx-auto w-96 max-w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                    <div className="mx-auto w-80 max-w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="mx-auto w-[300px] h-[600px] bg-slate-200 dark:bg-slate-700 rounded-[3rem] animate-pulse" />
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-6 bg-white/50 dark:bg-slate-800/50 rounded-2xl">
                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                    <div className="w-56 h-4 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function TestimonialSkeleton() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <div className="mx-auto w-44 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    <div className="mx-auto w-80 max-w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                    <div className="mx-auto w-72 max-w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="mx-auto w-20 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse mb-2" />
                            <div className="mx-auto w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="flex gap-1 mb-4">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <div key={j} className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                ))}
                            </div>
                            <div className="space-y-2 mb-6">
                                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                                <div className="space-y-2">
                                    <div className="w-28 h-4 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                    <div className="w-20 h-3 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FAQSkeleton() {
    return (
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <div className="mx-auto w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                    <div className="mx-auto w-96 max-w-full h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                    <div className="mx-auto w-72 max-w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse flex-shrink-0 ml-4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

const AppScreenshots = dynamic(
    () => import("./components/AppScreenshots").then(mod => mod.AppScreenshots),
    { ssr: false, loading: () => <ScreenshotsSkeleton /> }
);
const TestimonialSection = dynamic(
    () => import("./components/TestimonialSection").then(mod => mod.TestimonialSection),
    { ssr: false, loading: () => <TestimonialSkeleton /> }
);
const FAQSection = dynamic(
    () => import("./components/FAQSection").then(mod => mod.FAQSection),
    { ssr: false, loading: () => <FAQSkeleton /> }
);
const StickyCTA = dynamic(
    () => import("./components/StickyCTA").then(mod => mod.StickyCTA),
    { ssr: false }
);

function FeatureCard({ icon, title, desc, className, delay = 0 }: { icon: React.ReactNode, title: string, desc: string, className?: string, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className={cn(
                "p-8 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-100 dark:border-slate-800 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-2xl hover:shadow-sky-500/10 transition-all group",
                className
            )}
        >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-sm flex items-center justify-center mb-6 text-sky-600 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-sky-500/10">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
        </motion.div>
    );
}

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-sky-100 selection:text-sky-900 overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-sky-200/30 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-indigo-200/20 blur-[120px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-cyan-200/20 blur-[120px] rounded-full" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/50 px-6 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-black text-lg">M</span>
                        </div>
                        <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Monev</span>
                    </div>
                    
                    <div className="hidden md:flex items-center gap-1">
                        <Link href="/tentang" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            Tentang
                        </Link>
                        <Link href="/fitur" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            Fitur
                        </Link>
                        <Link href="/pricing" className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            Harga
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
            <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-4"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-sky-50 text-sky-700 rounded-full text-xs font-bold mb-4">
                            <Star size={14} className="text-amber-500 fill-amber-500" />
                            Terbaik untuk UKM dan Freelancer
                        </span>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 leading-[0.95] tracking-tight">
                            Manajemen Uang <br />
                            <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                                Super AI-Powered
                            </span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                            Bantu bisnismu tumbuh dengan alat keuangan AI terbaik. 
                            Input lewat Telegram, rekam lewat voice note, dan kontrol semua pengeluaranmu dalam satu wadah.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/register" className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold rounded-2xl hover:from-sky-600 hover:to-indigo-700 transition-all shadow-2xl shadow-sky-500/30 flex items-center justify-center gap-2 active:scale-95">
                                Mulai Gratis Sekarang
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 transition-all flex items-center justify-center gap-2">
                                Lihat Demo
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-12">DIBUAT UNTUK GENERASI MODERN</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="text-2xl font-black text-slate-400">PEKERJA LEPAS</div>
                        <div className="text-2xl font-black text-slate-400">PENDIRI</div>
                        <div className="text-2xl font-black text-slate-400">PENABUNG</div>
                        <div className="text-2xl font-black text-slate-400">INVESTOR</div>
                    </div>
                </div>
            </section>

            {/* Feature Section (Bento Grid) */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            Fitur-Fitur Monev
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold">Segala sesuatu yang kamu perlukan untuk mengelola finansial bisnismu</p>
                    </div>

                    <div className="grid md:grid-cols-6 gap-6">
                        <FeatureCard
                            className="md:col-span-3"
                            icon={<Scan size={28} />}
                            title="Smart Input (Foto Struk & Voice)"
                            desc="Cukup kirim screenshot mutasi bank atau rekam 'tadi beli kopi 35rb', AI kami akan mencatat dan kategorisasikan dalam sekejap."
                            delay={0.1}
                        />
                        <FeatureCard
                            className="md:col-span-3"
                            icon={<Bot size={28} />}
                            title="Telegram Sidekick (AI Bot)"
                            desc="Kelola pengeluaran langsung dari Telegram. Bot kami siap siaga 24/7 untuk mencatat dan memberikan wawasan keuangan."
                            delay={0.2}
                        />
                        <FeatureCard
                            className="md:col-span-2"
                            icon={<Brain size={28} />}
                            title="AI Financial Advisor"
                            desc="Dapatkan saran personal dari AI tentang cara mengoptimalkan pengeluaranmu dan mencapai target tabungan lebih cepat."
                            delay={0.3}
                        />
                        <FeatureCard
                            className="md:col-span-2"
                            icon={<BarChart3 size={28} />}
                            title="Analisis Lengkap"
                            desc="Kategorisasi otomatis, heatmap spending, dan detektif insight untuk memahami ke mana uangmu pergi secara detail."
                            delay={0.4}
                        />
                        <FeatureCard
                            className="md:col-span-2"
                            icon={<ShieldCheck size={28} />}
                            title="Keamanan Data"
                            desc="Data finansialmu diamankan 100% tanpa dibagikan. Enkripsi end-to-end untuk privasi maksimal."
                            delay={0.5}
                        />
                    </div>
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
                                    { step: "01", title: "Buat Akun Gratis", desc: "Daftar dengan email dan verifikasi identitasmu dalam waktu singkat." },
                                    { step: "02", title: "Koneksikan ke Telegram", desc: "Tautkan dengan bot Telegram untuk rekam pengeluaran lewat pesan teks." },
                                    { step: "03", title: "Jalankan Sistemmu", desc: "Mulai menghitung dan memonitor semua transaksi menggunakan kecerdasan AI." }
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
                                Solusi keuangan AI-pertama untuk para UMKM dan pekerja lepas di Indonesia.
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
                                <li><Link href="/pricing" className="hover:text-sky-500 transition-colors">Harga</Link></li>
                                <li><Link href="/fitur" className="hover:text-sky-500 transition-colors">Fitur</Link></li>
                                <li><Link href="/integrations" className="hover:text-sky-500 transition-colors">Integrasi</Link></li>
                                <li><Link href="/sdk" className="hover:text-sky-500 transition-colors">SDK</Link></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                <li><Link href="/about" className="hover:text-sky-500 transition-colors">Tentang</Link></li>
                                <li><Link href="/careers" className="hover:text-sky-500 transition-colors">Karir</Link></li>
                                <li><Link href="/blog" className="hover:text-sky-500 transition-colors">Blog</Link></li>
                                <li><Link href="/contact" className="hover:text-sky-500 transition-colors">Kontak</Link></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                <li><Link href="/privacy" className="hover:text-sky-500 transition-colors">Privacy</Link></li>
                                <li><Link href="/terms" className="hover:text-sky-500 transition-colors">Terms</Link></li>
                                <li><Link href="/compliance" className="hover:text-sky-500 transition-colors">Compliance</Link></li>
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
