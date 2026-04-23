import { TransactionWithCategory } from "@/types";

export interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

export type FilterType = "all" | "expense" | "income";
export type SortBy = "date" | "amount" | "category";
export type SortOrder = "asc" | "desc";

export interface DateRange {
    start: string;
    end: string;
}

export interface AmountRange {
    min: number;
    max: number;
}

export interface GroupedTransactions {
    [date: string]: TransactionWithCategory[];
}

export interface UndoTransactionData {
    id: number;
    bulkData?: TransactionWithCategory[];
}

export interface UseTransactionsReturn {
    transactions: TransactionWithCategory[];
    categories: Category[];
    loading: boolean;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    refresh: () => Promise<void>;
}

export interface UseTransactionFiltersReturn {
    filterCategory: number | "all";
    setFilterCategory: (category: number | "all") => void;
    filterAccount: number | "all";
    setFilterAccount: (account: number | "all") => void;
    filterType: FilterType;
    setFilterType: (type: FilterType) => void;
    dateRange: DateRange | null;
    setDateRange: (
        range: DateRange | null | ((prev: DateRange | null) => DateRange | null)
    ) => void;
    amountRange: AmountRange | null;
    setAmountRange: (
        range: AmountRange | null | ((prev: AmountRange | null) => AmountRange | null)
    ) => void;
    sortBy: SortBy;
    setSortBy: (sortBy: SortBy) => void;
    sortOrder: SortOrder;
    setSortOrder: (sortOrder: SortOrder) => void;
    filteredTransactions: TransactionWithCategory[];
    activeFiltersCount: number;
    resetFilters: () => void;
}

export interface UseTransactionActionsReturn {
    selectedIds: Set<number>;
    showBulkActions: boolean;
    setShowBulkActions: (show: boolean) => void;
    toggleSelect: (id: number) => void;
    toggleSelectAll: (allIds: number[]) => void;
    clearSelection: () => void;
    isSelected: (id: number) => boolean;
    selectedCount: number;
    deletingId: number | null;
    executeDelete: (id: number, transactions: TransactionWithCategory[]) => Promise<void>;
    executeBulkDelete: () => Promise<void>;
    bulkExport: () => void;
    showBulkDeleteConfirm: boolean;
    setShowBulkDeleteConfirm: (show: boolean) => void;
    confirmDeleteId: number | null;
    setConfirmDeleteId: (id: number | null) => void;
}

export interface UseUndoDeleteReturn {
    undoBanner: boolean;
    undoCountdown: number;
    isRestoring: boolean;
    showUndo: (transaction: TransactionWithCategory) => void;
    handleUndo: () => Promise<void>;
    dismissUndo: () => void;
    undoTransaction: TransactionWithCategory | null;
}

export interface UseDuplicateDetectionReturn {
    showDuplicatesOnly: boolean;
    setShowDuplicatesOnly: (show: boolean) => void;
    duplicateCount: number;
    activeDuplicateIds: Set<number>;
    dismissDuplicates: () => void;
    isDuplicate: (id: number) => boolean;
}

export interface UseExportReturn {
    showExportMenu: boolean;
    setShowExportMenu: (show: boolean) => void;
    exportMenuRef: React.RefObject<HTMLDivElement | null>;
    handleExportCSV: (searchQuery: string, filterCategory: number | "all") => void;
    handleExportPDF: (transactions: TransactionWithCategory[], locale: string) => void;
}
