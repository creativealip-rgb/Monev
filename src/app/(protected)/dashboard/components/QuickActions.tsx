"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useI18n } from "@/lib/i18n";

interface QuickActionsProps {
    onAddTransaction: () => void;
}

export function QuickActions({ onAddTransaction }: QuickActionsProps) {
    const { t } = useI18n();
    const haptics = useHaptics();

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
                haptics.medium();
                onAddTransaction();
            }}
            className={cn(
                "fixed bottom-24 right-4 z-[90] hidden h-12 w-12 rounded-full md:flex sm:bottom-28 sm:right-6 sm:h-14 sm:w-14",
                "bg-gradient-to-br from-sky-400 to-sky-600",
                "shadow-lg shadow-sky-500/30",
                "items-center justify-center",
                "text-white",
                "hover:shadow-xl hover:shadow-sky-500/40",
                "active:shadow-md",
                "transition-shadow"
            )}
            aria-label={t("dashboard.addTransaction")}
        >
            <Plus size={28} strokeWidth={2.5} />
        </motion.button>
    );
}
