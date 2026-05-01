"use client";

import { useEffect } from "react";
import { Portal } from "@/frontend/components/Portal";
import { CSVImportWizard } from "@/frontend/components/CSVImportWizard";
import { motion, AnimatePresence } from "framer-motion";

interface ImportCSVModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportCSVModal({ isOpen, onClose, onSuccess }: ImportCSVModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            aria-hidden="true"
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[999998]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="csv-import-title"
                            className="fixed inset-x-4 top-[10%] bottom-[10%] bg-white dark:bg-slate-900 rounded-[2.5rem] z-[999999] shadow-2xl mx-auto max-w-[500px] overflow-hidden"
                        >
                            <CSVImportWizard onClose={onClose} onSuccess={onSuccess} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}
