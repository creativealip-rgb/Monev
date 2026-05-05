"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
    Filter,
    Search,
    ArrowLeft,
    Square,
    CheckSquare,
    Upload,
    MoreHorizontal,
} from "lucide-react";
import Link from "next/link";

import { EditTransactionForm } from "@/frontend/components/EditTransactionForm";
import { TransactionDetailModal } from "@/frontend/components/modals/TransactionDetailModal";
import { ConfirmDialog } from "@/frontend/components/ConfirmDialog";
import {
    TransactionListSkeleton,
    NoTransactionsEmpty,
    NoSearchResultsEmpty,
} from "@/frontend/components/UI";
import { cn } from "@/frontend/lib/utils";
import { useTransactionsData } from "@/frontend/hooks/useTransactionsData";
import { useAccountsData } from "@/frontend/hooks/useAccountsData";
import { useDebouncedValue } from "@/frontend/hooks/useDebouncedValue";
import { useI18n } from "@/lib/i18n";
import { TransactionWithCategory } from "@/types";
import type { FilterType } from "./types";

import {
    DuplicateBanner,
    UndoBanner,
    ActiveFilters,
    ExportMenu,
    ImportCSVModal,
    TransactionList,
    TransactionFilterModal,
    TransactionSortMenu,
    BulkActionsBar,
} from "./components";

import {
    useTransactionFilters,
    useTransactionActions,
    useUndoDelete,
    useDuplicateDetection,
    useExport,
    useGroupedTransactions,
} from "./hooks";

export default function TransactionsPage() {
    const { t, locale } = useI18n();
    const { accounts } = useAccountsData();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSearchQuery = searchParams.get("search") || "";
    const initialCategoryId = searchParams.get("categoryId");
    const initialAccountId = searchParams.get("accountId");
    const initialType = searchParams.get("type");
    const initialFilterType: FilterType = initialType === "expense" || initialType === "income" ? initialType : "all";
    const initialStartDate = searchParams.get("startDate");
    const initialEndDate = searchParams.get("endDate");
    const initialFilters = {
        category: initialCategoryId ? Number(initialCategoryId) : "all" as const,
        account: initialAccountId ? Number(initialAccountId) : "all" as const,
        type: initialFilterType,
        dateRange: initialStartDate && initialEndDate ? { start: initialStartDate, end: initialEndDate } : null,
    };

    // Search
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

    // Modal states
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [showMoreActions, setShowMoreActions] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
    const [detailTransaction, setDetailTransaction] = useState<TransactionWithCategory | null>(null);

    // Sort menu state
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Infinite scroll
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
        rootMargin: "100px",
    });

    // Data fetching
    const {
        transactions,
        categories,
        loading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refresh,
    } = useTransactionsData(debouncedSearchQuery);

    // Custom hooks
    const {
        filterCategory,
        setFilterCategory,
        filterAccount,
        setFilterAccount,
        filterType,
        setFilterType,
        dateRange,
        setDateRange,
        amountRange,
        setAmountRange,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        filteredTransactions,
        activeFiltersCount,
        resetFilters,
    } = useTransactionFilters({ transactions, initialFilters });

    const {
        undoBanner,
        undoCountdown,
        isRestoring,
        showUndo,
        handleUndo,
        dismissUndo,
        undoTransaction,
    } = useUndoDelete({ refresh });

    const {
        selectedIds,
        showBulkActions,
        setShowBulkActions,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        deletingId,
        executeDelete,
        executeBulkDelete,
        bulkExport,
        showBulkDeleteConfirm,
        setShowBulkDeleteConfirm,
        confirmDeleteId,
        setConfirmDeleteId,
    } = useTransactionActions({
        filteredTransactions,
        refresh,
        onUndo: showUndo,
    });

    const {
        showDuplicatesOnly,
        setShowDuplicatesOnly,
        duplicateCount,
        activeDuplicateIds,
        dismissDuplicates,
    } = useDuplicateDetection(transactions);

    const {
        showExportMenu,
        setShowExportMenu,
        exportMenuRef,
        handleExportCSV,
        handleExportPDF,
    } = useExport();

    // Display transactions (with duplicate filter applied)
    const displayTransactions = showDuplicatesOnly
        ? filteredTransactions.filter((t) => activeDuplicateIds.has(t.id))
        : filteredTransactions;

    const groupedTransactions = useGroupedTransactions({
        transactions: displayTransactions,
        locale,
    });

    // Effects
    useEffect(() => {
        if (inView && !loading && hasNextPage && !isFetchingNextPage && !showDuplicatesOnly) {
            fetchNextPage();
        }
    }, [inView, loading, hasNextPage, isFetchingNextPage, fetchNextPage, showDuplicatesOnly]);

    useEffect(() => {
        const params = new URLSearchParams();

        if (debouncedSearchQuery) {
            params.set("search", debouncedSearchQuery);
        }

        if (filterCategory !== "all") {
            params.set("categoryId", String(filterCategory));
        }

        if (filterAccount !== "all") {
            params.set("accountId", String(filterAccount));
        }

        if (filterType !== "all") {
            params.set("type", filterType);
        }

        if (dateRange) {
            params.set("startDate", dateRange.start);
            params.set("endDate", dateRange.end);
        }

        const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(nextUrl, { scroll: false });
    }, [dateRange, debouncedSearchQuery, filterAccount, filterCategory, filterType, pathname, router]);

    // Clear selection when toggling duplicate view
    useEffect(() => {
        if (!showDuplicatesOnly) {
            clearSelection();
        }
    }, [showDuplicatesOnly, clearSelection]);

    // Handlers
    const handleEditSuccess = useCallback(() => {
        refresh();
        setIsEditModalOpen(false);
        setEditingTransaction(null);
    }, [refresh]);

    const handleTransactionClick = useCallback((transaction: TransactionWithCategory) => {
        setDetailTransaction(transaction);
    }, []);

    const handleDetailEdit = useCallback((transaction: TransactionWithCategory) => {
        setDetailTransaction(null);
        setEditingTransaction(transaction);
        setIsEditModalOpen(true);
    }, []);

    const handleDetailDelete = useCallback((id: number) => {
        setConfirmDeleteId(id);
        setDetailTransaction(null);
    }, [setConfirmDeleteId, setDetailTransaction]);

    const onToggleDuplicates = useCallback(() => {
        setShowDuplicatesOnly(!showDuplicatesOnly);
    }, [showDuplicatesOnly, setShowDuplicatesOnly]);

    const onExportCSV = useCallback(() => {
        handleExportCSV(searchQuery, filterCategory);
    }, [handleExportCSV, searchQuery, filterCategory]);

    const onExportPDF = useCallback(() => {
        handleExportPDF(filteredTransactions, locale);
    }, [handleExportPDF, filteredTransactions, locale]);

    const onToggleSelectAll = useCallback(() => {
        toggleSelectAll(displayTransactions.map((t) => t.id));
    }, [toggleSelectAll, displayTransactions]);

    return (
        <div className="min-h-screen pb-32 bg-sky-50 dark:bg-slate-950">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-[100] w-full pt-safe bg-sky-50/95 dark:bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-sky-100/50 dark:border-slate-800/50"
            >
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                                {t("transactions.title")}
                            </h1>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                                {searchQuery ? t("transactions.searchResults") : t("transactions.allTransactions")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2">
                            <TransactionSortMenu
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                sortOrder={sortOrder}
                                setSortOrder={setSortOrder}
                                showSortMenu={showSortMenu}
                                setShowSortMenu={setShowSortMenu}
                            />
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setShowBulkActions(!showBulkActions);
                                    if (showBulkActions) clearSelection();
                                }}
                                aria-pressed={showBulkActions}
                                aria-label={showBulkActions ? "Selesai pilih banyak transaksi" : t("transactions.bulkSelectTitle")}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    showBulkActions
                                        ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                )}
                                title={t("transactions.bulkSelectTitle")}
                            >
                                {showBulkActions ? <CheckSquare size={20} /> : <Square size={20} />}
                            </motion.button>
                            <ExportMenu
                                show={showExportMenu}
                                onToggle={() => setShowExportMenu(!showExportMenu)}
                                menuRef={exportMenuRef}
                                onExportCSV={onExportCSV}
                                onExportPDF={onExportPDF}
                            />
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsImportModalOpen(true)}
                                aria-label="Import CSV"
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
                                title="Import CSV"
                            >
                                <Upload size={20} />
                            </motion.button>
                        </div>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsFilterModalOpen(true)}
                            aria-label="Filter transaksi"
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                activeFiltersCount > 0
                                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/25"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400"
                            )}
                        >
                            <Filter size={20} />
                        </motion.button>

                        <div className="relative sm:hidden">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowMoreActions((value) => !value)}
                                aria-expanded={showMoreActions}
                                aria-haspopup="menu"
                                aria-label="Aksi transaksi lainnya"
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                title="Aksi lainnya"
                            >
                                <MoreHorizontal size={20} />
                            </motion.button>
                            {showMoreActions && (
                                <div
                                    role="menu"
                                    aria-label="Aksi transaksi lainnya"
                                    className="absolute right-0 top-12 z-[120] w-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-2 shadow-xl backdrop-blur-md"
                                >
                                    <button
                                        type="button"
                                        onClick={() => setShowSortMenu((value) => !value)}
                                        role="menuitem"
                                        aria-expanded={showSortMenu}
                                        aria-haspopup="menu"
                                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Urutkan
                                    </button>
                                    {showSortMenu && (
                                        <div
                                            role="menu"
                                            aria-label="Pilihan urutan transaksi"
                                            className="mb-1 rounded-xl bg-slate-50 p-1 dark:bg-slate-800/70"
                                        >
                                            {[
                                                { id: "date", label: "Tanggal" },
                                                { id: "amount", label: "Jumlah" },
                                                { id: "category", label: "Kategori" },
                                            ].map((option) => (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    role="menuitemradio"
                                                    aria-checked={sortBy === option.id}
                                                    onClick={() => {
                                                        if (sortBy === option.id) {
                                                            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                                                        } else {
                                                            setSortBy(option.id as typeof sortBy);
                                                            setSortOrder("desc");
                                                        }
                                                        setShowSortMenu(false);
                                                        setShowMoreActions(false);
                                                    }}
                                                    className={cn(
                                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors",
                                                        sortBy === option.id
                                                            ? "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                                                            : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                                                    )}
                                                >
                                                    {option.label}
                                                    {sortBy === option.id && (
                                                        <span aria-hidden="true">{sortOrder === "desc" ? "↓" : "↑"}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowBulkActions(!showBulkActions);
                                            if (showBulkActions) clearSelection();
                                            setShowMoreActions(false);
                                        }}
                                        role="menuitemcheckbox"
                                        aria-checked={showBulkActions}
                                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        {showBulkActions ? "Selesai pilih" : "Pilih banyak"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                        role="menuitem"
                                        aria-expanded={showExportMenu}
                                        aria-haspopup="menu"
                                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Export
                                    </button>
                                    {showExportMenu && (
                                        <div
                                            role="menu"
                                            aria-label="Pilihan export transaksi"
                                            className="mb-1 rounded-xl bg-slate-50 p-1 dark:bg-slate-800/70"
                                        >
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                    onExportCSV();
                                                    setShowExportMenu(false);
                                                    setShowMoreActions(false);
                                                }}
                                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                                            >
                                                Export CSV
                                            </button>
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                    onExportPDF();
                                                    setShowExportMenu(false);
                                                    setShowMoreActions(false);
                                                }}
                                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                                            >
                                                Export PDF
                                            </button>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsImportModalOpen(true);
                                            setShowMoreActions(false);
                                        }}
                                        role="menuitem"
                                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        Import CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.header>

            <div className="px-6">
                {/* Search */}
                <div className="relative mb-4 mt-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="search"
                        aria-label="Cari transaksi"
                        placeholder={t("transactions.search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-modern pl-11 pr-4 py-3.5 w-full shadow-sm"
                    />
                </div>

                {/* Active Filters Display */}
                <ActiveFilters
                    accountName={filterAccount === "all" ? null : accounts.find((account) => account.id === filterAccount)?.name || null}
                    dateRange={dateRange}
                    amountRange={amountRange}
                    onClearAccount={() => setFilterAccount("all")}
                    onClearDateRange={() => setDateRange(null)}
                    onClearAmountRange={() => setAmountRange(null)}
                    onClearAll={resetFilters}
                />

                {/* Duplicate Detection Banner */}
                <DuplicateBanner
                    duplicateCount={duplicateCount}
                    showDuplicatesOnly={showDuplicatesOnly}
                    onToggleDuplicates={onToggleDuplicates}
                    onDismiss={dismissDuplicates}
                    loading={loading}
                />

                {/* Count Header */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between mb-4"
                >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {showDuplicatesOnly
                            ? t("transactions.duplicateTransactions")
                            : searchQuery
                                ? t("transactions.searchResults")
                                : t("transactions.allTransactions")}
                    </p>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        {loading ? "..." : `${displayTransactions.length} ${t("transactions.count")}`}
                    </span>
                </motion.div>

                {/* Transaction List */}
                {loading ? (
                    <TransactionListSkeleton count={5} />
                ) : displayTransactions.length === 0 ? (
                    searchQuery ? (
                        <NoSearchResultsEmpty query={searchQuery} />
                    ) : (
                        <NoTransactionsEmpty
                            noAccounts={accounts.length === 0}
                            onAddNew={() => window.dispatchEvent(new Event("monev:open-add-transaction"))}
                        />
                    )
                ) : (
                    <TransactionList
                        groupedTransactions={groupedTransactions}
                        showBulkActions={showBulkActions}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onTransactionClick={handleTransactionClick}
                        onTransactionEdit={handleDetailEdit}
                        onTransactionDelete={handleDetailDelete}
                        showDuplicatesOnly={showDuplicatesOnly}
                        activeDuplicateIds={activeDuplicateIds}
                        isFetchingNextPage={isFetchingNextPage}
                        hasNextPage={hasNextPage}
                        loadMoreRef={loadMoreRef}
                    />
                )}
            </div>

            {/* Bulk Action Bar */}
            {showBulkActions && selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedIds={selectedIds}
                    filteredTransactionsLength={displayTransactions.length}
                    toggleSelectAll={onToggleSelectAll}
                    bulkExport={bulkExport}
                    bulkDelete={() => setShowBulkDeleteConfirm(true)}
                    deletingId={deletingId}
                />
            )}

            {/* Filter Modal */}
            <TransactionFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filterAccount={filterAccount}
                setFilterAccount={setFilterAccount}
                accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
                filterType={filterType}
                setFilterType={setFilterType}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                categories={categories}
                dateRange={dateRange}
                setDateRange={setDateRange}
                amountRange={amountRange}
                setAmountRange={setAmountRange}
            />

            {/* Detail Modal */}
            <TransactionDetailModal
                isOpen={!!detailTransaction}
                onClose={() => setDetailTransaction(null)}
                transaction={detailTransaction}
                accounts={accounts}
                onEdit={handleDetailEdit}
                onDelete={handleDetailDelete}
            />

            {/* Edit Transaction Modal */}
            <EditTransactionForm
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingTransaction(null);
                }}
                onSuccess={handleEditSuccess}
                transaction={editingTransaction}
            />

            {/* CSV Import Modal */}
            <ImportCSVModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    refresh();
                    setIsImportModalOpen(false);
                }}
            />

            {/* Delete Confirmation Dialogs */}
            <ConfirmDialog
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && executeDelete(confirmDeleteId, transactions)}
                title={t("transactions.deleteTitle")}
                description={t("transactions.deleteConfirm")}
                loading={!!deletingId}
            />

            <ConfirmDialog
                isOpen={showBulkDeleteConfirm}
                onClose={() => setShowBulkDeleteConfirm(false)}
                onConfirm={executeBulkDelete}
                title={t("transactions.deleteMultipleTitle")}
                description={t("transactions.deleteMultipleConfirm").replace("{count}", String(selectedIds.size))}
                confirmText={t("transactions.deleteAll")}
                loading={deletingId === -1}
            />

            {/* Undo Delete Banner */}
            <UndoBanner
                show={undoBanner}
                countdown={undoCountdown}
                isRestoring={isRestoring}
                transaction={undoTransaction}
                onUndo={handleUndo}
                onDismiss={dismissUndo}
            />
        </div>
    );
}
