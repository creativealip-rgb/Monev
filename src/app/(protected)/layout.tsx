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
                const response = await apiFetch("/api/profile", { silent: true });
                const result = await response.json();
                setHasCompletedOnboarding(result.success ? result.data.settings?.hasCompletedOnboarding ?? false : false);
            } catch {
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
