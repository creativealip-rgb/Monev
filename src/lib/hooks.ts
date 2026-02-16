import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfileData } from "@/app/(protected)/profile/actions";

// Keys for query caching
export const queryKeys = {
    profile: ["profile"] as const,
    stats: (year: number, month: number) => ["stats", year, month] as const,
    transactions: (limit?: number) => ["transactions", limit] as const,
    categories: ["categories"] as const,
    budgets: (month: number, year: number) => ["budgets", month, year] as const,
    goals: ["goals"] as const,
    bills: ["bills"] as const,
    investments: ["investments"] as const,
    analytics: (year: number, month: number) => ["analytics", year, month] as const,
};

// Profile data hook
export function useProfile() {
    return useQuery({
        queryKey: queryKeys.profile,
        queryFn: fetchProfileData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Stats hook
export function useStats(year: number, month: number) {
    return useQuery({
        queryKey: queryKeys.stats(year, month),
        queryFn: async () => {
            const response = await fetch(`/api/stats?year=${year}&month=${month}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// Transactions hook
export function useTransactions(limit = 50) {
    return useQuery({
        queryKey: queryKeys.transactions(limit),
        queryFn: async () => {
            const response = await fetch(`/api/transactions?limit=${limit}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

// Categories hook
export function useCategories() {
    return useQuery({
        queryKey: queryKeys.categories,
        queryFn: async () => {
            const response = await fetch("/api/categories");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
    });
}

// Budgets hook
export function useBudgets(month: number, year: number) {
    return useQuery({
        queryKey: queryKeys.budgets(month, year),
        queryFn: async () => {
            const response = await fetch(`/api/budgets?month=${month}&year=${year}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

// Goals hook
export function useGoals() {
    return useQuery({
        queryKey: queryKeys.goals,
        queryFn: async () => {
            const response = await fetch("/api/goals");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
}

// Bills hook
export function useBills() {
    return useQuery({
        queryKey: queryKeys.bills,
        queryFn: async () => {
            const response = await fetch("/api/bills");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Investments hook
export function useInvestments() {
    return useQuery({
        queryKey: queryKeys.investments,
        queryFn: async () => {
            const response = await fetch("/api/investments");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 3 * 60 * 1000, // 3 minutes
    });
}

// Analytics hook
export function useAnalytics(year: number, month: number) {
    return useQuery({
        queryKey: queryKeys.analytics(year, month),
        queryFn: async () => {
            const response = await fetch(`/api/analytics?year=${year}&month=${month}`);
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Mutation helpers for cache invalidation
export function useInvalidateQueries() {
    const queryClient = useQueryClient();

    return {
        invalidateStats: (year: number, month: number) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.stats(year, month) });
        },
        invalidateTransactions: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
        },
        invalidateBudgets: (month: number, year: number) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.budgets(month, year) });
        },
        invalidateGoals: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.goals });
        },
        invalidateBills: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.bills });
        },
        invalidateInvestments: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.investments });
        },
        invalidateAnalytics: (year: number, month: number) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.analytics(year, month) });
        },
        invalidateAll: () => {
            queryClient.invalidateQueries();
        },
    };
}
