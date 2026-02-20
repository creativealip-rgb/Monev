"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
        <div className="h-full flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-6 pb-4">
                <div className="pt-2 flex items-center justify-between">
                    <button
                        onClick={onPrev}
                        className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
                        {currentSlide + 1} / {FEATURES.length}
                    </span>
                    <div className="w-10" />
                </div>
            </header>

            {/* Feature Slide */}
            <div className="flex-1 flex flex-col justify-center px-6 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="flex flex-col items-center text-center"
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                                "w-36 h-36 mb-10 rounded-[32px] flex items-center justify-center shadow-2xl",
                                "bg-gradient-to-br",
                                colorConfig.bg,
                                colorConfig.glow
                            )}
                        >
                            {IconComponent && <IconComponent className={cn("w-16 h-16", colorConfig.icon)} />}
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-2xl font-bold text-slate-900 dark:text-white mb-4"
                        >
                            {feature.title}
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-xs"
                        >
                            {feature.description}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="sticky bottom-0 p-6 pb-8 bg-gradient-to-t from-sky-50 via-sky-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent">
                {/* Progress Dots */}
                <div className="flex items-center justify-center mb-6">
                    <ProgressDots
                        total={FEATURES.length}
                        current={currentSlide}
                        onDotClick={goToSlide}
                    />
                </div>

                {/* Arrow Navigation */}
                <div className="flex items-center justify-center gap-6 mb-6">
                    <button
                        onClick={prevSlide}
                        className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Next Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={onNext}
                    className={cn(
                        "w-full btn-primary py-4 text-base font-semibold rounded-2xl",
                        "hover:shadow-xl hover:shadow-sky-500/30"
                    )}
                >
                    Lanjut
                </motion.button>
            </div>
        </div>
    );
}
