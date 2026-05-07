"use client";

import { useState, useCallback, useRef } from "react";
import { TransactionWithCategory } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { UseTransactionActionsReturn } from "../types";

interface UseTransactionActionsProps {
    filteredTransactions: TransactionWithCategory[];
    refresh: () => Promise<void>;
    onUndo: (transaction: TransactionWithCategory) => void;
}

export function useTransactionActions({
    filteredTransactions,
    refresh,
    onUndo,
}: UseTransactionActionsProps): UseTransactionActionsReturn {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const toast = useToast();

    const deletedTransactionsRef = useRef<TransactionWithCategory[]>([]);

    const toggleSelect = useCallback((id: number) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const toggleSelectAll = useCallback(
        (allIds: number[]) => {
            if (selectedIds.size === allIds.length) {
                setSelectedIds(new Set());
            } else {
                setSelectedIds(new Set(allIds));
            }
        },
        [selectedIds.size]
    );

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback(
        (id: number) => selectedIds.has(id),
        [selectedIds]
    );

    const selectedCount = selectedIds.size;

    const executeDelete = useCallback(
        async (id: number, allTransactions: TransactionWithCategory[]) => {
            if (deletingId !== null) return;
            setDeletingId(id);

            const deletedTxn = allTransactions.find((t) => t.id === id) || null;

            try {
                const response = await apiFetch(`/api/transactions/${id}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    await refresh();
                    window.dispatchEvent(new CustomEvent("transactionDeleted"));
                    toast.success("Transaksi dihapus");

                    if (deletedTxn) {
                        onUndo(deletedTxn);
                    }
                } else {
                    toast.error("Gagal menghapus", "Coba lagi nanti");
                }
            } catch (error) {
                console.error("Error deleting:", error);
                toast.error("Gagal menghapus", "Terjadi kesalahan");
            } finally {
                setDeletingId(null);
                setConfirmDeleteId(null);
            }
        },
        [deletingId, refresh, onUndo, toast]
    );

    const executeBulkDelete = useCallback(async () => {
        if (deletingId !== null || selectedIds.size === 0) return;
        setDeletingId(-1);
        try {
            const ids = Array.from(selectedIds);
            const deletedTxns = filteredTransactions.filter((t) =>
                ids.includes(t.id)
            );
            deletedTransactionsRef.current = deletedTxns;

            const responses = await Promise.all(
                ids.map((id) =>
                    apiFetch(`/api/transactions/${id}`, { method: "DELETE" })
                )
            );
            if (responses.some((response) => !response.ok)) {
                throw new Error("Some transactions failed to delete");
            }
            await refresh();
            window.dispatchEvent(new CustomEvent("transactionDeleted"));

            // Create a bulk undo transaction
            const bulkUndoTransaction = {
                id: -1,
                amount: 0,
                description: `${ids.length} transaksi`,
                categoryId: 0,
                categoryName: "",
                categoryColor: "",
                categoryIcon: "",
                type: "expense" as const,
                createdAt: new Date(),
                date: new Date(),
                isVerified: false,
                userId: 0,
                merchantName: null,
                paymentMethod: "cash",
                destinationType: null,
                destinationId: null,
                accountId: null,
                splitGroupId: null,
                isRecurring: false,
                bulkData: deletedTxns,
            } as unknown as TransactionWithCategory;

            onUndo(bulkUndoTransaction);
            toast.success(`${ids.length} transaksi dihapus`);
            setSelectedIds(new Set());
            setShowBulkActions(false);
        } catch (error) {
            console.error("Bulk delete error:", error);
            toast.error("Gagal menghapus", "Terjadi kesalahan");
        } finally {
            setDeletingId(null);
        }
    }, [
        selectedIds,
        filteredTransactions,
        refresh,
        onUndo,
        toast,
        deletingId,
    ]);

    const bulkExport = useCallback(() => {
        const ids = Array.from(selectedIds);
        const params = new URLSearchParams();
        ids.forEach((id) => params.append("ids", id.toString()));

        const a = document.createElement("a");
        a.href = `/api/transactions/export/csv?${params.toString()}`;
        a.download = "monev_transaksi_selected.csv";
        a.click();
        toast.success(`${ids.length} transaksi diexport`);
    }, [selectedIds, toast]);

    return {
        selectedIds,
        showBulkActions,
        setShowBulkActions,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        isSelected,
        selectedCount,
        deletingId,
        executeDelete,
        executeBulkDelete,
        bulkExport,
        showBulkDeleteConfirm,
        setShowBulkDeleteConfirm,
        confirmDeleteId,
        setConfirmDeleteId,
    };
}
