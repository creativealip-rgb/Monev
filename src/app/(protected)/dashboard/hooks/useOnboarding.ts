"use client";

import { useState, useEffect } from "react";

interface OnboardingState {
    hasCompletedOnboarding: boolean;
    dismissOnboarding: () => void;
    resetOnboarding: () => void;
}

const ONBOARDING_STORAGE_KEY = "monev_onboarding_completed";

export function useOnboarding(accountCount: number): OnboardingState {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

    useEffect(() => {
        // Check if user has already completed onboarding
        const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (completed) {
            setHasCompletedOnboarding(true);
        } else {
            // Show onboarding if no accounts exist
            setHasCompletedOnboarding(accountCount > 0);
        }
    }, [accountCount]);

    const dismissOnboarding = () => {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
        setHasCompletedOnboarding(true);
    };

    const resetOnboarding = () => {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        setHasCompletedOnboarding(false);
    };

    return {
        hasCompletedOnboarding,
        dismissOnboarding,
        resetOnboarding,
    };
}
