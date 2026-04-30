"use client";

import React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, Wallet, CreditCard, Banknote, Landmark, Smartphone, MoreVertical, ChevronLeft, Check, List, LayoutGrid, ChevronDown, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { formatCurrency, cn } from "@/frontend/lib/utils";
import { useToast } from "@/frontend/components/UI";
import { apiFetch } from "@/frontend/lib/api-client";
import { useHaptics } from "@/frontend/hooks/useHaptics";
import { useI18n } from "@/lib/i18n";
import { useSecurity } from "@/components/SecurityProvider";
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

const GROUP_ORDER = ["bank", "emoney", "cash", "credit_card", "investment_wallet"];

export default function SaldoPage() {
    const { accounts, isLoading, refresh } = useAccountsData();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedPreset, setSelectedPreset] = useState<AccountPreset | null>(null);
    const [customName, setCustomName] = useState("");
    const [balance, setBalance] = useState<string>("0");
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "group">("list");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [showAccountMenu, setShowAccountMenu] = useState<number | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", balance: "", color: "", icon: "" });
    const [isDeleting, setIsDeleting] = useState(false);

    const haptics = useHaptics();
    const { success: toastSuccess, error: toastError } = useToast();
    const { t } = useI18n();
    const { isStealthMode } = useSecurity();

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

    const toggleGroup = (typeId: string) => {
        haptics.tap();
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(typeId)) {
                next.delete(typeId);
            } else {
                next.add(typeId);
            }
            return next;
        });
    };

    const groupedAccounts = React.useMemo(() => {
        const groups: Record<string, typeof accounts> = {};
        for (const acc of accounts) {
            const type = acc.type || "bank";
            if (!groups[type]) groups[type] = [];
            groups[type].push(acc);
        }
        return groups;
    }, [accounts]);

    const sortedGroupKeys = React.useMemo(() => {
        const keys = Object.keys(groupedAccounts);
        return keys.sort((a, b) => {
            const idxA = GROUP_ORDER.indexOf(a);
            const idxB = GROUP_ORDER.indexOf(b);
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
    }, [groupedAccounts]);

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
        <div className="pb-56 font-sans">
            <header className="px-4 sm:px-6 pt-4 sm:pt-6 pb-6 sm:pb-8">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t("saldo.title")}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{t("saldo.subtitle")}</p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { haptics.medium(); setIsAddOpen(true); }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 p-[2px] shadow-lg shadow-sky-500/20"
                    >
                        <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            <Plus size={20} className="text-slate-700 dark:text-sky-400" />
                        </div>
                    </motion.button>
                </div>

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden glass-card"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">{t("saldo.netWorth")}</p>
                    <h2 className="text-3xl font-black relative z-10">{isStealthMode ? "••••••••" : formatCurrency(netWorth)}</h2>
                    <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 relative z-10">
                        <span>{accounts.length} {t("saldo.accountsCount")}</span>
                    </div>
                </motion.div>

                {/* Quick Add Section */}
                <div className="mt-6">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                        {t("saldo.quickAdd")}
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {QUICK_ADD_PRESETS.map((preset) => {
                            const Icon = iconMap[preset.icon] || Wallet;
                            return (
                                <motion.button
                                    key={preset.name}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openQuickAdd(preset)}
                                    className="flex-shrink-0 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 transition-all flex items-center gap-2 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md"
                                >
                                    <Icon size={18} style={{ color: preset.color }} />
                                    <span className="font-bold text-sm whitespace-nowrap dark:text-white">{preset.name}</span>
                                </motion.button>
                            );
                        })}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { haptics.medium(); setIsAddOpen(true); }}
                            className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20"
                        >
                            <Plus size={20} />
                        </motion.button>
                    </div>
                </div>

                {/* View Toggle */}
                {accounts.length > 0 && (
                    <div className="mt-6 flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                haptics.tap();
                                setViewMode("list");
                            }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                viewMode === "list"
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                            )}
                        >
                            <List size={16} />
                            {t("saldo.listView")}
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                haptics.tap();
                                setViewMode("group");
                            }}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                viewMode === "group"
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                            )}
                        >
                            <LayoutGrid size={16} />
                            {t("saldo.groupView")}
                        </motion.button>
                    </div>
                )}
            </header>

            <main className="px-6 mt-8">
                {isAddOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        {/* Progress Bar */}
                        <div className="px-6 pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    {t("saldo.step")} {step} {t("saldo.of")} 3
                                </span>
                                <button
                                    onClick={resetForm}
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
                                >
                                    <X size={14} />
                                    {t("common.cancel")}
                                </button>
                            </div>
                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-600 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(step / 3) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        {/* Step 1: Select Type */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6"
                            >
                                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">{t("saldo.selectType")}</h2>
                                <div className="grid grid-cols-3 gap-4 mb-6">
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
                                                className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:shadow-md transition-all flex flex-col items-center gap-2"
                                            >
                                                <Icon size={28} color={type.color} />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{type.label}</span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Select Provider */}
                        {step === 2 && selectedType && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6"
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
                                <div className="grid grid-cols-3 gap-4 max-h-64 overflow-y-auto mb-6">
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
                                                className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-sky-500 hover:shadow-md transition-all flex flex-col items-center gap-2"
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
                                    className="w-full py-3 text-sky-500 font-bold border-2 border-dashed border-sky-500 rounded-2xl hover:bg-sky-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    + {t("saldo.customOption")}
                                </button>
                            </motion.div>
                        )}

                        {/* Step 3: Input Balance */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6"
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
                                                className="w-full p-4 text-2xl font-black text-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                                            />
                                        </>
                                    )}
                                    <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mt-4 mb-1">{t("saldo.initialBalance")}</p>
                                    <p className="text-4xl font-black text-sky-500">{isStealthMode ? "••••••••" : formatCurrency(parseFloat(balance) || 0)}</p>
                                </div>

                                <div className="mb-6">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={balance === "0" ? "" : balance}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                            // Remove leading zeros
                                            const cleanValue = rawValue.replace(/^0+/, '') || '0';
                                            setBalance(cleanValue);
                                        }}
                                        placeholder="0"
                                        className="w-full p-4 text-center text-2xl font-bold bg-white dark:bg-slate-800 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        disabled={isSaving}
                                        className="flex-1 py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 shadow-sm disabled:opacity-50"
                                    >
                                        {t("common.cancel")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSaving || (!selectedPreset && !customName.trim())}
                                        className="flex-1 py-4 bg-gradient-to-br from-sky-500 to-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                ) : (
                    <LayoutGroup>
                        <div className="grid gap-4">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-24 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 animate-pulse" />
                                ))
                            ) : accounts.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-4">
                                        <Wallet className="text-sky-500" size={30} />
                                    </div>
                                    <h3 className="text-slate-900 dark:text-white font-bold">{t("saldo.noAccounts")}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t("saldo.addSample")}</p>
                                    <button
                                        type="button"
                                        onClick={() => { haptics.medium(); setIsAddOpen(true); }}
                                        className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/25 active:scale-95"
                                    >
                                        <Plus size={18} />
                                        Tambah Akun
                                    </button>
                                </motion.div>
                            ) : viewMode === "list" ? (
                                accounts.map((acc, idx) => {
                                    const Icon = accountTypeIcons[acc.type as keyof typeof accountTypeIcons] || Wallet;
                                    return (
                                        <motion.div
                                            key={acc.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow group"
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
                                                <p className={cn(
                                                    "font-black text-sm",
                                                    acc.type === 'credit_card' ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                                                )}>
                                                    {isStealthMode ? "••••••••" : formatCurrency(acc.balance)}
                                                </p>
                                            </div>
                                            <div className="relative">
                                                <button 
                                                    className="text-slate-300 dark:text-slate-600 hover:text-slate-500" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        haptics.tap();
                                                        setShowAccountMenu(showAccountMenu === acc.id ? null : acc.id);
                                                        setSelectedAccountId(acc.id);
                                                    }}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                <AnimatePresence>
                                                    {showAccountMenu === acc.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            className="absolute right-0 top-8 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditForm({ name: acc.name, balance: acc.balance.toString(), color: acc.color, icon: acc.icon || "" });
                                                                    setIsEditOpen(true);
                                                                    setShowAccountMenu(null);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                                            >
                                                                <Pencil size={14} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm("Yakin hapus akun ini? Transaksi terkait tidak akan dihapus.")) {
                                                                        setIsDeleting(true);
                                                                        try {
                                                                            const res = await apiFetch(`/api/accounts/${acc.id}`, { method: "DELETE" });
                                                                            const result = await res.json();
                                                                            if (result.success) {
                                                                                toastSuccess("Akun dihapus");
                                                                                refresh();
                                                                            } else {
                                                                                toastError("Gagal menghapus");
                                                                            }
                                                                        } catch (err) {
                                                                            toastError("Gagal menghapus");
                                                                        } finally {
                                                                            setIsDeleting(false);
                                                                        }
                                                                    }
                                                                    setShowAccountMenu(null);
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} /> Hapus
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                /* Group View */
                                sortedGroupKeys.map((typeId, groupIdx) => {
                                    const groupAccounts = groupedAccounts[typeId];
                                    const GroupIcon = accountTypeIcons[typeId as keyof typeof accountTypeIcons] || Wallet;
                                    const isExpanded = expandedGroups.has(typeId);
                                    const groupTotal = groupAccounts.reduce((sum, acc) => {
                                        if (acc.type === 'credit_card') return sum - acc.balance;
                                        return sum + acc.balance;
                                    }, 0);
                                    const typeConfig = ACCOUNT_TYPES.find(at => at.id === typeId);

                                    return (
                                        <motion.div
                                            key={typeId}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: groupIdx * 0.08 }}
                                            className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                                        >
                                            {/* Group Header */}
                                            <motion.button
                                                onClick={() => toggleGroup(typeId)}
                                                className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                                                    style={{ backgroundColor: typeConfig?.color || "#3b82f6" }}
                                                >
                                                    <GroupIcon size={20} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                                        {accountTypeLabels[typeId] || typeId}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">
                                                        {groupAccounts.length} {t("saldo.accountsCount")}
                                                    </p>
                                                </div>
                                                <div className="text-right mr-2">
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                                        {t("saldo.groupTotal")}
                                                    </p>
                                                    <p className={cn(
                                                        "font-black text-sm",
                                                        typeId === 'credit_card' ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                                                    )}>
                                                        {isStealthMode ? "••••••••" : formatCurrency(Math.abs(groupTotal))}
                                                    </p>
                                                </div>
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <ChevronDown size={18} className="text-slate-400 dark:text-slate-500" />
                                                </motion.div>
                                            </motion.button>

                                            {/* Group Content */}
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{
                                                            height: { duration: 0.3, ease: "easeInOut" },
                                                            opacity: { duration: 0.2 },
                                                        }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 pb-3 grid gap-2">
                                                            {groupAccounts.map((acc, idx) => {
                                                                const Icon = accountTypeIcons[acc.type as keyof typeof accountTypeIcons] || Wallet;
                                                                return (
                                                                    <motion.div
                                                                        key={acc.id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ delay: idx * 0.04 }}
                                                                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                    >
                                                                        <div
                                                                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                                                                            style={{ backgroundColor: acc.color }}
                                                                        >
                                                                            <Icon size={18} />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{acc.name}</h4>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className={cn(
                                                                                "font-black text-sm",
                                                                                acc.type === 'credit_card' ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                                                                            )}>
                                                                                {isStealthMode ? "••••••••" : formatCurrency(acc.balance)}
                                                                            </p>
                                                                        </div>
                                                                        <div className="relative">
                                                                            <button 
                                                                                className="text-slate-300 dark:text-slate-600 hover:text-slate-500" 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    haptics.tap();
                                                                                    setShowAccountMenu(showAccountMenu === acc.id ? null : acc.id);
                                                                                    setSelectedAccountId(acc.id);
                                                                                }}
                                                                            >
                                                                                <MoreVertical size={14} />
                                                                            </button>
                                                                            <AnimatePresence>
                                                                                {showAccountMenu === acc.id && (
                                                                                    <motion.div
                                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                                        className="absolute right-0 top-6 w-28 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
                                                                                    >
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setEditForm({ name: acc.name, balance: acc.balance.toString(), color: acc.color, icon: acc.icon || "" });
                                                                                                setIsEditOpen(true);
                                                                                                setShowAccountMenu(null);
                                                                                            }}
                                                                                            className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                                                                                        >
                                                                                            <Pencil size={12} /> Edit
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={async (e) => {
                                                                                                e.stopPropagation();
                                                                                                if (confirm("Yakin hapus akun ini?")) {
                                                                                                    setIsDeleting(true);
                                                                                                    try {
                                                                                                        const res = await apiFetch(`/api/accounts/${acc.id}`, { method: "DELETE" });
                                                                                                        const result = await res.json();
                                                                                                        if (result.success) {
                                                                                                            toastSuccess("Akun dihapus");
                                                                                                            refresh();
                                                                                                        } else {
                                                                                                            toastError("Gagal menghapus");
                                                                                                        }
                                                                                                    } catch (err) {
                                                                                                        toastError("Gagal menghapus");
                                                                                                    } finally {
                                                                                                        setIsDeleting(false);
                                                                                                    }
                                                                                                }
                                                                                                setShowAccountMenu(null);
                                                                                            }}
                                                                                            className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                                                                        >
                                                                                            <Trash2 size={12} /> Hapus
                                                                                        </button>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </LayoutGroup>
                )}
            </main>

            {/* Edit Account Modal */}
            <AnimatePresence>
                {isEditOpen && (
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
                            onClick={() => setIsEditOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-[500px] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl card-clean p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Edit Akun</h2>
                                <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Nama Akun</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full p-4 text-lg font-bold bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">Saldo</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={editForm.balance}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                            const cleanValue = rawValue.replace(/^0+/, '') || '0';
                                            setEditForm({ ...editForm, balance: cleanValue });
                                        }}
                                        className="w-full p-4 text-center text-2xl font-bold bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 focus:border-sky-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="flex-1 py-4 rounded-2xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 shadow-sm"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!selectedAccountId) return;
                                        setIsSaving(true);
                                        try {
                                            const res = await apiFetch(`/api/accounts/${selectedAccountId}`, {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    name: editForm.name,
                                                    balance: parseFloat(editForm.balance) || 0,
                                                }),
                                            });
                                            const result = await res.json();
                                            if (result.success) {
                                                toastSuccess("Akun diperbarui");
                                                refresh();
                                                setIsEditOpen(false);
                                            } else {
                                                toastError("Gagal memperbarui");
                                            }
                                        } catch (err) {
                                            toastError("Gagal memperbarui");
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-gradient-to-br from-sky-500 to-cyan-600 text-white rounded-2xl font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Check size={20} />
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
