"use client";

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

    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ["accounts"],
        queryFn: async () => {
            const res = await apiFetch("/api/accounts", { timeout: 60000 });
            const json = await res.json();
            if (json.success) {
                return json.data as Account[];
            }
            return [];
        }
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
    };

    return {
        accounts,
        isLoading,
        refresh
    };
}
