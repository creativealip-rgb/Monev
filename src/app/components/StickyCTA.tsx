"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function StickyCTA() {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past hero section (approximately 50% of viewport)
            const scrollThreshold = window.innerHeight * 0.5;
            setIsVisible(window.scrollY > scrollThreshold);
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // Check initial position
        
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ 
                y: isVisible ? 0 : 100, 
                opacity: isVisible ? 1 : 0 
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4"
        >
            <div className="max-w-7xl mx-auto">
                <div className="glass-card bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-2xl shadow-slate-900/20 flex items-center justify-between gap-4">
                    {/* Left Content */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex w-12 h-12 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-xl items-center justify-center">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                                Mulai Kelola Keuanganmu Hari Ini
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                                Coba gratis selama 30 hari, nggak perlu kartu kredit
                            </p>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/register"
                            className="group flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 whitespace-nowrap text-sm sm:text-base"
                        >
                            <span className="hidden sm:inline">Coba Gratis</span>
                            <span className="sm:hidden">Daftar</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
