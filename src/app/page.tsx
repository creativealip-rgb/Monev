"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowRight, ShieldCheck,
    Brain, Bot, Scan,
    BarChart3, TrendingUp, ChevronRight
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
            <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between glass-card py-3 px-6 rounded-2xl border-white/50">
                    <div className="flex items-center gap-2.5 group cursor-pointer">
                        <Image
                            src="/icon-192.png"
                            alt="Monev Logo"
                            width={40}
                            height={40}
                            priority
                            sizes="40px"
                            className="rounded-xl shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform duration-300"
                        />
                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Monev</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="hidden sm:block text-slate-600 dark:text-slate-400 font-bold hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                            Masuk
                        </Link>
                        <Link href="/register" className="px-6 py-2.5 bg-slate-900 dark:bg-white dark:text-slate-950 text-white font-bold rounded-xl hover:bg-sky-600 dark:hover:bg-sky-400 dark:hover:text-white transition-all shadow-lg active:scale-95">
                            Coba Gratis
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-44 pb-20 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-[ -0.04em] mb-8 leading-[0.95]"
                    >
                        Master Your Money <br />
                        <span className="text-sky-500 bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600">
                            with AI Logic.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        Catat transaksi lewat suara, foto struk, atau Telegram. Biarkan AI kami yang mengurus sisanya—dari deteksi kategori hingga wawasan finansial proaktif.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-5"
                    >
                        <Link href="/register" className="group w-full sm:w-auto px-10 py-5 bg-sky-500 text-white font-black rounded-3xl hover:bg-sky-600 transition-all shadow-2xl shadow-sky-500/25 flex items-center justify-center gap-3 active:scale-95">
                            Mulai Sekarang
                            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="#features" className="w-full sm:w-auto px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 transition-all flex items-center justify-center gap-2">
                            Lihat Fitur
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-12">DIBUAT UNTUK GENERASI MODERN</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                        <div className="text-2xl font-black text-slate-400">FREELANCERS</div>
                        <div className="text-2xl font-black text-slate-400">FOUNDERS</div>
                        <div className="text-2xl font-black text-slate-400">SAVERS</div>
                        <div className="text-2xl font-black text-slate-400">INVESTORS</div>
                    </div>
                </div>
            </section>

            {/* Features Section (Bento Grid) */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                            Keajaiban yang <br /> Kami Berikan
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold">Teknologi finansial tercanggih dalam satu aplikasi.</p>
                    </div>

                    <div className="grid md:grid-cols-6 gap-6">
                        <FeatureCard
                            className="md:col-span-3"
                            icon={<Scan size={28} />}
                            title="Smart Input (Screenshot & Voice)"
                            desc="Cukup screenshot mutasi bank atau kirim voice note 'tadi beli kopi 20rb', AI kami akan mencatatnya dalam sekejap."
                            delay={0.1}
                        />
                        <FeatureCard
                            className="md:col-span-3"
                            icon={<Bot size={28} />}
                            title="Telegram Sidekick"
                            desc="Kelola pengeluaran langsung dari Telegram. Bot kami siap siaga 24/7 untuk mencatat dan menjawab pertanyaan finansialmu."
                            delay={0.2}
                        />
                        <FeatureCard
                            className="md:col-span-2"
                            icon={<Brain size={28} />}
                            title="AI Financial Advisor"
                            desc="Dapatkan rekomendasi cerdas dari AI tentang cara menghemat uang dan mencapai target tabungan lebih cepat."
                            delay={0.3}
                        />
                        <FeatureCard
                            className="md:col-span-2"
                            icon={<BarChart3 size={28} />}
                            title="Analisis Detektif"
                            desc="Kategorisasi otomatis yang sangat akurat. Detektif Agent kami tahu ke mana uangmu pergi, bahkan sebelum kau menyadarinya."
                            delay={0.4}
                        />
                        <FeatureCard
                            className="md:col-span-2"
                            icon={<ShieldCheck size={28} />}
                            title="Keamanan Ultra"
                            desc="Data finansialmu dienkripsi penuh. Privasi adalah prioritas utama kami, data tidak akan pernah dibagikan."
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
            <section className="py-32 bg-sky-500 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white_0%,transparent_100%)]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-white">
                    <div className="grid md:grid-cols-2 gap-20 items-center">
                        <div>
                            <h2 className="text-5xl font-black tracking-tight mb-8 leading-[0.95]">
                                Hanya butuh <br /> 60 detik untuk <br /> mulai berubah.
                            </h2>
                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Registrasi", desc: "Buat akun dalam hitungan detik." },
                                    { step: "02", title: "Smart Setup", desc: "Hubungkan dengan Telegram Bot atau pilih kategori." },
                                    { step: "03", title: "Master Your Money", desc: "Mulai mencatat dan raih kebebasan finansial." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 items-start">
                                        <span className="text-4xl font-black opacity-30 tracking-tighter">{item.step}</span>
                                        <div>
                                            <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                                            <p className="opacity-80 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="glass-card p-4 rounded-[2.5rem] border-white/20 shadow-2xl overflow-hidden"
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 aspect-square flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-sky-100 dark:bg-sky-900/30 rounded-3xl flex items-center justify-center mb-8">
                                        <TrendingUp size={48} className="text-sky-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Mulai Bertumbuh</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 italic">&ldquo;Finance is not about math, it&apos;s about logic.&rdquo;</p>
                                    <Link href="/register" className="w-full py-4 bg-sky-500 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/30 hover:bg-sky-600 transition-all flex items-center justify-center gap-2">
                                        Ayo Mulai <ChevronRight size={18} />
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-black">M</div>
                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Monev</span>
                    </div>
                    <div className="flex gap-8 text-sm font-bold text-slate-400">
                        <Link href="/login" className="hover:text-sky-500 transition-colors">Masuk</Link>
                        <Link href="/register" className="hover:text-sky-500 transition-colors">Daftar</Link>
                        <Link href="/pricing" className="hover:text-sky-500 transition-colors">Harga</Link>
                    </div>
                    <p className="text-sm text-slate-400 font-bold">
                        &copy; {new Date().getFullYear()} Monev. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Sticky CTA */}
            <StickyCTA />
        </div>
    );
}
