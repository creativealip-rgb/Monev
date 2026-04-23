"use client";

import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "@/frontend/lib/api-client";
import type { TransactionWithCategory } from "@/types";
import type { AnalyticsData } from "../components/types";

export interface AnalyticsFilterParams {
    month: number;
    year: number;
    startDate?: string | null;
    endDate?: string | null;
    accountId?: string;
    categoryId?: string;
}

export interface AnalyticsFilterOption {
    id: number;
    name: string;
    type?: "expense" | "income";
}

export interface FinancialMapNode {
    id: string;
    name: string;
    kind?: "income" | "expense-category" | "uncategorized-expense" | "savings";
    categoryId?: number;
    color?: string;
    value?: number;
    y?: number;
    height?: number;
}

export interface FinancialMapLink {
    source: string;
    target: string;
    value: number;
    kind?: "income-to-category" | "income-to-uncategorized" | "income-to-savings";
    categoryId?: number;
    targetName?: string;
    ySource?: number;
    yTarget?: number;
    thickness?: number;
}

export interface FinancialMapData {
    nodes: FinancialMapNode[];
    links: FinancialMapLink[];
}

export interface AnalyticsTransactionsResponse {
    success: boolean;
    data: TransactionWithCategory[];
    pagination: {
        total?: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

function buildAnalyticsParams(filters: AnalyticsFilterParams): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.startDate && filters.endDate) {
        params.set("startDate", filters.startDate);
        params.set("endDate", filters.endDate);
    } else {
        params.set("month", String(filters.month));
        params.set("year", String(filters.year));
    }

    if (filters.accountId && filters.accountId !== "all") {
        params.set("accountId", filters.accountId);
    }

    if (filters.categoryId && filters.categoryId !== "all") {
        params.set("categoryId", filters.categoryId);
    }

    return params;
}

export function getAnalyticsQueryKey(filters: AnalyticsFilterParams) {
    return [
        "analytics",
        filters.year,
        filters.month,
        filters.startDate || null,
        filters.endDate || null,
        filters.accountId || "all",
        filters.categoryId || "all",
    ] as const;
}

export function getFinancialMapQueryKey(filters: AnalyticsFilterParams) {
    return [
        "analytics",
        "financial-map",
        filters.year,
        filters.month,
        filters.startDate || null,
        filters.endDate || null,
        filters.accountId || "all",
        filters.categoryId || "all",
    ] as const;
}

export function getAnalyticsQueryOptions(filters: AnalyticsFilterParams) {
    return queryOptions({
        queryKey: getAnalyticsQueryKey(filters),
        queryFn: async (): Promise<AnalyticsData> => {
            const params = buildAnalyticsParams(filters);
            const response = await apiFetch(`/api/analytics?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Gagal memuat analytics.");
            }

            return response.json() as Promise<AnalyticsData>;
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function getFinancialMapQueryOptions(filters: AnalyticsFilterParams) {
    return queryOptions({
        queryKey: getFinancialMapQueryKey(filters),
        queryFn: async (): Promise<FinancialMapData> => {
            const params = buildAnalyticsParams(filters);
            const response = await apiFetch(`/api/analytics/sankey?${params.toString()}`);
            const json = await response.json();

            if (!response.ok || !json?.success) {
                throw new Error("Gagal memuat peta keuangan.");
            }

            return json.data as FinancialMapData;
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function getAccountsQueryOptions() {
    return queryOptions({
        queryKey: ["analytics", "accounts"] as const,
        queryFn: async (): Promise<AnalyticsFilterOption[]> => {
            const response = await apiFetch("/api/accounts");
            const json = await response.json();

            if (!response.ok || !json?.success) {
                throw new Error("Gagal memuat daftar akun.");
            }

            return json.data as AnalyticsFilterOption[];
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function getExpenseCategoriesQueryOptions() {
    return queryOptions({
        queryKey: ["analytics", "expense-categories"] as const,
        queryFn: async (): Promise<AnalyticsFilterOption[]> => {
            const response = await apiFetch("/api/categories");
            const json = await response.json();

            if (!response.ok || !json?.success) {
                throw new Error("Gagal memuat daftar kategori.");
            }

            const categories = (json.data as AnalyticsFilterOption[]).filter(
                (category) => category.type === "expense"
            );

            return categories;
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function getAnalyticsTransactionsQueryOptions(filter: {
    categoryId?: number;
    accountId?: number;
    type?: "expense" | "income" | "transfer" | "all";
    startDate?: string;
    endDate?: string;
    limit?: number;
}) {
    return queryOptions({
        queryKey: [
            "analytics",
            "transactions",
            filter.categoryId || null,
            filter.accountId || null,
            filter.type || "expense",
            filter.startDate || null,
            filter.endDate || null,
            filter.limit || 20,
        ] as const,
        queryFn: async (): Promise<TransactionWithCategory[]> => {
            const params = new URLSearchParams({
                limit: String(filter.limit || 20),
                type: filter.type || "expense",
            });

            if (filter.categoryId) {
                params.set("categoryId", String(filter.categoryId));
            }

            if (filter.accountId) {
                params.set("accountId", String(filter.accountId));
            }

            if (filter.startDate) {
                params.set("startDate", filter.startDate);
            }

            if (filter.endDate) {
                params.set("endDate", filter.endDate);
            }

            const response = await apiFetch(`/api/transactions?${params.toString()}`);
            const json = await response.json() as AnalyticsTransactionsResponse;

            if (!response.ok || !json.success) {
                throw new Error("Gagal memuat transaksi.");
            }

            return json.data;
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
