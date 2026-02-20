"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        // Check if onboarding has been completed
        const hasCompletedOnboarding = localStorage.getItem("monev_onboarding_complete");
        
        // If not completed, redirect to onboarding
        if (!hasCompletedOnboarding) {
            router.push("/onboarding");
        }
    }, [router]);

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
            </div>
        );
    }

    // If redirected, don't render children
    const hasCompletedOnboarding = typeof window !== "undefined" && localStorage.getItem("monev_onboarding_complete");
    if (!hasCompletedOnboarding) {
        return null;
    }

    return <>{children}</>;
}
