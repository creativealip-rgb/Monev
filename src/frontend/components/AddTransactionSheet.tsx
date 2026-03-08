"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Camera, Mic, Bell, Sparkles, Lock } from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { useEffect, useState } from "react";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { TransactionForm } from "./TransactionForm";
import { SmartInput } from "./SmartInput";
import { useSession } from "next-auth/react";
import { UserTier, canAccessSmartInput } from "@/lib/tier-gate";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useToast } from "./UI";
import { apiFetch } from "@/frontend/lib/api-client";

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
    const [y, setY] = useState(0);
    const { data: session } = useSession();
    // @ts-ignore
    const userTier = (session?.user?.tier as UserTier) || "miskin";
    const hasSmartAccess = canAccessSmartInput(userTier);
    const haptics = useHaptics();
    const { success: toastSuccess } = useToast();

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
                        style={{ opacity: y > 0 ? 1 - (y / 500) : 1 }}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: y }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 500 }}
                        dragElastic={0.1}
                        onDragEnd={(_, info) => {
                            const velocity = info.velocity.y;
                            const offset = info.offset.y;

                            if (offset > 200 || velocity > 500) {
                                onClose();
                            } else if (offset > 100) {
                                setY(200); // Snap to half/lower point
                            } else {
                                setY(0); // Snap to top
                            }
                        }}
                        onUpdate={(latest: any) => {
                            if (typeof latest.y === "number") {
                                setY(latest.y);
                            }
                        }}
                        className="fixed bottom-0 left-0 right-0 z-[10001] max-w-[500px] mx-auto cursor-grab active:cursor-grabbing"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-center pt-3 pb-2 touch-none">
                                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            </div>

                            <div className="flex items-center justify-between px-6 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Transaksi</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Pilih cara input</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label="Tutup form tambah transaksi"
                                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="px-6 pb-6 space-y-3">
                                {actions.map((action) => {
                                    const Icon = action.icon;
                                    const colors = colorClasses[action.color];
                                    const isSmartInput = action.id !== "manual";
                                    const isLocked = isSmartInput && !hasSmartAccess;
                                    return (
                                        <motion.button
                                            key={action.id}
                                            whileHover={{ scale: isLocked ? 1 : 1.02 }}
                                            whileTap={{ scale: isLocked ? 1 : 0.98 }}
                                            onClick={() => isLocked ? window.location.href = '/fitur/upgrade' : handleAction(action.id)}
                                            aria-label={`${action.label}${isLocked ? ' (Upgrade required)' : ''}`}
                                            aria-disabled={isLocked}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                                isLocked
                                                    ? "border-slate-100 dark:border-slate-700 opacity-60"
                                                    : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md",
                                                "bg-white dark:bg-slate-800"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                                colors.bg
                                            )}>
                                                <Icon className={colors.text} size={24} strokeWidth={2} />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className="font-semibold text-slate-900 dark:text-white">{action.label}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
                                            </div>
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                "bg-slate-50 dark:bg-slate-700"
                                            )}>
                                                {isLocked ? (
                                                    <Lock size={14} className="text-amber-500" />
                                                ) : (
                                                    <Sparkles size={14} className="text-slate-400 dark:text-slate-500" />
                                                )}
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="px-6 pb-8 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Template Cepat</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: "☕ Kopi (20rb)", amount: 20000, category: "Makan & Minuman", desc: "Beli kopi" },
                                        { label: "🍱 Makan (35rb)", amount: 35000, category: "Makan & Minuman", desc: "Makan siang" },
                                        { label: "🚗 Bensin (50rb)", amount: 50000, category: "Transportasi", desc: "Isi bensin" },
                                        { label: "📱 Pulsa (100rb)", amount: 100000, category: "Tagihan", desc: "Top up pulsa" },
                                    ].map((template) => (
                                        <button
                                            key={template.label}
                                            onClick={async () => {
                                                // Resolve category name to ID first
                                                let categoryId: number | undefined;
                                                try {
                                                    const catRes = await apiFetch("/api/categories");
                                                    const catData = await catRes.json();
                                                    if (catData.success) {
                                                        const matched = catData.data.find((c: { name: string }) => c.name === template.category);
                                                        categoryId = matched?.id;
                                                    }
                                                } catch {
                                                    // Fall through without categoryId
                                                }

                                                const transData = {
                                                    amount: template.amount,
                                                    description: template.desc,
                                                    categoryId,
                                                    type: "expense",
                                                    paymentMethod: "cash",
                                                    date: new Date().toISOString(),
                                                };
                                                try {
                                                    haptics.tap();
                                                    const response = await apiFetch("/api/transactions", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify(transData),
                                                    });

                                                    // Show Time-Cost
                                                    const settingsRes = await apiFetch("/api/profile");
                                                    const profile = await settingsRes.json();
                                                    const hourlyRate = profile.data?.user?.hourlyRate || 50000;
                                                    const hours = template.amount / hourlyRate;

                                                    if (response.ok) {
                                                        toastSuccess(
                                                            "Berhasil!",
                                                            `Dicatat pakai template. Setara ${hours.toFixed(1)} jam kerja.`
                                                        );
                                                        window.dispatchEvent(new CustomEvent("transactionAdded"));
                                                        onClose();
                                                    } else {
                                                        // Fail-over to offline queue
                                                        OfflineManager.queueTransaction(transData);
                                                        toastSuccess(
                                                            "Antrean Offline",
                                                            "Internet bermasalah, transaksi masuk antrean."
                                                        );
                                                        window.dispatchEvent(new CustomEvent("transactionAdded"));
                                                        onClose();
                                                    }
                                                } catch (err) {
                                                    // Network error, queue it
                                                    OfflineManager.queueTransaction(transData);
                                                    window.dispatchEvent(new CustomEvent("transactionAdded"));
                                                    onClose();
                                                }
                                            }}
                                            aria-label={`Tambah transaksi ${template.label}`}
                                            className="flex flex-col items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-sky-50 dark:hover:bg-sky-900/30 border border-transparent hover:border-sky-200 dark:hover:border-sky-800 transition-all group"
                                        >
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400">{template.label}</span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-500">{template.category}</span>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleAction("manual")}
                                    aria-label="Buat template custom baru"
                                    className="w-full mt-4 py-3 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                                >
                                    + Buat Template Custom
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
