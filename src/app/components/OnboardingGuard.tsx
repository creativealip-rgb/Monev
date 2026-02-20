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

        const localStatus = localStorage.getItem("monev_onboarding_complete");
        const isComplete = serverStatus || localStatus === "true";

        if (!isComplete) {
            router.push("/onboarding");
        } else if (serverStatus && localStatus !== "true") {
            // Sync local storage if server says it's done
            localStorage.setItem("monev_onboarding_complete", "true");
        }
    }, [pathname, router, serverStatus]);

    if (!isMounted) return null;

    return <>{children}</>;
}
