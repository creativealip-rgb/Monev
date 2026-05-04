"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { Portal } from "@/frontend/components/Portal";
import { AccountModal } from "./AccountModal";
import { IntegrationsModal } from "./IntegrationsModal";
import { SecurityModal } from "./SecurityModal";
import { NotificationsModal } from "./NotificationsModal";
import { CollectionModal } from "./CollectionModal";
import { CategoriesModal } from "./CategoriesModal";
import { ExportModal } from "./ExportModal";
import { FinancialModal } from "./FinancialModal";
import { ReportsModal } from "./ReportsModal";
import { AppSettingsModal } from "./AppSettingsModal";
import { AboutModal } from "./AboutModal";

type ModalType = "account" | "integrations" | "security" | "notifications" | "collection" | "categories" | "export" | "financial" | "reports" | "app_settings" | "about";

interface ProfileModalsProps {
    activeModal: ModalType | null;
    onClose: () => void;
    user: any;
    formData: any;
    setFormData: (data: any) => void;
    goals: any[];
    achievements: any[];
    categories: any[];
    loadData: () => void;
    onSaveProfile: () => void;
    onSaveSettings: () => void;
    onSaveSecurity: () => void;
}

export function ProfileModals({
    activeModal,
    onClose,
    user,
    formData,
    setFormData,
    goals,
    achievements,
    categories,
    loadData,
    onSaveProfile,
    onSaveSettings,
    onSaveSecurity
}: ProfileModalsProps) {
    useEffect(() => {
        if (!activeModal) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.body.classList.add("monev-profile-modal-open");
        window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: true }));

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.body.classList.remove("monev-profile-modal-open");
            document.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keydown", handleKeyDown, true);
            window.dispatchEvent(new CustomEvent("monev:suppress-bottom-nav", { detail: false }));
        };
    }, [activeModal, onClose]);

    const getModalTitle = () => {
        switch (activeModal) {
            case "account": return "Edit Profil";
            case "integrations": return "Integrasi Bot";
            case "security": return "Keamanan Aplikasi";
            case "export": return "Export Data";
            case "financial": return "Konfigurasi Keuangan";
            case "reports": return "Laporan Keuangan";
            case "notifications": return "Notifikasi";
            case "collection": return "Koleksi Badge";
            case "categories": return "Kategori Custom";
            case "app_settings": return "Pengaturan Aplikasi";
            case "about": return "Tentang Monev";
            default: return "";
        }
    };

    const renderModalContent = () => {
        switch (activeModal) {
            case "account":
                return (
                    <AccountModal
                        user={user}
                        formData={formData}
                        setFormData={setFormData}
                        onClose={onClose}
                        onSave={onSaveProfile}
                    />
                );
            case "integrations":
                return (
                    <IntegrationsModal
                        user={user}
                        formData={formData}
                        setFormData={setFormData}
                        onClose={onClose}
                        onSave={onSaveProfile}
                        loadData={loadData}
                    />
                );
            case "security":
                return (
                    <SecurityModal
                        formData={formData}
                        setFormData={setFormData}
                        onClose={onClose}
                        onSave={onSaveSecurity}
                    />
                );
            case "notifications":
                return (
                    <NotificationsModal 
                        onClose={onClose}
                        loadData={loadData}
                    />
                );
            case "collection":
                return (
                    <CollectionModal
                        achievements={achievements}
                        onClose={onClose}
                    />
                );
            case "categories":
                return (
                    <CategoriesModal
                        categories={categories}
                        loadData={loadData}
                    />
                );
            case "export":
                return (
                    <ExportModal onClose={onClose} />
                );
            case "financial":
                return (
                    <FinancialModal
                        formData={formData}
                        setFormData={setFormData}
                        goals={goals}
                        onClose={onClose}
                        onSave={onSaveSettings}
                    />
                );
            case "reports":
                return (
                    <ReportsModal onClose={onClose} />
                );
            case "app_settings":
                return (
                    <AppSettingsModal />
                );
            case "about":
                return (
                    <AboutModal />
                );
            default:
                return null;
        }
    };

    return (
        <Portal>
            <style jsx global>{`
                body.monev-profile-modal-open iframe,
                body.monev-profile-modal-open [id*="telegram" i],
                body.monev-profile-modal-open [class*="telegram" i],
                body.monev-profile-modal-open [id*="support" i],
                body.monev-profile-modal-open [class*="support" i],
                body.monev-profile-modal-open [id*="chat-widget" i],
                body.monev-profile-modal-open [class*="chat-widget" i] {
                    pointer-events: none !important;
                    visibility: hidden !important;
                }
            `}</style>
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[2147483647] flex items-end justify-center p-3 pt-[calc(1rem+env(safe-area-inset-top))] sm:items-center sm:p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 80, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 80, scale: 0.98 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 relative overflow-hidden pb-safe"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="profile-modal-title"
                        >
                            <div className="flex justify-between items-center p-5 sm:p-6 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
                                <h3 id="profile-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                                    {getModalTitle()}
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Tutup modal profil"
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/40 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 px-5 sm:px-6 pt-5 pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                {renderModalContent()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
