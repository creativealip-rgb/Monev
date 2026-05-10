"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { OnboardingFormData, OnboardingState } from "../types";
import { apiFetch } from "@/frontend/lib/api-client";

const STORAGE_KEY = "monev_onboarding_complete";
const ONBOARDING_DATA_KEY = "monev_onboarding_data";

function getInitialFormData(): OnboardingFormData {
    if (typeof window === "undefined") {
        return {
            currency: "IDR",
            language: "id",
            pin: "",
            notifications: true,
            initialBalance: 0,
            monthlyIncome: 0,
            accounts: [],
        };
    }

    const saved = localStorage.getItem(ONBOARDING_DATA_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return {
                currency: "IDR",
                language: "id",
                pin: "",
                notifications: true,
                initialBalance: 0,
                monthlyIncome: 0,
                accounts: [],
                ...parsed.formData,
            };
        } catch (e) {
            console.error("Failed to parse onboarding data:", e);
        }
    }

    return {
        currency: "IDR",
        language: "id",
        pin: "",
        notifications: true,
        initialBalance: 0,
        monthlyIncome: 0,
        accounts: [],
    };
}

// Simple hydration check using useSyncExternalStore
function useHydrated() {
    return useSyncExternalStore(
        () => () => { },
        () => true,
        () => false
    );
}

export function useOnboarding() {
    const isHydrated = useHydrated();

    const [state, setState] = useState<OnboardingState>({
        currentScreen: 0,
        totalScreens: 9, // welcome, feature-carousel, quick-setup, balance, choice, account/demo, income, budget, achievement
        formData: getInitialFormData(),
        isComplete: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Save state changes
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify({ formData: state.formData }));
        }
    }, [state.formData, isHydrated]);

    const nextScreen = useCallback(() => {
        setState((prev) => ({
            ...prev,
            currentScreen: Math.min(prev.currentScreen + 1, prev.totalScreens - 1),
        }));
    }, []);

    const prevScreen = useCallback(() => {
        setState((prev) => ({
            ...prev,
            currentScreen: Math.max(prev.currentScreen - 1, 0),
        }));
    }, []);

    const goToScreen = useCallback((index: number) => {
        setState((prev) => ({
            ...prev,
            currentScreen: Math.max(0, Math.min(index, prev.totalScreens - 1)),
        }));
    }, []);

    const updateFormData = useCallback(<K extends keyof OnboardingFormData>(
        field: K,
        value: OnboardingFormData[K]
    ) => {
        setState((prev) => ({
            ...prev,
            formData: { ...prev.formData, [field]: value },
        }));
    }, []);

    const completeOnboarding = useCallback(async (formDataOverride?: OnboardingFormData) => {
        setIsSubmitting(true);
        try {
            const payload = formDataOverride ?? state.formData;
            const response = await apiFetch("/api/onboarding", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                throw new Error("UNAUTHORIZED");
            }

            const result = await response.json();
            if (response.ok && result.success) {
                localStorage.setItem(STORAGE_KEY, "true");
                localStorage.setItem("monev_onboarding_completed", "true");
                localStorage.removeItem(ONBOARDING_DATA_KEY);
                setState((prev) => ({ ...prev, formData: payload, isComplete: true }));
                return { success: true };
            }

            const message = result.message || result.error || "Gagal menyelesaikan onboarding";
            console.error("Failed to complete onboarding:", message);
            return { success: false, message };
        } catch (error) {
            console.error("Onboarding Error:", error);
            return {
                success: false,
                message: error instanceof Error && error.message === "UNAUTHORIZED"
                    ? "Sesi habis. Silakan login lagi."
                    : "Gagal menyimpan setup. Coba lagi.",
            };
        } finally {
            setIsSubmitting(false);
        }
    }, [state.formData]);

    const skipOnboarding = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, "true");
        setState((prev) => ({ ...prev, isComplete: true }));
    }, []);

    const hasCompletedOnboarding = useCallback(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(STORAGE_KEY) === "true";
    }, []);

    return {
        ...state,
        isHydrated,
        isSubmitting,
        nextScreen,
        prevScreen,
        goToScreen,
        updateFormData,
        completeOnboarding,
        skipOnboarding,
        hasCompletedOnboarding,
    };
}
