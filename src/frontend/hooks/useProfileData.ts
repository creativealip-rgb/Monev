"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ProfileData");

export function useProfileData() {
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [streak, setStreak] = useState<any>(null);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const response = await apiFetch("/api/profile");
            const result = await response.json();
            const data = result.success ? result.data : null;
            
            if (data) {
                setUser(data.user);
                setSettings(data.settings);
                setGoals(data.goals);
                setStreak(data.streak);
                setAchievements(data.achievements);
            }

            if (data?.user) {
                return data.user;
            }
        } catch (error) {
            logger.error("Failed to load profile data", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async (userId: number) => {
        try {
            const catResponse = await apiFetch("/api/categories");
            const catResult = await catResponse.json();
            if (catResult.success && userId) {
                setCategories(catResult.data.filter((c: any) => c.userId === userId));
            }
        } catch (error) {
            logger.error("Failed to load categories", error);
        }
    };

    useEffect(() => {
        loadData().then(user => {
            if (user?.id) {
                loadCategories(user.id);
            }
        });
    }, []);

    return {
        user,
        settings,
        goals,
        streak,
        achievements,
        categories,
        loading,
        loadData,
        setUser,
        setSettings
    };
}
