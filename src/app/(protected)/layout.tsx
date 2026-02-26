"use client";

import { useEffect, useState } from "react";
import ClientLayout from "../ClientLayout";
import { SecurityProvider } from "@/components/SecurityProvider";
import { OnboardingGuard } from "@/app/components/OnboardingGuard";
import { apiFetch } from "@/frontend/lib/api-client";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await apiFetch("/api/profile");
                const result = await response.json();
                if (result.success) {
                    setHasCompletedOnboarding(result.data.settings?.hasCompletedOnboarding ?? false);
                }
            } catch (error) {
                console.error("Failed to check onboarding status:", error);
                setHasCompletedOnboarding(false);
            }
        };
        checkStatus();
    }, []);

    return (
        <SecurityProvider>
            <OnboardingGuard serverStatus={hasCompletedOnboarding}>
                <ClientLayout>{children}</ClientLayout>
            </OnboardingGuard>
        </SecurityProvider>
    );
}
