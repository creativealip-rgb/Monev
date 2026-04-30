"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/frontend/components/UI";
import { predictCategory } from "@/lib/context-engine";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { apiFetch } from "@/frontend/lib/api-client";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { useSecurity } from "@/components/SecurityProvider";
import { encryptData } from "@/lib/encryption";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { CacheManager } from "@/lib/cache-manager";
import { createLogger } from "@/lib/logger";
import type { Category, QuickTemplate, TransactionType, LastAddedTransaction } from "../types";

const logger = createLogger("TransactionForm");

interface UseTransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface UseTransactionFormReturn {
    // State
    transactionType: TransactionType;
    amount: string;
    description: string;
    selectedCategory: number | null;
    categories: Category[];
    loading: boolean;
    showSplit: boolean;
    selectedAccountId: number | null;
    targetAccountId: number | null;
    lastAddedTransaction: LastAddedTransaction | null;
    error: string | null;
    quickTemplates: QuickTemplate[];
    showTemplateModal: boolean;
    mounted: boolean;
    accounts: ReturnType<typeof useAccountsData>["accounts"];
    accountsLoading: boolean;

    // Setters
    setTransactionType: (type: TransactionType) => void;
    setAmount: (amount: string) => void;
    setDescription: (description: string) => void;
    setSelectedCategory: (categoryId: number | null) => void;
    setSelectedAccountId: (accountId: number | null) => void;
    setTargetAccountId: (accountId: number | null) => void;
    setShowTemplateModal: (show: boolean) => void;
    setShowSplit: (show: boolean) => void;
    setLastAddedTransaction: (transaction: LastAddedTransaction | null) => void;

    // Handlers
    handleCategorySelect: (categoryId: number) => void;
    handleSubmit: () => Promise<void>;
    handleClose: () => void;
    handleDeleteTemplate: (id: string) => void;
    handleEditTemplate: (template: QuickTemplate) => void;
    handleUseQuickTemplate: (template: QuickTemplate) => Promise<void>;
    loadCategories: (type: TransactionType) => Promise<void>;
}

export function useTransactionForm({
    isOpen,
    onClose,
    onSuccess,
}: UseTransactionFormProps): UseTransactionFormReturn {
    const [transactionType, setTransactionType] = useState<TransactionType>("expense");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSplit, setShowSplit] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [targetAccountId, setTargetAccountId] = useState<number | null>(null);
    const [lastAddedTransaction, setLastAddedTransaction] = useState<LastAddedTransaction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { accounts, isLoading: accountsLoading } = useAccountsData();
    const { encryptionKey } = useSecurity();
    const { success: toastSuccess } = useToast();
    const haptics = useHaptics();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load categories when type changes
    const loadCategories = useCallback(async (type: TransactionType) => {
        try {
            const response = await apiFetch("/api/categories");
            const result = await response.json();
            if (result.success) {
                const filteredCats = result.data.filter((c: Category) => {
                    if (type === "transfer") return c.name === "Transfer";
                    return c.type === type;
                });
                setCategories(filteredCats);

                // Auto-select Transfer category if type is transfer
                if (type === "transfer") {
                    const transferCat = filteredCats.find((c: Category) => c.name === "Transfer");
                    if (transferCat) setSelectedCategory(transferCat.id);
                } else {
                    // Auto-suggest category based on context
                    const prediction = predictCategory({ time: new Date() });
                    const suggested = filteredCats.find((c: Category) => c.name === prediction.suggestedCategory);
                    if (suggested) {
                        setSelectedCategory(suggested.id);
                    } else {
                        setSelectedCategory(null);
                    }
                }
            }
        } catch (err) {
            logger.error("Error loading categories", err);
        }
    }, []);

    // Load quick templates from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("quickTransactionTemplates");
        if (stored) {
            try {
                const templates = JSON.parse(stored);
                setQuickTemplates(templates);
            } catch (e) {
                logger.error("Error loading quick templates", e);
            }
        }
    }, []);

    // Load categories on mount and when type changes
    useEffect(() => {
        if (isOpen) {
            loadCategories(transactionType);
        }
    }, [isOpen, transactionType, loadCategories]);

    // Listen for smart input data
    useEffect(() => {
        const handleSmartInput = (e: CustomEvent) => {
            const data = e.detail;
            if (data) {
                setAmount(data.amount?.toString() || "");
                setDescription(data.description || data.merchantName || "");
                // Try to auto-select category
                if (data.category) {
                    const cat = categories.find(c => c.name === data.category);
                    if (cat) {
                        setSelectedCategory(cat.id);
                    }
                }
            }
        };

        window.addEventListener("smartInputData", handleSmartInput as EventListener);
        return () => window.removeEventListener("smartInputData", handleSmartInput as EventListener);
    }, [categories]);

    const handleCategorySelect = useCallback((categoryId: number) => {
        setSelectedCategory(categoryId);
    }, []);

    const handleSubmit = useCallback(async () => {
        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            setError("Masukkan nominal yang valid");
            haptics.error();
            return;
        }

        if (!selectedCategory) {
            setError("Pilih kategori");
            haptics.error();
            return;
        }

        setLoading(true);
        haptics.tap();
        setError(null);
        let finalDescription = description;

        // Encrypt description if key is available
        if (encryptionKey) {
            try {
                const encrypted = await encryptData(description, encryptionKey);
                finalDescription = `enc:${encrypted}`; // Mark as encrypted
            } catch (e) {
                logger.error("Encryption failed", e);
            }
        }

        const transData = {
            amount: parsedAmount,
            description: finalDescription,
            categoryId: selectedCategory,
            type: transactionType,
            paymentMethod: "cash",
            accountId: selectedAccountId,
            targetAccountId: transactionType === "transfer" ? targetAccountId : null,
            date: new Date().toISOString(),
        };

        try {
            const response = await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transData),
            });

            if (!response.ok) {
                // Server error or offline — queue for later
                await OfflineManager.queueTransaction(transData);
                window.dispatchEvent(new CustomEvent("transactionAdded"));
                toastSuccess(
                    "Antrean Offline",
                    "Internet bermasalah, transaksi masuk antrean."
                );
                onSuccess?.();
                onClose();
                setAmount("");
                setDescription("");
                setSelectedCategory(null);
                setTransactionType("expense");
                return;
            }

            const result = await response.json();

            if (result.success) {
                // Dispatch event so all hooks (dashboard, transactions, accounts) refresh
                window.dispatchEvent(new CustomEvent("transactionAdded"));

                // Show success feedback with Time-Cost
                const settingsRes = await apiFetch("/api/profile");
                const profile = await settingsRes.json();
                const hourlyRate = profile.data?.user?.hourlyRate || 50000;
                const hours = parsedAmount / hourlyRate;

                toastSuccess(
                    "Transaksi Berhasil!",
                    `Setara dengan ${hours.toFixed(1)} jam kerja kamu.`
                );
                haptics.success();

                // Cache merchant prediction for future
                if (description) {
                    const matchedCat = categories.find(c => c.id === selectedCategory);
                    if (matchedCat) {
                        CacheManager.setCategory(description, matchedCat.name);
                    }
                }

                // Check if we should show split bill (e.g. amount > 50k and category is Food or Shopping)
                const selectedCatObj = categories.find(c => c.id === selectedCategory);
                if (selectedCatObj && (selectedCatObj.name === "Makan & Minuman" || selectedCatObj.name === "Belanja") && parsedAmount > 50000) {
                    // Get the actual transaction ID from result
                    const transactionData = result.data?.transaction || result.data;
                    setLastAddedTransaction({
                        id: transactionData?.id,
                        amount: parsedAmount,
                        description,
                    });
                    setShowSplit(true);
                } else {
                    onSuccess?.();
                    onClose();
                    // Reset form
                    setAmount("");
                    setDescription("");
                    setSelectedCategory(null);
                    setTransactionType("expense");
                }
            } else {
                setError(result.error || "Gagal menyimpan transaksi");
            }
        } catch (err) {
            logger.error("Error submitting transaction", err);
            // Handle network error via offline queue
            await OfflineManager.queueTransaction(transData);
            window.dispatchEvent(new CustomEvent("transactionAdded"));
            onSuccess?.();
            onClose();
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, amount, description, encryptionKey, transactionType, selectedAccountId, targetAccountId, categories, haptics, toastSuccess, onSuccess, onClose]);

    const handleClose = useCallback(() => {
        setAmount("");
        setDescription("");
        setSelectedCategory(null);
        setTransactionType("expense");
        setError(null);
        setShowTemplateModal(false);
        onClose();
    }, [onClose]);

    const handleDeleteTemplate = useCallback((id: string) => {
        const updated = quickTemplates.filter(t => t.id !== id);
        setQuickTemplates(updated);
        localStorage.setItem("quickTransactionTemplates", JSON.stringify(updated));
    }, [quickTemplates]);

    const handleEditTemplate = useCallback((template: QuickTemplate) => {
        setTransactionType(template.type);
        setAmount(template.amount.toString());
        setDescription(template.description || "");
        setSelectedCategory(template.categoryId);
        setShowTemplateModal(false);
    }, []);

    const handleUseQuickTemplate = useCallback(async (template: QuickTemplate) => {
        haptics.tap();
        const transData = {
            amount: template.amount,
            description: template.description || template.label,
            categoryId: template.categoryId,
            type: template.type,
            paymentMethod: "cash",
            accountId: selectedAccountId,
            date: new Date().toISOString(),
        };

        try {
            const response = await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transData),
            });

            const settingsRes = await apiFetch("/api/profile");
            const profile = await settingsRes.json();
            const hourlyRate = profile.data?.user?.hourlyRate || 50000;
            const hours = template.amount / hourlyRate;

            if (response.ok) {
                toastSuccess("Berhasil!", `Dicatat pakai template. Setara ${hours.toFixed(1)} jam kerja.`);
            } else {
                await OfflineManager.queueTransaction(transData);
                toastSuccess("Antrean Offline", "Internet bermasalah, transaksi masuk antrean.");
            }
            window.dispatchEvent(new CustomEvent("transactionAdded"));
            onSuccess?.();
            onClose();
        } catch {
            await OfflineManager.queueTransaction(transData);
            window.dispatchEvent(new CustomEvent("transactionAdded"));
            onSuccess?.();
            onClose();
        }
    }, [selectedAccountId, haptics, toastSuccess, onSuccess, onClose]);

    return {
        // State
        transactionType,
        amount,
        description,
        selectedCategory,
        categories,
        loading,
        showSplit,
        selectedAccountId,
        targetAccountId,
        lastAddedTransaction,
        error,
        quickTemplates,
        showTemplateModal,
        mounted,
        accounts,
        accountsLoading,

        // Setters
        setTransactionType,
        setAmount,
        setDescription,
        setSelectedCategory,
        setSelectedAccountId,
        setTargetAccountId,
        setShowTemplateModal,
        setShowSplit,
        setLastAddedTransaction,

        // Handlers
        handleCategorySelect,
        handleSubmit,
        handleClose,
        handleDeleteTemplate,
        handleEditTemplate,
        handleUseQuickTemplate,
        loadCategories,
    };
}
