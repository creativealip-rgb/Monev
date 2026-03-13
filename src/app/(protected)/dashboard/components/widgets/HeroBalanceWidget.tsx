"use client";

import { HeroBalanceCard } from "../../components/HeroBalanceCard";
import { motion } from "framer-motion";
import type { HeroBalanceWidgetProps } from "../../types";

export function HeroBalanceWidget({
    stats,
    mounted,
    onBalanceClick,
    onTransferClick,
    hideBalance,
    onToggleHideBalance,
}: HeroBalanceWidgetProps) {
    return (
        <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="px-6 pt-4 mb-6"
        >
            <HeroBalanceCard
                stats={stats}
                mounted={mounted}
                onBalanceClick={onBalanceClick}
                onTransferClick={onTransferClick}
                hideBalance={hideBalance}
                onToggleHideBalance={onToggleHideBalance}
            />
        </motion.section>
    );
}
