"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/frontend/lib/utils";

const screenshots = [
    {
        id: 1,
        src: "/screenshots/dashboard.png",
        alt: "Dashboard Monev",
        label: "Dashboard",
        description: "Lihat ringkasan keuanganmu dalam satu tampilan"
    },
    {
        id: 2,
        src: "/screenshots/transactions.png",
        alt: "Transaksi",
        label: "Catat Transaksi",
        description: "Input transaksi via chat, foto, atau voice"
    },
    {
        id: 3,
        src: "/screenshots/analytics.png",
        alt: "Analisis",
        label: "Analisis AI",
        description: "Wawasan finansial yang dipersonalisasi"
    },
    {
        id: 4,
        src: "/screenshots/chat.png",
        alt: "AI Assistant",
        label: "AI Assistant",
        description: "Tanya apa saja tentang keuanganmu"
    }
];

export function AppScreenshots() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full text-sm font-bold mb-4"
                    >
                        Tampilan Aplikasi
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
                    >
                        Desain yang Dibuat untuk
                        <span className="text-sky-500"> Kenyamanan</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
                    >
                        Interface modern dan intuitif yang membuat mengelola keuangan menjadi menyenangkan
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Screenshot Display */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="relative"
                    >
                        {/* Phone Frame */}
                        <div className="relative mx-auto w-[300px] h-[600px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl shadow-slate-900/30">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-2xl z-10" />
                            
                            {/* Screen */}
                            <div className="relative w-full h-full bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
                                {screenshots.map((screenshot, index) => (
                                    <motion.div
                                        key={screenshot.id}
                                        initial={false}
                                        animate={{
                                            opacity: activeIndex === index ? 1 : 0,
                                            scale: activeIndex === index ? 1 : 0.95,
                                        }}
                                        transition={{ duration: 0.5 }}
                                        className="absolute inset-0"
                                    >
                                        <div className="w-full h-full bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 flex items-center justify-center">
                                            <div className="text-center p-8">
                                                <div className="w-20 h-20 mx-auto mb-4 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center">
                                                    <span className="text-3xl">📱</span>
                                                </div>
                                                <p className="text-slate-400 dark:text-slate-600 text-sm">
                                                    {screenshot.label}
                                                </p>
                                                <p className="text-slate-300 dark:text-slate-700 text-xs mt-2">
                                                    Screenshot akan ditampilkan di sini
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Side Buttons */}
                            <div className="absolute -left-1 top-24 w-1 h-12 bg-slate-800 rounded-l-md" />
                            <div className="absolute -left-1 top-40 w-1 h-12 bg-slate-800 rounded-l-md" />
                            <div className="absolute -right-1 top-28 w-1 h-16 bg-slate-800 rounded-r-md" />
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-200/30 dark:bg-sky-900/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl" />
                    </motion.div>

                    {/* Navigation */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="space-y-4"
                    >
                        {screenshots.map((screenshot, index) => (
                            <motion.button
                                key={screenshot.id}
                                onClick={() => setActiveIndex(index)}
                                className={cn(
                                    "w-full p-6 rounded-2xl text-left transition-all duration-300",
                                    activeIndex === index
                                        ? "bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-l-4 border-sky-500"
                                        : "bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-l-4 border-transparent"
                                )}
                                whileHover={{ x: activeIndex === index ? 0 : 10 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-start gap-4">
                                    <span className={cn(
                                        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                                        activeIndex === index
                                            ? "bg-sky-500 text-white"
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                                    )}>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <h3 className={cn(
                                            "font-bold text-lg mb-1",
                                            activeIndex === index
                                                ? "text-slate-900 dark:text-white"
                                                : "text-slate-600 dark:text-slate-400"
                                        )}>
                                            {screenshot.label}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-500">
                                            {screenshot.description}
                                        </p>
                                    </div>
                                </div>
                            </motion.button>
                        ))}

                        <div className="pt-6">
                            <p className="text-sm text-slate-400 dark:text-slate-600 italic">
                                💡 Tip: Tambahkan screenshot actual aplikasi di folder public/screenshots/
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
