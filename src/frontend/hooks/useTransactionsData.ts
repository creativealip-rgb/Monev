/**
 * Custom hook for transactions data fetching and management using Tanstack Query
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/frontend/lib/api-client";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { TransactionWithCategory } from "@/types";

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

export function useTransactionsData(searchQuery: string = "") {
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);
    const [offlineTrans, setOfflineTrans] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
        const loadOffline = async () => {
            const trans = await OfflineManager.getOptimisticTransactions();
            setOfflineTrans(trans);
        };
        loadOffline();

        const handleTransactionAdded = () => {
            loadOffline();
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        };

        window.addEventListener("transactionAdded", handleTransactionAdded);
        return () => window.removeEventListener("transactionAdded", handleTransactionAdded);
    }, [queryClient]);

    // Categories Query
    const { data: categories = [] } = useQuery({
        queryKey: ["dashboard", "categories"], // Share cache with dashboard
        queryFn: async () => {
            const res = await apiFetch("/api/categories");
            const json = await res.json();
            if (json.success) {
                OfflineManager.setCache("dashboard_categories", json.data);
                return json.data as Category[];
            }
            return [];
        }
    });

    // Infinite Transactions Query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch
    } = useInfiniteQuery({
        queryKey: ["transactions", "list", searchQuery],
        initialPageParam: 0,
        queryFn: async ({ pageParam = 0 }) => {
            const limit = 20;
            const res = await apiFetch(`/api/transactions?limit=${limit}&offset=${pageParam}&search=${searchQuery}`);
            const json = await res.json();
            if (json.success) {
                if (pageParam === 0 && !searchQuery) {
                    OfflineManager.setCache("transactions_list", json.data);
                }
                return {
                    data: json.data,
                    pagination: json.pagination
                };
            }
            return { data: [], pagination: { hasMore: false, offset: pageParam, limit } };
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.pagination.hasMore) {
                return lastPage.pagination.offset + lastPage.pagination.limit;
            }
            return undefined;
        }
    });

    // Flatten and map transactions
    const transactions = useMemo(() => {
        if (!data) return [];

        // Flatten pages
        const serverTransactions = data.pages.flatMap(page => page.data);

        const mappedServer = serverTransactions.map((t: any) => {
            const cat = categories.find((c: Category) => c.id === t.categoryId);
            return {
                id: t.id,
                amount: t.amount,
                description: t.description,
                categoryId: t.categoryId,
                categoryName: cat?.name || "Lainnya",
                categoryColor: cat?.color || "bg-slate-500",
                categoryIcon: cat?.icon || "tag",
                type: t.type,
                createdAt: new Date(t.date),
                date: new Date(t.date),
                isVerified: t.isVerified,
                userId: t.userId || 0,
                merchantName: t.merchantName || null,
                splitGroupId: t.splitGroupId || null,
            } as TransactionWithCategory;
        });

        // Offline merging
        let merged = [...mappedServer];
        if (offlineTrans.length > 0 && searchQuery === "") {
            const mappedOffline = offlineTrans.map(t => ({
                ...t,
                category: categories.find(c => c.id === Number(t.categoryId))?.name || "Lainnya",
                categoryName: categories.find(c => c.id === Number(t.categoryId))?.name || "Lainnya",
            } as TransactionWithCategory));
            merged = [...mappedOffline, ...merged];
        }

        return merged;
    }, [data, offlineTrans, categories, searchQuery]);

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["transactions"] });
        const trans = await OfflineManager.getOptimisticTransactions();
        setOfflineTrans(trans);
    }, [queryClient]);

    return {
        transactions,
        categories,
        loading: isLoading || !mounted,
        mounted,
        fetchNextPage,
        hasNextPage: !!hasNextPage,
        isFetchingNextPage,
        refresh
    };
}
