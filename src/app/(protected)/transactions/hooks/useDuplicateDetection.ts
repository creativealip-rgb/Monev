"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { TransactionWithCategory } from "@/types";
import { UseDuplicateDetectionReturn } from "../types";

const STORAGE_KEY = "monev_dismissed_duplicates";

function getDismissedIdsFromStorage(): Set<number> {
    if (typeof window === "undefined") return new Set();
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const ids = JSON.parse(saved);
            return new Set(ids);
        } catch {
            return new Set();
        }
    }
    return new Set();
}

export function useDuplicateDetection(
    transactions: TransactionWithCategory[]
): UseDuplicateDetectionReturn {
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
    const [dismissedDuplicateIds, setDismissedDuplicateIds] = useState<Set<number>>(() => getDismissedIdsFromStorage());

    useEffect(() => {
        const handleStorage = () => {
            setDismissedDuplicateIds(getDismissedIdsFromStorage());
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const duplicateIds = useMemo(() => {
        const ids = new Set<number>();
        const seen = new Map<string, number[]>();

        for (const t of transactions) {
            const dateKey = new Date(t.createdAt).toISOString().slice(0, 10);
            const key = `${t.amount}-${t.categoryId}-${dateKey}`;
            const group = seen.get(key);
            if (group) {
                group.push(t.id);
            } else {
                seen.set(key, [t.id]);
            }
        }

        for (const group of seen.values()) {
            if (group.length > 1) {
                group.forEach((id) => ids.add(id));
            }
        }

        return ids;
    }, [transactions]);

    const activeDuplicateIds = useMemo(() => {
        const active = new Set<number>();
        duplicateIds.forEach((id) => {
            if (!dismissedDuplicateIds.has(id)) {
                active.add(id);
            }
        });
        return active;
    }, [duplicateIds, dismissedDuplicateIds]);

    const duplicateCount = activeDuplicateIds.size;

    const dismissDuplicates = useCallback(() => {
        const newDismissed = new Set(dismissedDuplicateIds);
        duplicateIds.forEach((id) => newDismissed.add(id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newDismissed)));
        window.dispatchEvent(new Event("storage"));
        setShowDuplicatesOnly(false);
    }, [duplicateIds, dismissedDuplicateIds]);

    const isDuplicate = useCallback(
        (id: number) => activeDuplicateIds.has(id),
        [activeDuplicateIds]
    );

    return {
        showDuplicatesOnly,
        setShowDuplicatesOnly,
        duplicateCount,
        activeDuplicateIds,
        dismissDuplicates,
        isDuplicate,
    };
}
