"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

const pageVariants: Variants = {
    initial: {
        opacity: 0,
        y: 10
    },
    enter: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.2,
            ease: "easeIn"
        }
    }
};

const slideVariants: Variants = {
    initial: {
        opacity: 0,
        x: 20
    },
    enter: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    },
    exit: {
        opacity: 0,
        x: -20,
        transition: {
            duration: 0.2,
            ease: "easeIn"
        }
    }
};

const fadeVariants: Variants = {
    initial: {
        opacity: 0
    },
    enter: {
        opacity: 1,
        transition: {
            duration: 0.2,
            ease: "easeOut"
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.15,
            ease: "easeIn"
        }
    }
};

export function PageTransition({ children, className }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={pageVariants}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

export function SlideTransition({ children, className }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={slideVariants}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

export function FadeTransition({ children, className }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                initial="initial"
                animate="enter"
                exit="exit"
                variants={fadeVariants}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

export function StaggerContainer({ 
    children, 
    className,
    staggerDelay = 0.1 
}: { 
    children: ReactNode; 
    className?: string;
    staggerDelay?: number;
}) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ 
    children, 
    className 
}: { 
    children: ReactNode; 
    className?: string;
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: {
                        duration: 0.3,
                        ease: "easeOut"
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function ScaleIn({ 
    children, 
    className,
    delay = 0 
}: { 
    children: ReactNode; 
    className?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
                duration: 0.3, 
                delay,
                ease: "easeOut"
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
