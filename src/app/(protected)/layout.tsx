"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientLayout from "../ClientLayout";
import { SecurityProvider } from "@/components/SecurityProvider";
import { OnboardingGuard } from "@/app/components/OnboardingGuard";
import { apiFetch } from "@/frontend/lib/api-client";
import { AdvancedModeGuard } from "@/frontend/components/AdvancedModeGuard";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        let isCancelled = false;

        const checkStatus = async () => {
            try {
                const response = await apiFetch("/api/profile", { silent: true });
                if (response.status === 401) {
                    router.replace("/login");
                    return;
                }

                const result = await response.json();
                if (!isCancelled) {
                    setHasCompletedOnboarding(result.success ? result.data.settings?.hasCompletedOnboarding ?? false : false);
                }
            } catch {
                if (!isCancelled) {
                    router.replace("/login");
                }
            }
        };
        checkStatus();

        return () => {
            isCancelled = true;
        };
    }, [router]);

    return (
        <SecurityProvider>
            <OnboardingGuard serverStatus={hasCompletedOnboarding}>
                <ClientLayout>
                    <AdvancedModeGuard>{children}</AdvancedModeGuard>
                </ClientLayout>
            </OnboardingGuard>
        </SecurityProvider>
    );
}
