"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Receipt, BarChart3, Target, Shield, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { ProgressDots } from "./ProgressDots";
import { FEATURES } from "../types";

interface FeatureCarouselProps {
    onNext: () => void;
    onPrev: () => void;
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
    Receipt,
    BarChart3,
    Target,
    Shield,
};

const colorMap: { [key: string]: { bg: string; icon: string; glow: string } } = {
    Receipt: {
        bg: "from-sky-100 to-cyan-100 dark:from-sky-900/30 dark:to-cyan-900/30",
        icon: "text-sky-600 dark:text-sky-400",
        glow: "shadow-sky-500/20"
    },
    BarChart3: {
        bg: "from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30",
        icon: "text-emerald-600 dark:text-emerald-400",
        glow: "shadow-emerald-500/20"
    },
    Target: {
        bg: "from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30",
        icon: "text-amber-600 dark:text-amber-400",
        glow: "shadow-amber-500/20"
    },
    Shield: {
        bg: "from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30",
        icon: "text-purple-600 dark:text-purple-400",
        glow: "shadow-purple-500/20"
    },
};

export function FeatureCarousel({ onNext, onPrev }: FeatureCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [direction, setDirection] = useState(0);

    // Auto-advance slides
    useEffect(() => {
        const timer = setInterval(() => {
            setDirection(1);
            setCurrentSlide((prev) => (prev + 1) % FEATURES.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const goToSlide = (index: number) => {
        setDirection(index > currentSlide ? 1 : -1);
        setCurrentSlide(index);
    };

    const nextSlide = () => {
        setDirection(1);
        setCurrentSlide((prev) => (prev + 1) % FEATURES.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentSlide((prev) => (prev - 1 + FEATURES.length) % FEATURES.length);
    };

    const slideVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    const feature = FEATURES[currentSlide];
    const IconComponent = iconMap[feature.icon];
    const colorConfig = colorMap[feature.icon] || colorMap.Receipt;

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between">
                <button
                    onClick={onPrev}
                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Fitur {currentSlide + 1} / {FEATURES.length}
                </span>
                <div className="w-10" />
            </header>

            {/* Feature Slide */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        className="flex flex-col items-center text-center w-full"
                    >
                        {/* Image or Icon */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                                "w-32 h-32 mb-8 rounded-[32px] flex items-center justify-center shadow-2xl overflow-hidden",
                                !feature.image && "bg-gradient-to-br",
                                !feature.image && colorConfig.bg,
                                colorConfig.glow
                            )}
                        >
                            {feature.image ? (
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                IconComponent && <IconComponent className={cn("w-14 h-14", colorConfig.icon)} />
                            )}
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight"
                        >
                            {feature.title}
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[240px] font-medium"
                        >
                            {feature.description}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="p-8">
                {/* Progress Dots */}
                <div className="flex items-center justify-center mb-8">
                    <ProgressDots
                        total={FEATURES.length}
                        current={currentSlide}
                        onDotClick={goToSlide}
                    />
                </div>

                {/* Next Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={onNext}
                    className={cn(
                        "w-full btn-primary py-4 text-base font-bold rounded-[22px]",
                        "shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all"
                    )}
                >
                    Lanjut
                </motion.button>
            </div>
        </div>
    );
}
