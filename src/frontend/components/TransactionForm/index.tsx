"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Edit2, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { SplitBillFlow } from "@/frontend/components/SplitBillFlow";
import { useToast } from "@/frontend/components/UI";
import { useTransactionForm } from "./hooks/useTransactionForm";
import { TypeSection } from "./sections/TypeSection";
import { AmountSection } from "./sections/AmountSection";
import { CategorySection } from "./sections/CategorySection";
import { AccountSection } from "./sections/AccountSection";
import type { TransactionFormProps, QuickTemplate } from "./types";

export function TransactionForm({ isOpen, onClose, onSuccess, initialType }: TransactionFormProps) {
    const { success: toastSuccess } = useToast();
    const router = useRouter();

    const {
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
        setTransactionType,
        setAmount,
        setDescription,
        setSelectedAccountId,
        setTargetAccountId,
        setShowTemplateModal,
        setShowSplit,
        handleCategorySelect,
        handleSubmit,
        handleClose,
        handleDeleteTemplate,
        handleEditTemplate,
        handleUseQuickTemplate,
    } = useTransactionForm({ isOpen, onClose, onSuccess, initialType });

    const handleAddAccount = () => {
        handleClose();
        router.push("/saldo");
    };

    const handleSaveAsTemplate = () => {
        if (!selectedCategory || !amount) return;
        const selectedCat = categories.find(c => c.id === selectedCategory);
        if (!selectedCat) return;

        const newTemplate: QuickTemplate = {
            id: Date.now().toString(),
            label: description || selectedCat.name,
            amount: parseFloat(amount),
            categoryId: selectedCategory,
            categoryName: selectedCat.name,
            description: description || undefined,
            type: transactionType as "expense" | "income",
        };

        const updated = [...quickTemplates, newTemplate];
        localStorage.setItem("quickTransactionTemplates", JSON.stringify(updated));
        toastSuccess("Template Disimpan", "Template cepat berhasil ditambahkan");
    };

    const handleSplitBillClose = () => {
        setShowSplit(false);
        onSuccess?.();
        onClose();
    };

    const handleSplitBillSuccess = () => {
        setShowSplit(false);
        onSuccess?.();
        onClose();
    };

    const handleTypeChange = (type: typeof transactionType) => {
        if (type === "transfer" && accounts.length < 2) return;
        setTransactionType(type);
    };

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading) {
                if (showTemplateModal) {
                    setShowTemplateModal(false);
                    return;
                }
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [handleClose, isOpen, loading, setShowTemplateModal, showTemplateModal]);

    if (!isOpen) return null;

    const parsedAmount = Number(amount);
    const isAmountInvalid = !amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0;
    const transferUnavailable = transactionType === "transfer" && accounts.length < 2;
    const transferTargetInvalid = transactionType === "transfer" && (!targetAccountId || targetAccountId === selectedAccountId);
    const isSubmitDisabled = loading ||
        isAmountInvalid ||
        accounts.length === 0 ||
        (transactionType !== "transfer" && categories.length > 0 && !selectedCategory) ||
        transferUnavailable ||
        transferTargetInvalid;

    const submitHelperText = accounts.length === 0
        ? "Tambahkan akun saldo terlebih dahulu untuk menyimpan transaksi."
        : transferUnavailable
            ? "Minimal butuh 2 akun saldo untuk transfer."
            : transferTargetInvalid
                ? "Pilih akun tujuan yang berbeda."
                : isAmountInvalid
                    ? "Masukkan nominal transaksi yang valid."
                    : transactionType !== "transfer" && categories.length > 0 && !selectedCategory
                        ? "Pilih kategori transaksi."
                        : null;

    const getSubmitButtonClasses = () => {
        if (isSubmitDisabled) {
            return "bg-slate-300 dark:bg-slate-700 cursor-not-allowed";
        }
        if (transactionType === "expense") {
            return "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20";
        }
        if (transactionType === "income") {
            return "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20";
        }
        return "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20";
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="transaction-form-title"
                className="fixed inset-0 z-[10001] overflow-x-hidden overflow-y-auto"
            >
                <div className="fixed inset-0 -z-10 bg-gradient-to-br from-sky-50 via-sky-100/50 to-cyan-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-200/30 via-transparent to-transparent dark:from-sky-900/20" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-200/30 via-transparent to-transparent dark:from-cyan-900/20" />
                </div>

                <div className="min-h-screen max-w-[500px] mx-auto bg-sky-50/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-sky-900/10 dark:shadow-slate-950/30 pb-24">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-12 pb-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
                        <button
                            onClick={handleClose}
                            aria-label="Tutup transaksi baru"
                            disabled={loading}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
                        >
                            <X size={20} />
                        </button>
                        <h2 id="transaction-form-title" className="text-lg font-bold text-slate-900 dark:text-white">
                            Transaksi Baru
                        </h2>
                        <div className="w-10" />
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Split Bill Flow */}
                        <AnimatePresence>
                            {showSplit && lastAddedTransaction && (
                                <SplitBillFlow
                                    isOpen={showSplit}
                                    onClose={handleSplitBillClose}
                                    transaction={lastAddedTransaction}
                                    onSuccess={handleSplitBillSuccess}
                                />
                            )}
                        </AnimatePresence>

                        {/* Error Display */}
                        {error && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Type Section */}
                        <section className="space-y-6">
                            <div className="space-y-2">
                                <TypeSection
                                    transactionType={transactionType}
                                    onTypeChange={handleTypeChange}
                                    transferDisabled={accounts.length < 2}
                                />
                                {accounts.length === 1 && (
                                    <p className="px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                        Transfer aktif setelah kamu punya minimal 2 akun saldo.
                                    </p>
                                )}
                            </div>

                            {/* Amount Section with Quick Templates */}
                            <AmountSection
                                amount={amount}
                                description={description}
                                quickTemplates={quickTemplates}
                                onAmountChange={setAmount}
                                onDescriptionChange={setDescription}
                                onManageTemplates={() => setShowTemplateModal(true)}
                                onUseTemplate={handleUseQuickTemplate}
                            />
                        </section>

                        {/* Account Section */}
                        <AccountSection
                            accounts={accounts}
                            accountsLoading={accountsLoading}
                            selectedAccountId={selectedAccountId}
                            targetAccountId={targetAccountId}
                            transactionType={transactionType}
                            onSelectAccount={setSelectedAccountId}
                            onSelectTargetAccount={setTargetAccountId}
                            onAddAccount={handleAddAccount}
                            showTarget={transactionType === "transfer"}
                        />

                        {/* Category Section (hidden for transfer) */}
                        {transactionType !== "transfer" && (
                            <CategorySection
                                categories={categories}
                                selectedCategory={selectedCategory}
                                transactionType={transactionType}
                                onCategorySelect={handleCategorySelect}
                            />
                        )}

                        {/* Submit Button */}
                        <div className="pt-4 pb-8 mt-auto">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitDisabled}
                                aria-describedby={submitHelperText ? "transaction-submit-helper" : undefined}
                                className={cn(
                                    "w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all",
                                    getSubmitButtonClasses()
                                )}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Menyimpan...</span>
                                    </div>
                                ) : "Simpan Transaksi"}
                            </button>
                            {isSubmitDisabled && submitHelperText && (
                                <p id="transaction-submit-helper" className="mt-2 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {submitHelperText}
                                </p>
                            )}

                            {/* Save as Template Button */}
                            {!showTemplateModal && (
                                <button
                                    onClick={handleSaveAsTemplate}
                                    disabled={!selectedCategory || !amount || loading}
                                    className="w-full mt-3 py-3 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} />
                                    Simpan Sebagai Template Cepat
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Template Management Modal */}
                    {mounted && showTemplateModal && createPortal(
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[10003] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => !loading && setShowTemplateModal(false)}
                            >
                                <motion.div
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="quick-template-title"
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full max-w-[400px] mx-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
                                >
                                    <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-white dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                                        <h3 id="quick-template-title" className="text-lg font-bold text-slate-900 dark:text-white">Kelola Template Cepat</h3>
                                        <button
                                            onClick={() => setShowTemplateModal(false)}
                                            aria-label="Tutup kelola template cepat"
                                            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        {quickTemplates.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-slate-500 dark:text-slate-400 text-sm">Belum ada template cepat</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Isi form transaksi, lalu klik &quot;Simpan Sebagai Template&quot;</p>
                                            </div>
                                        ) : (
                                            quickTemplates.map((template) => (
                                                <div
                                                    key={template.id}
                                                    className="flex min-w-0 items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-bold text-slate-900 dark:text-white text-sm">{template.label}</p>
                                                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{formatCurrency(template.amount)} • {template.categoryName}</p>
                                                    </div>
                                                    <div className="flex shrink-0 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditTemplate(template)}
                                                            aria-label={`Edit template ${template.label}`}
                                                            className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTemplate(template.id)}
                                                            aria-label={`Hapus template ${template.label}`}
                                                            className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>,
                        document.body
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
