"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/frontend/lib/api-client";

export interface Account {
    id: number;
    name: string;
    type: "bank" | "emoney" | "cash" | "credit_card" | "investment_wallet";
    balance: number;
    color: string;
    icon: string;
}

export function useAccountsData() {
    const queryClient = useQueryClient();

    const {
        data: accounts = [],
        isLoading,
        isError,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["accounts"],
        retry: 1,
        queryFn: async () => {
            const res = await apiFetch("/api/accounts", { timeout: 30000, silent: true });
            const json = await res.json();
            if (json.success) {
                return json.data as Account[];
            }
            throw new Error(json.error || "Failed to load accounts");
        }
    });

    const hasError = isError && accounts.length === 0;

    // Invalidate accounts cache when transactions change (balances update server-side)
    useEffect(() => {
        const handleTransactionAdded = () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        };
        window.addEventListener("transactionAdded", handleTransactionAdded);
        return () => window.removeEventListener("transactionAdded", handleTransactionAdded);
    }, [queryClient]);

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
    };

    return {
        accounts,
        isLoading,
        isFetching,
        hasError,
        refresh,
        retry: refetch,
    };
}
