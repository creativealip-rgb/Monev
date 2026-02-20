"use client";

import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";

interface OnboardingCardProps {
    children: React.ReactNode;
    className?: string;
}

export function OnboardingCard({ children, className }: OnboardingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                "glass-card w-full max-w-md p-8 rounded-3xl relative overflow-hidden",
                className
            )}
        >
            {children}
        </motion.div>
    );
}
