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
        const refreshGoals = () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] });
        };

        window.addEventListener("transactionAdded", refreshGoals);
        window.addEventListener("goalsChanged", refreshGoals);
        return () => {
            window.removeEventListener("transactionAdded", refreshGoals);
            window.removeEventListener("goalsChanged", refreshGoals);
        };
    }, [queryClient]);

    // Goals Query
    const {
        data: goals = [],
        isLoading: goalsLoading,
        error: goalsError,
        refetch: refetchGoals,
    } = useQuery({
        queryKey: ["goals"],
        queryFn: async () => {
            const res = await apiFetch("/api/goals");
            const json = await res.json();
            if (json.success) {
                return json.data.map((goal: GoalWithProgress & { target?: number; saved?: number }) => ({
                    ...goal,
                    targetAmount: goal.targetAmount ?? goal.target ?? 0,
                    currentAmount: goal.currentAmount ?? goal.saved ?? 0,
                })) as GoalWithProgress[];
            }
            throw new Error(json.error || "Gagal memuat goals");
        }
    });

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["goals"] });
    }, [queryClient]);

    return {
        goals,
        loading: goalsLoading || !mounted,
        error: goalsError,
        mounted,
        refresh,
        refetch: refetchGoals,
    };
}
