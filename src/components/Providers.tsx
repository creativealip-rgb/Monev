"use client";

import { SessionProvider } from "next-auth/react";
import { QueryProvider } from "./QueryProvider";
import { I18nProvider } from "@/lib/i18n";

export function Providers({ children, session }: { children: React.ReactNode, session?: any }) {
    return (
        <SessionProvider
            session={session}
            basePath="/api/auth"
            // Don't refetch session every time user switches tabs — reduces ClientFetchError spam
            refetchOnWindowFocus={false}
        >
            <I18nProvider>
                <QueryProvider>
                    {children}
                </QueryProvider>
            </I18nProvider>
        </SessionProvider>
    );
}
