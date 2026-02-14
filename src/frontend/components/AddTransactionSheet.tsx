"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Camera, Mic, Bell, Sparkles } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useEffect, useState } from "react";
import { TransactionForm } from "./TransactionForm";
import { SmartInput } from "./SmartInput";

interface AddTransactionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const actions = [
    {
        id: "manual",
        icon: FileText,
        label: "Manual Entry",
        description: "Ketik nama & nominal",
        color: "blue",
    },
    {
        id: "screenshot",
        icon: Camera,
        label: "Scan Screenshot",
        description: "Upload bukti transfer",
        color: "emerald",
    },
    {
        id: "voice",
        icon: Mic,
        label: "Voice Note",
        description: "Rekam suara perintah",
        color: "purple",
    },
    {
        id: "notification",
        icon: Bell,
        label: "Import Notifikasi",
        description: "Scan notif bank/ewallet",
        color: "orange",
    },
];

export function AddTransactionSheet({ isOpen, onClose, onSuccess }: AddTransactionSheetProps) {
    const [showForm, setShowForm] = useState(false);
    const [smartInputMode, setSmartInputMode] = useState<"screenshot" | "voice" | null>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const handleAction = (actionId: string) => {
        if (actionId === "manual") {
            setShowForm(true);
        } else if (actionId === "screenshot") {
            setSmartInputMode("screenshot");
        } else if (actionId === "voice") {
            setSmartInputMode("voice");
        } else {
            console.log(`Action selected: ${actionId}`);
            onClose();
        }
    };

    const handleFormClose = () => {
        setShowForm(false);
        onClose();
    };

    const handleSmartInputSuccess = (data: {
        merchantName: string;
        amount: number;
        description: string;
        category: string;
    }) => {
        // SmartInput saves directly, close everything
        setSmartInputMode(null);
        onClose();
    };

    const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
        blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-200" },
        orange: { bg: "bg-orange-50", text: "text-orange-600", ring: "ring-orange-200" },
    };

    if (showForm) {
        return (
            <TransactionForm
                isOpen={showForm}
                onClose={handleFormClose}
                onSuccess={onSuccess}
            />
        );
    }

    const handleSmartInputClose = () => {
        setSmartInputMode(null);
        onClose();
    };

    if (smartInputMode) {
        return (
            <SmartInput
                mode={smartInputMode}
                onClose={handleSmartInputClose}
                onSuccess={handleSmartInputSuccess}
            />
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000]"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[10001] max-w-[500px] mx-auto"
                    >
                        <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden">
                            {/* Handle bar */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Tambah Transaksi</h2>
                                    <p className="text-xs text-slate-500">Pilih cara input</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Action Grid */}
                            <div className="px-6 pb-6 space-y-3">
                                {actions.map((action) => {
                                    const Icon = action.icon;
                                    const colors = colorClasses[action.color];
                                    return (
                                        <motion.button
                                            key={action.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleAction(action.id)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                                "border-slate-100 hover:border-slate-200 hover:shadow-md",
                                                "bg-white"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                                colors.bg
                                            )}>
                                                <Icon className={colors.text} size={24} strokeWidth={2} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="font-semibold text-slate-900">{action.label}</h3>
                                                <p className="text-xs text-slate-500">{action.description}</p>
                                            </div>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                "bg-slate-50 group-hover:bg-slate-100"
                                            )}>
                                                <Sparkles size={14} className="text-slate-400" />
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Recent Templates Hint */}
                            <div className="px-6 pb-8 pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-400 mb-3">Template cepat:</p>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                    {["☕ Kopi", "🍜 Makan", "🚕 Transport", "📱 Pulsa"].map((template) => (
                                        <button
                                            key={template}
                                            className="px-3 py-1.5 bg-slate-50 rounded-full text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors whitespace-nowrap"
                                        >
                                            {template}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
