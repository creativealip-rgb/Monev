"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { TransactionWithCategory } from "@/types";

export function useTransactionDelete(
    refresh: () => Promise<void>
) {
    const toast = useToast();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Undo state
    const [undoBanner, setUndoBanner] = useState(false);
    const [undoCountdown, setUndoCountdown] = useState(5);
    const undoTransactionRef = useRef<TransactionWithCategory | null>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const clearUndoTimers = useCallback(() => {
        if (undoTimerRef.current) {
            clearTimeout(undoTimerRef.current);
            undoTimerRef.current = null;
        }
        if (undoIntervalRef.current) {
            clearInterval(undoIntervalRef.current);
            undoIntervalRef.current = null;
        }
    }, []);

    const dismissUndo = useCallback(() => {
        clearUndoTimers();
        setUndoBanner(false);
        undoTransactionRef.current = null;
    }, [clearUndoTimers]);

    const handleUndo = useCallback(async () => {
        const txn = undoTransactionRef.current;
        if (!txn) return;

        clearUndoTimers();
        setIsRestoring(true);

        try {
            const response = await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: txn.amount,
                    description: txn.description,
                    merchantName: txn.merchantName,
                    categoryId: txn.categoryId,
                    type: txn.type,
                    paymentMethod: txn.paymentMethod || "cash",
                    accountId: txn.accountId,
                    date: txn.createdAt,
                }),
            });

            if (response.ok) {
                toast.success("Transaksi dikembalikan");
                refresh();
            } else {
                toast.error("Gagal mengembalikan", "Coba lagi nanti");
            }
        } catch (error) {
            console.error("Error restoring transaction:", error);
            toast.error("Gagal mengembalikan", "Terjadi kesalahan");
        } finally {
            setIsRestoring(false);
            setUndoBanner(false);
            undoTransactionRef.current = null;
        }
    }, [clearUndoTimers, toast, refresh]);

    const handleDelete = useCallback((id: number) => {
        setConfirmDeleteId(id);
    }, []);

    const executeDelete = useCallback(async (id: number, transactions: TransactionWithCategory[]) => {
        setDeletingId(id);

        const deletedTxn = transactions.find(t => t.id === id) || null;

        try {
            const response = await apiFetch(`/api/transactions/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                refresh();

                if (deletedTxn) {
                    clearUndoTimers();
                    undoTransactionRef.current = deletedTxn;
                    setUndoCountdown(5);
                    setUndoBanner(true);

                    undoIntervalRef.current = setInterval(() => {
                        setUndoCountdown(prev => {
                            if (prev <= 1) return 0;
                            return prev - 1;
                        });
                    }, 1000);

                    undoTimerRef.current = setTimeout(() => {
                        dismissUndo();
                    }, 5000);
                } else {
                    toast.success("Transaksi dihapus");
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
    }, [refresh, toast, clearUndoTimers, dismissUndo]);

    useEffect(() => {
        return () => clearUndoTimers();
    }, [clearUndoTimers]);

    return {
        deletingId,
        confirmDeleteId,
        setConfirmDeleteId,
        undoBanner,
        undoCountdown,
        isRestoring,
        handleDelete,
        executeDelete,
        handleUndo,
        dismissUndo
    };
}
