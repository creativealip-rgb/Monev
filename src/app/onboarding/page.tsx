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
import { CTAScreen } from "./components/CTAScreen";

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        currentScreen,
        formData,
        isComplete,
        isHydrated,
        nextScreen,
        prevScreen,
        updateFormData,
        completeOnboarding,
        skipOnboarding,
    } = useOnboarding();

    // Check if we should reset onboarding (via ?reset=true)
    const shouldReset = searchParams.get("reset") === "true";

    // Redirect if already completed onboarding (unless reset is requested)
    useEffect(() => {
        if (isHydrated && !shouldReset) {
            const hasCompleted = localStorage.getItem("monev_onboarding_complete");
            if (hasCompleted === "true") {
                router.push("/login");
            }
        }
    }, [isHydrated, router, shouldReset]);

    // Handle completion
    useEffect(() => {
        if (isComplete) {
            router.push("/login");
        }
    }, [isComplete, router]);

    // Handle navigation based on current screen
    const handleNext = () => {
        if (currentScreen < 4) {
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
        router.push("/login");
    };

    const handleRegister = () => {
        completeOnboarding();
        router.push("/register");
    };

    const handleLogin = () => {
        completeOnboarding();
        router.push("/login");
    };

    const handleGuest = () => {
        localStorage.setItem("monev_guest_mode", "true");
        localStorage.setItem("monev_onboarding_complete", "true");
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

    return (
        <MobileContainer>
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
                        onNext={handleNext}
                        onPrev={handlePrev}
                    />
                )}
                {currentScreen === 4 && (
                    <CTAScreen
                        key="cta"
                        initialBalance={formData.initialBalance}
                        currency={formData.currency}
                        onRegister={handleRegister}
                        onLogin={handleLogin}
                        onGuest={handleGuest}
                    />
                )}
            </AnimatePresence>
        </MobileContainer>
    );
}
