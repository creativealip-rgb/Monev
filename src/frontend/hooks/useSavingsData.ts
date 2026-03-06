/**
 * Custom hook for savings data fetching and management using Tanstack Query
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/frontend/lib/api-client";
import { GoalWithProgress } from "@/types";

export function useSavingsData() {
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleTransactionAdded = () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
        };

        window.addEventListener("transactionAdded", handleTransactionAdded);
        return () => window.removeEventListener("transactionAdded", handleTransactionAdded);
    }, [queryClient]);

    // Goals Query
    const { data: goals = [], isLoading: goalsLoading } = useQuery({
        queryKey: ["goals"],
        queryFn: async () => {
            const res = await apiFetch("/api/goals");
            const json = await res.json();
            if (json.success) {
                return json.data as GoalWithProgress[];
            }
            return [];
        }
    });

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["goals"] });
    }, [queryClient]);

    return {
        goals,
        loading: goalsLoading || !mounted,
        mounted,
        refresh
    };
}
