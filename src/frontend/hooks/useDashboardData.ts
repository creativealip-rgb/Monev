/**
 * Custom hook for dashboard data fetching and management
 * Separates data logic from UI component
 */

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { OfflineManager } from "@/frontend/lib/offline-manager";
import { logger } from "@/lib/logger";

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
    created_at: string;
    is_verified: boolean;
}

interface DashboardStats {
    income: number;
    expense: number;
    balance: number;
    growth?: number;
    totalGoals?: number;
    totalInvestments?: number;
    fees?: number;
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
    tier: "miskin" | "kaya" | "sultan";
}

interface UseDashboardDataResult {
    transactions: Transaction[];
    stats: DashboardStats;
    userName: string | null;
    userTier: "miskin" | "kaya" | "sultan";
    userImage: string | null;
    anomalies: Anomaly[];
    loading: boolean;
    mounted: boolean;
    refresh: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataResult {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        income: 0,
        expense: 0,
        balance: 0,
        fees: 0,
    });
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [userTier, setUserTier] = useState<"miskin" | "kaya" | "sultan">("miskin");
    const [userImage, setUserImage] = useState<string | null>(null);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

    const loadData = useCallback(async () => {
        const log = logger;
        
        try {
            // Get current month for stats
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();

            // Try to load cached data first for instant UI response
            const [cachedProfile, cachedStats, cachedTrans, cachedAnomalies] = await Promise.all([
                OfflineManager.getCache("dashboard_profile"),
                OfflineManager.getCache("dashboard_stats"),
                OfflineManager.getCache("dashboard_transactions"),
                OfflineManager.getCache("dashboard_anomalies"),
            ]);

            if (cachedProfile) {
                const fullName = `${cachedProfile.firstName || ""} ${cachedProfile.lastName || ""}`.trim();
                setUserName(fullName || cachedProfile.name || "Sultan");
                setUserImage(cachedProfile.image || null);
                setUserTier(cachedProfile.tier || "miskin");
            }
            if (cachedStats) setStats(cachedStats);
            if (cachedTrans) setTransactions(cachedTrans);
            if (cachedAnomalies) setAnomalies(cachedAnomalies);

            // Fetch all data in parallel for better performance
            const [
                profileResponse,
                statsResponse,
                transResponse,
                catsResponse,
                anomaliesResponse,
            ] = await Promise.all([
                apiFetch("/api/profile"),
                apiFetch(`/api/stats?year=${currentYear}&month=${currentMonth}`),
                apiFetch("/api/transactions"),
                apiFetch("/api/categories"),
                apiFetch("/api/ai/analyze-anomalies"),
            ]);

            const profileResult = await profileResponse.json();
            const profileData = profileResult.success ? profileResult.data : null;

            // Early read for anomalies
            const anomaliesResultData = await anomaliesResponse.json();

            // Process profile data
            if (profileData?.user) {
                const fullName = `${profileData.user.firstName || ""} ${profileData.user.lastName || ""}`.trim();
                const displayName = fullName || profileData.user.name || "Sultan";
                setUserName(displayName);
                setUserImage(profileData.user.image || null);
                setUserTier(profileData.user.tier || "miskin");
                // Cache profile data
                OfflineManager.setCache("dashboard_profile", profileData.user);
            }

            // Process stats
            const statsResult = await statsResponse.json();
            let freshStats: DashboardStats | null = null;
            if (statsResult.success && statsResult.data) {
                freshStats = statsResult.data as DashboardStats;
                setStats(freshStats);
                OfflineManager.setCache("dashboard_stats", freshStats);
            }

            // Process transactions and categories
            const [transResult, catsResult] = await Promise.all([
                transResponse.json(),
                catsResponse.json(),
            ]);

            if (anomaliesResultData.anomalies) {
                setAnomalies(anomaliesResultData.anomalies);
                OfflineManager.setCache("dashboard_anomalies", anomaliesResultData.anomalies);
            }

            let freshTransactions: Transaction[] = [];
            if (transResult.success) {
                const categories: Category[] = catsResult.success ? catsResult.data : [];
                if (catsResult.success) {
                    OfflineManager.setCache("dashboard_categories", catsResult.data);
                }
                freshTransactions = transResult.data.slice(0, 5).map((t: any) => ({
                    id: t.id.toString(),
                    amount: t.amount,
                    description: t.description,
                    category: categories.find((c: Category) => c.id === t.categoryId)?.name || "Lainnya",
                    type: t.type,
                    created_at: t.date,
                    is_verified: t.isVerified,
                }));

                setTransactions(freshTransactions);
                OfflineManager.setCache("dashboard_transactions", freshTransactions);
            }

            // Merge Optimistic (Offline) Transactions
            const offlineTrans = await OfflineManager.getOptimisticTransactions();
            const offlineCats = (await OfflineManager.getCache("dashboard_categories")) || [];

            if (offlineTrans.length > 0) {
                const mappedOffline = offlineTrans.map((t) => ({
                    ...t,
                    category: offlineCats.find((c: any) => c.id === Number(t.categoryId))?.name || "Lainnya",
                }));

                setTransactions((prev) => {
                    const combined = [...mappedOffline, ...prev];
                    return combined.slice(0, 5);
                });

                // Update Stats with offline impact
                setStats((currentStats) => {
                    const baseStats = freshStats || currentStats;
                    const offlineIncome = offlineTrans
                        .filter((t) => t.type === "income")
                        .reduce((sum, t) => sum + Number(t.amount), 0);
                    const offlineExpense = offlineTrans
                        .filter((t) => t.type === "expense")
                        .reduce((sum, t) => sum + Number(t.amount), 0);

                    return {
                        ...baseStats,
                        income: baseStats.income + offlineIncome,
                        expense: baseStats.expense + offlineExpense,
                        balance: baseStats.balance + offlineIncome - offlineExpense,
                    };
                });
            }
        } catch (error) {
            log.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
        loadData();

        // Listen for transaction added event
        const handleTransactionAdded = () => {
            loadData();
        };
        window.addEventListener("transactionAdded", handleTransactionAdded);

        return () => {
            window.removeEventListener("transactionAdded", handleTransactionAdded);
        };
    }, [loadData]);

    return {
        transactions,
        stats,
        userName,
        userTier,
        userImage,
        anomalies,
        loading,
        mounted,
        refresh: loadData,
    };
}