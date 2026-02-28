"use client";

import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "./QueryProvider";

export function Providers({ children, session }: { children: React.ReactNode, session?: any }) {
    return (
        <SessionProvider
            session={session}
            // Don't refetch session every time user switches tabs — reduces ClientFetchError spam
            refetchOnWindowFocus={false}
            // Only refetch session every 5 minutes instead of constantly
            refetchInterval={10 * 60} // Incremental increase
        >
            <QueryProvider>
                {children}
            </QueryProvider>
        </SessionProvider>
    );
}
