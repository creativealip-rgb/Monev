"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useOnboarding } from "./hooks/useOnboarding";
import { MobileContainer } from "./components/MobileContainer";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { FeatureCarousel } from "./components/FeatureCarousel";
import { QuickSetup } from "./components/QuickSetup";
import { InitialBalanceScreen } from "./components/InitialBalanceScreen";
import { ProgressDots } from "./components/ProgressDots";
import { apiFetch } from "@/frontend/lib/api-client";

import { Suspense } from "react";

function OnboardingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        currentScreen,
        formData,
        isComplete,
        isHydrated,
        nextScreen,
        prevScreen,
        goToScreen,
        updateFormData,
        completeOnboarding,
        skipOnboarding,
    } = useOnboarding();

    // Check if we should reset onboarding (via ?reset=true)
    const shouldReset = searchParams.get("reset") === "true";

    // Onboarding is account-bound, so APK users must login before setup.
    useEffect(() => {
        if (!isHydrated) return;

        const checkAccess = async () => {
            try {
                const response = await apiFetch("/api/profile", { silent: true });
                if (response.status === 401) {
                    router.replace("/login");
                    return;
                }

                const result = await response.json();
                const hasCompleted = result.success
                    ? result.data.settings?.hasCompletedOnboarding
                    : localStorage.getItem("monev_onboarding_complete") === "true";

                if (hasCompleted && !shouldReset) {
                    localStorage.setItem("monev_onboarding_complete", "true");
                    localStorage.setItem("monev_onboarding_completed", "true");
                    router.replace("/dashboard");
                }
            } catch {
                router.replace("/login");
            }
        };

        checkAccess();
    }, [isHydrated, router, shouldReset]);

    // Handle completion
    useEffect(() => {
        if (isComplete) {
            router.push("/dashboard");
        }
    }, [isComplete, router]);

    // Handle navigation based on current screen
    const handleNext = () => {
        if (currentScreen < 3) {
            nextScreen();
        }
    };

    const handlePrev = () => {
        if (currentScreen > 0) {
            prevScreen();
        }
    };

    const handleSkip = () => {
        skipOnboarding();
        router.push("/dashboard");
    };

    // Show loading while hydrating
    if (!isHydrated) {
        return (
            <MobileContainer>
                <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
                </div>
            </MobileContainer>
        );
    }

    const TOTAL_SCREENS = 4;
    const screenLabels = ["Selamat Datang", "Fitur", "Pengaturan", "Saldo Awal"];

    return (
        <MobileContainer>
            {/* Global Progress Indicator */}
            {currentScreen > 0 && (
                <div className="px-6 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">
                            Langkah {currentScreen + 1} dari {TOTAL_SCREENS}
                        </span>
                        <span className="text-xs font-semibold text-sky-600">
                            {screenLabels[currentScreen]}
                        </span>
                    </div>
                    <ProgressDots
                        total={TOTAL_SCREENS}
                        current={currentScreen}
                        onDotClick={(i) => {
                            if (i <= currentScreen) goToScreen(i);
                        }}
                    />
                </div>
            )}
            <AnimatePresence mode="wait">
                {currentScreen === 0 && (
                    <WelcomeScreen
                        key="welcome"
                        onStart={handleNext}
                        onSkip={handleSkip}
                    />
                )}
                {currentScreen === 1 && (
                    <FeatureCarousel
                        key="features"
                        onNext={handleNext}
                        onPrev={handlePrev}
                    />
                )}
                {currentScreen === 2 && (
                    <QuickSetup
                        key="setup"
                        currency={formData.currency}
                        language={formData.language}
                        pin={formData.pin}
                        notifications={formData.notifications}
                        onUpdate={(field: string, value: string | boolean) => updateFormData(field as keyof typeof formData, value)}
                        onNext={handleNext}
                        onPrev={handlePrev}
                    />
                )}
                {currentScreen === 3 && (
                    <InitialBalanceScreen
                        key="balance"
                        currency={formData.currency}
                        initialBalance={formData.initialBalance}
                        onUpdate={(field: string, value: number) => updateFormData(field as keyof typeof formData, value)}
                        onFinish={(data) => completeOnboarding(data)}
                        onPrev={handlePrev}
                    />
                )}
            </AnimatePresence>
        </MobileContainer>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}
