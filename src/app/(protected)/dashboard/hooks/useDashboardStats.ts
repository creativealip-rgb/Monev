"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/frontend/lib/api-client";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { UserTier } from "@/lib/tier-gate";
import { useSecurity } from "@/components/SecurityProvider";
import { logger } from "@/lib/logger";
import type { DashboardStats, Transaction, UserProfile } from "../types";

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

interface Anomaly {
    categoryName: string;
    spikePercentage: number;
}

export function useDashboardStats() {
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);
    const [offlineTrans, setOfflineTrans] = useState<any[]>([]);
    const { isDecoyMode } = useSecurity();

    useEffect(() => {
        setMounted(true);
        const loadOffline = async () => {
            const trans = await OfflineManager.getOptimisticTransactions();
            setOfflineTrans(trans);
        };
        loadOffline();

        const handleTransactionAdded = async () => {
            logger.info("[useDashboardStats] Event received: transactionAdded");
            await loadOffline();
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            await queryClient.refetchQueries({ queryKey: ["dashboard"] });
            await queryClient.refetchQueries({ queryKey: ["accounts"] });
        };

        window.addEventListener("transactionAdded", handleTransactionAdded);
        return () => window.removeEventListener("transactionAdded", handleTransactionAdded);
    }, [queryClient]);

    // Profile Query
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["dashboard", "profile"],
        queryFn: async () => {
            const res = await apiFetch("/api/profile");
            const json = await res.json();
            if (json.success && json.data?.user) {
                OfflineManager.setCache("dashboard_profile", json.data.user);
                return json.data.user as UserProfile;
            }
            throw new Error("Failed to fetch profile");
        },
    });

    // Categories Query
    const { data: categories = [] } = useQuery({
        queryKey: ["dashboard", "categories"],
        queryFn: async () => {
            const res = await apiFetch("/api/categories");
            const json = await res.json();
            if (json.success) {
                OfflineManager.setCache("dashboard_categories", json.data);
                return json.data as Category[];
            }
            return [];
        },
    });

    // Stats Query
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const { data: serverStats, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard", "stats", currentYear, currentMonth],
        queryFn: async () => {
            const res = await apiFetch(`/api/stats?year=${currentYear}&month=${currentMonth}`);
            const json = await res.json();
            if (json.success && json.data) {
                OfflineManager.setCache("dashboard_stats", json.data);
                return json.data as DashboardStats;
            }
            return { income: 0, expense: 0, balance: 0, fees: 0, totalAccounts: 0, accountCount: 0 };
        },
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
    });

    // Transactions Query
    const { data: serverTransactions = [], isLoading: transLoading } = useQuery({
        queryKey: ["dashboard", "transactions"],
        queryFn: async () => {
            const res = await apiFetch("/api/transactions");
            const json = await res.json();
            if (json.success) {
                return json.data as any[];
            }
            return [];
        },
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
    });

    // Anomalies Query
    const { data: anomalies = [] } = useQuery({
        queryKey: ["dashboard", "anomalies"],
        queryFn: async () => {
            try {
                const res = await apiFetch("/api/dashboard/scan", { silent: true });
                const json = await res.json();
                if (json.anomalies) {
                    OfflineManager.setCache("dashboard_anomalies", json.anomalies);
                    return json.anomalies as Anomaly[];
                }
            } catch {
                return [];
            }
            return [];
        },
    });

    // Bills Query
    const { data: bills = [] } = useQuery({
        queryKey: ["dashboard", "bills"],
        queryFn: async () => {
            const res = await apiFetch("/api/bills");
            const json = await res.json();
            if (json.success) {
                return json.data as any[];
            }
            return [];
        },
    });

    // Derived states
    const fullName = profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : null;
    const userName = fullName || profile?.name || "Sultan";
    const userTier = (profile?.tier || "starter") as UserTier;
    const userImage = profile?.image || null;

    // Merge Offline Stats
    const stats = useMemo(() => {
        if (isDecoyMode) {
            return {
                income: 1250000,
                expense: 850000,
                balance: 1500000,
                growth: 2.5,
                totalGoals: 0,
                totalInvestments: 0,
                fees: 0,
                totalAccounts: 2500000,
                accountCount: 4,
            };
        }
        const base = serverStats || { income: 0, expense: 0, balance: 0, fees: 0, weeklyBudgetRemaining: 0, weeklyBudgetTotal: 0, totalAccounts: 0, accountCount: 0 };

        const totalAccounts = serverStats?.totalAccounts ?? 0;
        const accountCount = serverStats?.accountCount ?? 0;

        if (offlineTrans.length === 0) {
            return {
                ...base,
                totalAccounts,
                accountCount,
            };
        }

        const offlineIncome = offlineTrans.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
        const offlineExpense = offlineTrans.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            ...base,
            totalAccounts,
            accountCount,
            income: base.income + offlineIncome,
            expense: base.expense + offlineExpense,
            balance: base.balance + offlineIncome - offlineExpense,
        };
    }, [serverStats, offlineTrans, isDecoyMode]);

    // Memoized mapped server transactions
    const mappedServerTransactions = useMemo(() => {
        return serverTransactions.map(t => {
            const cat = categories.find(c => c.id === t.categoryId);
            return {
                id: t.id.toString(),
                amount: t.amount,
                description: t.description,
                categoryId: t.categoryId,
                categoryName: cat?.name || "Lainnya",
                categoryColor: cat?.color || "#64748b",
                categoryIcon: cat?.icon || "CreditCard",
                type: t.type,
                createdAt: t.date,
                date: new Date(t.date),
                isVerified: t.isVerified,
                paymentMethod: t.paymentMethod || "cash",
                accountId: t.accountId || null,
            };
        });
    }, [serverTransactions, categories]);

    // Merge Offline Transactions
    const allTransactions = useMemo(() => {
        if (isDecoyMode) {
            return [
                { id: "fake-1", amount: 50000, description: "Makan Siang", categoryName: "Makan", categoryColor: "#f97316", categoryIcon: "Utensils", type: "expense" as const, createdAt: new Date().toISOString(), isVerified: true, paymentMethod: "cash", accountId: null },
                { id: "fake-2", amount: 15000, description: "Parkir", categoryName: "Transportasi", categoryColor: "#3b82f6", categoryIcon: "Car", type: "expense" as const, createdAt: new Date().toISOString(), isVerified: true, paymentMethod: "qris", accountId: null },
                { id: "fake-3", amount: 2500000, description: "Gaji", categoryName: "Gaji", categoryColor: "#10b981", categoryIcon: "Briefcase", type: "income" as const, createdAt: new Date().toISOString(), isVerified: true, paymentMethod: "transfer", accountId: null },
            ] as Transaction[];
        }

        const mappedOffline = offlineTrans.map(t => {
            const cat = categories.find(c => c.id === Number(t.categoryId));
            return {
                ...t,
                categoryId: Number(t.categoryId),
                categoryName: cat?.name || "Lainnya",
                categoryColor: cat?.color || "#64748b",
                categoryIcon: cat?.icon || "CreditCard",
                paymentMethod: t.paymentMethod || "cash",
                accountId: t.accountId || null,
            };
        });

        return [...mappedOffline, ...mappedServerTransactions] as Transaction[];
    }, [mappedServerTransactions, offlineTrans, categories, isDecoyMode]);

    const transactions = useMemo(() => allTransactions.slice(0, 5), [allTransactions]);

    const loading = !mounted || (profileLoading && !profile) || (statsLoading && !serverStats);

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        const trans = await OfflineManager.getOptimisticTransactions();
        setOfflineTrans(trans);
    }, [queryClient]);

    // Calculate today's stats
    const todayStats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayTransactions = allTransactions.filter(t => {
            const transDate = new Date(t.createdAt);
            transDate.setHours(0, 0, 0, 0);
            return transDate.getTime() === today.getTime();
        });

        const income = todayTransactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = todayTransactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expense,
            count: todayTransactions.length,
        };
    }, [allTransactions]);

    return {
        transactions,
        allTransactions,
        stats,
        userName,
        userTier,
        userImage,
        anomalies,
        bills,
        loading,
        mounted,
        todayStats,
        refresh,
    };
}
