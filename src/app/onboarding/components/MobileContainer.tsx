"use client";

import { ReactNode } from "react";

interface MobileContainerProps {
    children: ReactNode;
}

export function MobileContainer({ children }: MobileContainerProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/20 p-4">
            {/* Mobile Container - Full screen on mobile, centered card on desktop */}
            <div className="w-full max-w-md bg-sky-50 dark:bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50" style={{ minHeight: '90vh' }}>
                {/* Safe area padding for mobile devices */}
                <div className="pt-safe h-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
