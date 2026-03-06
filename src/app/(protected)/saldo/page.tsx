"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Wallet, CreditCard, Banknote, Landmark, Smartphone, MoreVertical, ChevronLeft, Check } from "lucide-react";
import { useState } from "react";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { formatCurrency } from "@/frontend/lib/utils";
import { useToast } from "@/frontend/components/UI";
import { apiFetch } from "@/frontend/lib/api-client";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useI18n } from "@/frontend/lib/i18n-context";
import { ACCOUNT_PRESETS, ACCOUNT_TYPES, QUICK_ADD_PRESETS, AccountPreset } from "@/frontend/data/account-presets";

const accountTypeIcons = {
    bank: Landmark,
    emoney: Smartphone,
    cash: Banknote,
    credit_card: CreditCard,
    investment_wallet: Wallet,
};

const iconMap: Record<string, React.ElementType> = {
    Landmark,
    Smartphone,
    Banknote,
    CreditCard,
    Wallet,
};

export default function SaldoPage() {
    const { accounts, isLoading, refresh } = useAccountsData();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<AccountPreset | null>(null);
    const [customName, setCustomName] = useState("");
    const [balance, setBalance] = useState<string>("0");
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSaving, setIsSaving] = useState(false);
    
    const haptics = useHaptics();
    const { success: toastSuccess, error: toastError } = useToast();
    const { t } = useI18n();

    const accountTypeLabels: Record<string, string> = {
        bank: t("saldo.type.bank"),
        emoney: t("saldo.type.emoney"),
        cash: t("saldo.type.cash"),
        credit_card: t("saldo.type.credit_card"),
        investment_wallet: t("saldo.type.investment"),
    };

    const netWorth = accounts.reduce((sum, acc) => {
        if (acc.type === 'credit_card') return sum - acc.balance;
        return sum + acc.balance;
    }, 0);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            haptics.tap();
            const data = {
                name: selectedPreset?.name || customName,
                type: selectedType,
                balance: parseFloat(balance) || 0,
                color: selectedPreset?.color || "#3b82f6",
                icon: selectedPreset?.icon || "Wallet",
            };

            const res = await apiFetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess(t("common.success"), t("saldo.addAccountSuccess"));
                resetForm();
                refresh();
            } else {
                toastError(t("common.failed"), json.error || "Error occurred");
            }
        } catch {
            toastError(t("common.failed"), "Network error");
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setSelectedType(null);
        setSelectedPreset(null);
        setCustomName("");
        setBalance("0");
        setStep(1);
        setIsAddOpen(false);
    };

    const openQuickAdd = (preset: AccountPreset) => {
        haptics.medium();
        const type = Object.keys(ACCOUNT_PRESETS).find(key =>
            ACCOUNT_PRESETS[key].some(p => p.name === preset.name)
        );
        setSelectedType(type || "bank");
        setSelectedPreset(preset);
        setStep(3);
        setIsAddOpen(true);
    };

    const getTypeLabel = (typeId: string) => {
        switch (typeId) {
            case "bank": return t("saldo.selectBank");
            case "emoney": return t("saldo.selectEmoney");
            case "cash": return t("saldo.selectCash");
            case "credit_card": return t("saldo.selectCreditCard");
            case "investment_wallet": return t("saldo.selectInvestment");
            default: return "";
        }
    };

    return (
        <div className="pb-32 font-sans">
            <header className="px-6 pt-12 pb-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t("saldo.title")}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t("saldo.subtitle")}</p>
                    </div>
                    <button
                        onClick={() => { haptics.medium(); setIsAddOpen(true); }}
                        className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 hover:scale-110 active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">{t("saldo.netWorth")}</p>
                    <h2 className="text-3xl font-black relative z-10">{formatCurrency(netWorth)}</h2>
                    <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 relative z-10">
                        <span>{accounts.length} {t("saldo.accountsCount")}</span>
                    </div>
                </motion.div>

                {/* Quick Add Section */}
                <div className="mt-6">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                        {t("saldo.quickAdd")}
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {QUICK_ADD_PRESETS.map((preset) => {
                            const Icon = iconMap[preset.icon] || Wallet;
                            return (
                                <motion.button
                                    key={preset.name}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openQuickAdd(preset)}
                                    className="flex-shrink-0 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:shadow-md transition-all flex items-center gap-2"
                                >
                                    <Icon size={18} style={{ color: preset.color }} />
                                    <span className="font-bold text-sm whitespace-nowrap dark:text-white">{preset.name}</span>
                                </motion.button>
                            );
                        })}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { haptics.medium(); setIsAddOpen(true); }}
                            className="flex-shrink-0 w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30"
                        >
                            <Plus size={20} />
                        </motion.button>
                    </div>
                </div>
            </header>

            <main className="px-6 mt-8">
                <div className="grid gap-4">
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-24 rounded-2xl bg-white dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
                        ))
                    ) : accounts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="text-slate-400" size={32} />
                            </div>
                            <h3 className="text-slate-900 dark:text-white font-bold">{t("saldo.noAccounts")}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{t("saldo.addSample")}</p>
                        </div>
                    ) : (
                        accounts.map((acc, idx) => {
                            const Icon = accountTypeIcons[acc.type as keyof typeof accountTypeIcons] || Wallet;
                            return (
                                <motion.div
                                    key={acc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow relative overflow-hidden group"
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                                        style={{ backgroundColor: acc.color }}
                                    >
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{acc.name}</h3>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">{accountTypeLabels[acc.type]}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-sm ${acc.type === 'credit_card' ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                            {formatCurrency(acc.balance)}
                                        </p>
                                    </div>
                                    <button className="text-slate-300 dark:text-slate-600 ml-2" onClick={() => haptics.tap()}>
                                        <MoreVertical size={16} />
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Add Account Modal */}
            <AnimatePresence>
                {isAddOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={resetForm}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-[500px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
                        >
                            {/* Step 1: Select Type */}
                            {step === 1 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">{t("saldo.selectType")}</h2>
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {ACCOUNT_TYPES.map((type) => {
                                            const Icon = iconMap[type.icon] || Wallet;
                                            return (
                                                <motion.button
                                                    key={type.id}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        haptics.tap();
                                                        setSelectedType(type.id);
                                                        setStep(2);
                                                    }}
                                                    className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all flex flex-col items-center gap-2"
                                                >
                                                    <Icon size={28} color={type.color} />
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{type.label}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="w-full py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                                        >
                                            {t("common.cancel")}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Select Provider */}
                            {step === 2 && selectedType && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <button
                                        onClick={() => {
                                            haptics.tap();
                                            setStep(1);
                                        }}
                                        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4 hover:text-slate-700 dark:hover:text-slate-200"
                                    >
                                        <ChevronLeft size={16} />
                                        {t("saldo.back")}
                                    </button>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">{getTypeLabel(selectedType)}</h2>
                                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto mb-4">
                                        {ACCOUNT_PRESETS[selectedType]?.map((preset) => {
                                            const Icon = iconMap[preset.icon] || Wallet;
                                            return (
                                                <motion.button
                                                    key={preset.name}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        haptics.tap();
                                                        setSelectedPreset(preset);
                                                        setStep(3);
                                                    }}
                                                    className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition-all flex flex-col items-center gap-2"
                                                >
                                                    <Icon size={20} color={preset.color} />
                                                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{preset.name}</span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => {
                                            haptics.tap();
                                            setSelectedPreset(null);
                                            setStep(3);
                                        }}
                                        className="w-full py-3 text-sky-500 font-bold border-2 border-dashed border-sky-500 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 transition-all mb-4"
                                    >
                                        + {t("saldo.customOption")}
                                    </button>
                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="w-full py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                                        >
                                            {t("common.cancel")}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Input Balance */}
                            {step === 3 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <button
                                        onClick={() => {
                                            haptics.tap();
                                            if (selectedPreset) {
                                                setStep(2);
                                            } else {
                                                setStep(1);
                                            }
                                        }}
                                        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6 hover:text-slate-700 dark:hover:text-slate-200"
                                    >
                                        <ChevronLeft size={16} />
                                        {t("saldo.back")}
                                    </button>
                                    
                                    <div className="text-center mb-6">
                                        {selectedPreset ? (
                                            <>
                                                <div className="flex items-center justify-center gap-2 mb-2">
                                                    {(() => {
                                                        const Icon = iconMap[selectedPreset.icon] || Wallet;
                                                        return <Icon size={24} color={selectedPreset.color} />;
                                                    })()}
                                                </div>
                                                <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedPreset.name}</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Custom Account</p>
                                                <input
                                                    type="text"
                                                    value={customName}
                                                    onChange={(e) => setCustomName(e.target.value)}
                                                    placeholder="Nama Akun (contoh: Bank Jabar)"
                                                    className="text-2xl font-black text-center text-slate-900 dark:text-white bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none py-2 w-full"
                                                    autoFocus
                                                />
                                            </>
                                        )}
                                        <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mt-4 mb-1">{t("saldo.initialBalance")}</p>
                                        <p className="text-4xl font-black text-sky-500">{formatCurrency(parseFloat(balance) || 0)}</p>
                                    </div>

                                    <div className="mb-6">
                                        <input
                                            type="number"
                                            value={balance}
                                            onChange={(e) => setBalance(e.target.value)}
                                            placeholder="0"
                                            className="w-full p-4 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                                            autoFocus={!!selectedPreset}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            disabled={isSaving}
                                            className="flex-1 py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
                                        >
                                            {t("common.cancel")}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={isSaving || (!selectedPreset && !customName.trim())}
                                            className="flex-1 py-4 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <Check size={20} />
                                                    {t("saldo.saveAccount")}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
