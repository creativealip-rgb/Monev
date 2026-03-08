/**
 * Custom hook for dashboard data fetching and management using Tanstack Query
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/frontend/lib/api-client";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { UserTier } from "@/lib/tier-gate";
import { useSecurity } from "@/components/SecurityProvider";

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

interface Transaction {
    id: string;
    amount: number;
    description: string;
    category: string;
    type: "expense" | "income";
    createdAt: string;
    isVerified: boolean;
}

interface DashboardStats {
    income: number;
    expense: number;
    balance: number;
    growth?: number;
    incomeGrowth?: number;
    expenseGrowth?: number;
    prevIncome?: number;
    prevExpense?: number;
    totalGoals?: number;
    totalInvestments?: number;
    fees?: number;
    healthScore?: any;
    streak?: { current: number; longest: number };
    weeklyBudgetRemaining?: number;
    weeklyBudgetTotal?: number;
}

interface Anomaly {
    categoryName: string;
    spikePercentage: number;
}

interface UserProfile {
    name: string;
    firstName?: string;
    lastName?: string;
    image: string | null;
    tier: UserTier;
}

export function useDashboardData() {
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);
    const [offlineTrans, setOfflineTrans] = useState<any[]>([]);
    const { isDecoyMode } = useSecurity();

    useEffect(() => {
        setMounted(true);
        // Load offline transactions initially and when events fire
        const loadOffline = async () => {
            const trans = await OfflineManager.getOptimisticTransactions();
            setOfflineTrans(trans);
        };
        loadOffline();

        const handleTransactionAdded = () => {
            loadOffline();
            // Invalidate queries so React Query knows to refetch in the background
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
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
        initialData: () => {
            // Synchronous read fails, React Query initialData expects sync or undefined if sync fails
            // It's safer to just let it load or use offline managers sync if possible.
            // But we can fallback to promise in initialData if we use it cautiously? No, initialData must be sync.
            // We'll skip initialData and let it cache via react-query's built-in cache. 
            // We can return undefined.
            return undefined;
        }
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
        }
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
            return { income: 0, expense: 0, balance: 0, fees: 0 };
        }
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
        }
    });

    // Anomalies Query
    const { data: anomalies = [], isLoading: anomaliesLoading } = useQuery({
        queryKey: ["dashboard", "anomalies"],
        queryFn: async () => {
            const res = await apiFetch("/api/dashboard/scan");
            const json = await res.json();
            if (json.anomalies) {
                OfflineManager.setCache("dashboard_anomalies", json.anomalies);
                return json.anomalies as Anomaly[];
            }
            return [];
        }
    });

    // Bills Query
    const { data: bills = [], isLoading: billsLoading } = useQuery({
        queryKey: ["dashboard", "bills"],
        queryFn: async () => {
            const res = await apiFetch("/api/bills");
            const json = await res.json();
            if (json.success) {
                return json.data as any[];
            }
            return [];
        }
    });

    // Derived states
    const fullName = profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : null;
    const userName = fullName || profile?.name || "Sultan";
    const userTier = profile?.tier || "miskin";
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
                fees: 0
            };
        }
        const base = serverStats || { income: 0, expense: 0, balance: 0, fees: 0, weeklyBudgetRemaining: 0, weeklyBudgetTotal: 0 };
        if (offlineTrans.length === 0) return base;

        const offlineIncome = offlineTrans.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
        const offlineExpense = offlineTrans.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            ...base,
            income: base.income + offlineIncome,
            expense: base.expense + offlineExpense,
            balance: base.balance + offlineIncome - offlineExpense,
        };
    }, [serverStats, offlineTrans, isDecoyMode]);

    // Merge Offline Transactions - all for stats, sliced for display
    const allTransactions = useMemo(() => {
        if (isDecoyMode) {
            return [
                { id: "fake-1", amount: 50000, description: "Makan Siang", category: "Makan", type: "expense", createdAt: new Date().toISOString(), isVerified: true },
                { id: "fake-2", amount: 15000, description: "Parkir", category: "Transportasi", type: "expense", createdAt: new Date().toISOString(), isVerified: true },
                { id: "fake-3", amount: 2500000, description: "Gaji", category: "Gaji", type: "income", createdAt: new Date().toISOString(), isVerified: true },
            ];
        }
        const mappedServer = serverTransactions.map(t => ({
            id: t.id.toString(),
            amount: t.amount,
            description: t.description,
            category: categories.find(c => c.id === t.categoryId)?.name || "Lainnya",
            type: t.type,
            createdAt: t.date,
            isVerified: t.isVerified,
        }));

        const mappedOffline = offlineTrans.map(t => ({
            ...t,
            category: categories.find(c => c.id === Number(t.categoryId))?.name || "Lainnya",
        }));

        return [...mappedOffline, ...mappedServer];
    }, [serverTransactions, offlineTrans, categories, isDecoyMode]);

    const transactions = useMemo(() => allTransactions.slice(0, 5), [allTransactions]);

    const loading = !mounted || (profileLoading && !profile) || (statsLoading && !serverStats);

    const refresh = useCallback(async () => {
        await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        const trans = await OfflineManager.getOptimisticTransactions();
        setOfflineTrans(trans);
    }, [queryClient]);

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
        refresh,
    };
}