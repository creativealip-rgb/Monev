"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TransactionWithCategory } from "@/types";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { UseUndoDeleteReturn } from "../types";

interface UseUndoDeleteProps {
    refresh: () => Promise<void>;
}

export function useUndoDelete({ refresh }: UseUndoDeleteProps): UseUndoDeleteReturn {
    const [undoBanner, setUndoBanner] = useState(false);
    const [undoCountdown, setUndoCountdown] = useState(5);
    const [isRestoring, setIsRestoring] = useState(false);
    const undoTransactionRef = useRef<TransactionWithCategory | null>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const toast = useToast();

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

    const showUndo = useCallback((transaction: TransactionWithCategory) => {
        clearUndoTimers();
        undoTransactionRef.current = transaction;
        setUndoCountdown(5);
        setUndoBanner(true);

        undoIntervalRef.current = setInterval(() => {
            setUndoCountdown((prev) => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);

        undoTimerRef.current = setTimeout(() => {
            dismissUndo();
        }, 5000);
    }, [clearUndoTimers, dismissUndo]);

    const handleUndo = useCallback(async () => {
        const txn = undoTransactionRef.current;
        if (!txn) return;

        clearUndoTimers();
        setIsRestoring(true);

        try {
            // Check if bulk delete (id === -1)
            const bulkData = (txn as unknown as { bulkData?: TransactionWithCategory[] }).bulkData;
            if (txn.id === -1 && bulkData) {
                // Restore multiple transactions
                const restorePromises = bulkData.map((transaction) =>
                    apiFetch("/api/transactions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: transaction.amount,
                            description: transaction.description,
                            merchantName: transaction.merchantName,
                            categoryId: transaction.categoryId,
                            type: transaction.type,
                            paymentMethod: transaction.paymentMethod || "cash",
                            accountId: transaction.accountId,
                            date: transaction.createdAt,
                        }),
                    })
                );

                await Promise.all(restorePromises);
                toast.success(`${bulkData.length} transaksi dipulihkan`);
            } else {
                // Restore single transaction
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
                    toast.success("Transaksi dipulihkan");
                } else {
                    toast.error("Gagal memulihkan", "Coba lagi nanti");
                }
            }

            await refresh();
        } catch (error) {
            console.error("Error restoring transaction(s):", error);
            toast.error("Gagal memulihkan", "Terjadi kesalahan");
        } finally {
            setIsRestoring(false);
            setUndoBanner(false);
            undoTransactionRef.current = null;
        }
    }, [clearUndoTimers, toast, refresh]);

    // Cleanup on unmount
    useEffect(() => {
        return () => clearUndoTimers();
    }, [clearUndoTimers]);

    return {
        undoBanner,
        undoCountdown,
        isRestoring,
        showUndo,
        handleUndo,
        dismissUndo,
        undoTransaction: undoTransactionRef.current,
    };
}
