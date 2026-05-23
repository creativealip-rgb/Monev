"use client";

import { QueryProvider } from "./QueryProvider";
import { I18nProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode; session?: any }) {
    return (
        <I18nProvider>
            <QueryProvider>{children}</QueryProvider>
        </I18nProvider>
    );
}
