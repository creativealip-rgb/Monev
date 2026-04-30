"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function OnboardingGuard({ children, serverStatus }: { children: React.ReactNode, serverStatus?: boolean }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // Skip check if already on onboarding page or landing to avoid loops
        if (pathname?.startsWith("/onboarding") || pathname === "/") return;

        // Wait for the server profile check so protected deep links don't get redirected
        // before their onboarding state is known.
        if (serverStatus === undefined) return;

        const legacyLocalStatus = localStorage.getItem("monev_onboarding_complete");
        const localStatus = localStorage.getItem("monev_onboarding_completed");
        const isComplete = serverStatus || legacyLocalStatus === "true" || localStatus === "true";

        if (!isComplete) {
            router.push("/onboarding");
        } else if (serverStatus && localStatus !== "true") {
            // Sync both known keys because dashboard and guard historically used different names.
            localStorage.setItem("monev_onboarding_complete", "true");
            localStorage.setItem("monev_onboarding_completed", "true");
        }
    }, [pathname, router, serverStatus]);

    if (!isMounted || serverStatus === undefined) return null;

    return <>{children}</>;
}
