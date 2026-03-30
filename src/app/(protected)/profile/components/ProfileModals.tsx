"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AccountModal } from "./AccountModal";
import { IntegrationsModal } from "./IntegrationsModal";
import { SecurityModal } from "./SecurityModal";
import { NotificationsModal } from "./NotificationsModal";
import { CollectionModal } from "./CollectionModal";
import { CategoriesModal } from "./CategoriesModal";
import { ExportModal } from "./ExportModal";
import { FinancialModal } from "./FinancialModal";

type ModalType = "account" | "integrations" | "security" | "notifications" | "collection" | "categories" | "export" | "financial";

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
    const getModalTitle = () => {
        switch (activeModal) {
            case "account": return "Edit Profil";
            case "integrations": return "Integrasi Bot";
            case "security": return "Keamanan Aplikasi";
            case "export": return "Export Data";
            case "financial": return "Konfigurasi Keuangan";
            case "notifications": return "Notifikasi";
            case "collection": return "Koleksi Badge";
            case "categories": return "Kategori Custom";
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
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {activeModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-safe"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl max-h-[85vh] min-h-[400px] flex flex-col border border-slate-200 dark:border-slate-800 relative overflow-hidden mb-safe sm:mb-0"
                    >
                        <div className="flex justify-between items-center p-6 pb-4 shrink-0 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {getModalTitle()}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 pb-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {renderModalContent()}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
