"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useOnboarding } from "./hooks/useOnboarding";
import { MobileContainer } from "./components/MobileContainer";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { FeatureCarousel } from "./components/FeatureCarousel";
import { QuickSetup } from "./components/QuickSetup";
import { InitialBalanceScreen } from "./components/InitialBalanceScreen";
import { MonthlyIncomeScreen } from "./components/MonthlyIncomeScreen";
import ChoicePoint from "./components/ChoicePoint";
import AccountSetup from "./components/AccountSetup";
import DemoDataMatrix from "./components/DemoDataMatrix";
import BudgetSetup from "./components/BudgetSetup";
import AchievementCelebration from "./components/AchievementCelebration";
import { ProgressDots } from "./components/ProgressDots";
import { apiFetch } from "@/frontend/lib/api-client";
import type { BudgetRecommendation, OnboardingAccount } from "./types";

import { Suspense } from "react";

type OnboardingPath = "quick" | "complete" | null;

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

    const [onboardingPath, setOnboardingPath] = useState<OnboardingPath>(null);
    const [demoDataScope, setDemoDataScope] = useState<"quick" | "standard" | "complete" | null>(null);
    const [selectedBudgets, setSelectedBudgets] = useState<BudgetRecommendation[]>([]);


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
                    ? Boolean(result.data?.onboarding_version)
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

    // V2 Flow: After FeatureCarousel (screen 1), show ChoicePoint
    const handlePathSelection = (path: "quick" | "complete") => {
        setOnboardingPath(path);
        if (path === "quick") {
            // Quick path: skip to DemoDataMatrix (screen 5)
            goToScreen(5);
        } else {
            // Complete path: continue to QuickSetup (screen 2)
            nextScreen();
        }
    };

    const handleDemoDataSelection = async (scope: "quick" | "standard" | "complete" | null) => {
        setDemoDataScope(scope);
        
        if (scope) {
            // Apply demo data via API
            try {
                await apiFetch("/api/onboarding/demo-data", {
                    method: "POST",
                    body: JSON.stringify({ scope }),
                });
            } catch (error) {
                console.error("Failed to apply demo data:", error);
            }
        }

        // Continue to monthly income before AI budget suggestion.
        goToScreen(6);
    };

    const handleAccountSetup = (accounts: OnboardingAccount[]) => {
        updateFormData("accounts", accounts);
        // Complete path: continue to monthly income before AI budget suggestion.
        goToScreen(6);
    };

    const handleBudgetSetup = async (budgets: BudgetRecommendation[]) => {
        setSelectedBudgets(budgets);
        updateFormData("budgetRecommendations", budgets);

        // Unlock onboarding_complete achievement
        try {
            await apiFetch("/api/onboarding/achievements/unlock", {
                method: "POST",
                body: JSON.stringify({ achievementCode: "onboarding_complete" }),
            });
        } catch (error) {
            console.error("Failed to unlock achievement:", error);
        }

        goToScreen(8); // Achievement screen
    };

    const handleAchievementContinue = async () => {
        // Mark onboarding as complete
        try {
            await apiFetch("/api/onboarding/complete", {
                method: "POST",
                body: JSON.stringify({
                    onboardingPath,
                    demoDataScope,
                }),
            });
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
        }

        completeOnboarding({
            ...formData,
            budgetRecommendations: selectedBudgets,
        });
    };

    const handleNext = () => {
        if (currentScreen === 1) {
            // After FeatureCarousel, show ChoicePoint
            goToScreen(4); // ChoicePoint is screen 4
        } else if (currentScreen < 3) {
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

    const screenLabels = [
        "Selamat Datang",
        "Fitur",
        "Pengaturan",
        "Saldo Awal",
        "Pilih Jalur",
        "Data Demo",
        "Penghasilan",
        "Budget",
        "Achievement"
    ];

    // V1 screens (0-3) show progress, V2 screens (4-7) are full-screen
    const showProgress = currentScreen >= 0 && currentScreen <= 3;

    return (
        <MobileContainer>
            {/* Global Progress Indicator - only for V1 screens */}
            {showProgress && currentScreen > 0 && (
                <div className="px-6 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500">
                            Langkah {currentScreen + 1} dari 4
                        </span>
                        <span className="text-xs font-semibold text-sky-600">
                            {screenLabels[currentScreen]}
                        </span>
                    </div>
                    <ProgressDots
                        total={4}
                        current={currentScreen}
                        onDotClick={(i) => {
                            if (i <= currentScreen) goToScreen(i);
                        }}
                    />
                </div>
            )}
            <AnimatePresence mode="wait">
                {/* V1 Screens */}
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
                        onUpdate={(field: string, value: number) => {
                            updateFormData(field as keyof typeof formData, value);
                        }}
                        onFinish={async (data) => {
                            updateFormData("initialBalance", data.initialBalance);
                            goToScreen(4);
                            return { success: true };
                        }}
                        onPrev={handlePrev}
                    />
                )}

                {/* V2 Screens */}
                {currentScreen === 4 && (
                    <ChoicePoint
                        key="choice"
                        onSelectPath={handlePathSelection}
                    />
                )}
                {currentScreen === 5 && onboardingPath === "complete" && (
                    <AccountSetup
                        key="accounts"
                        onComplete={handleAccountSetup}
                        onSkip={() => goToScreen(6)}
                    />
                )}
                {currentScreen === 5 && onboardingPath === "quick" && (
                    <DemoDataMatrix
                        key="demo"
                        onSelect={handleDemoDataSelection}
                    />
                )}
                {currentScreen === 6 && (
                    <MonthlyIncomeScreen
                        key="income"
                        currency={formData.currency}
                        monthlyIncome={formData.monthlyIncome}
                        onUpdate={(field: string, value: number) => {
                            updateFormData(field as keyof typeof formData, value);
                        }}
                        onNext={() => goToScreen(7)}
                        onPrev={() => goToScreen(5)}
                    />
                )}
                {currentScreen === 7 && (
                    <BudgetSetup
                        key="budget"
                        monthlyIncome={formData.monthlyIncome}
                        onComplete={handleBudgetSetup}
                        onSkip={() => goToScreen(8)}
                    />
                )}
                {currentScreen === 8 && (
                    <AchievementCelebration
                        key="achievement"
                        achievement={{
                            code: "onboarding_complete",
                            name: "First Step",
                            description: "Selamat! Kamu telah menyelesaikan onboarding Monev",
                            icon: "🎉",
                            tier: "Bronze",
                            points: 10,
                        }}
                        onContinue={handleAchievementContinue}
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
