"use client";

import { ReactNode } from "react";

interface MobileContainerProps {
    children: ReactNode;
}

export function MobileContainer({ children }: MobileContainerProps) {
    return (
        <div className="min-h-screen flex justify-center bg-gradient-to-br from-slate-50 via-sky-50/30 to-cyan-50/20">
            {/* Mobile Container - Full screen height */}
            <div className="w-full max-w-md bg-sky-50 dark:bg-slate-950 shadow-2xl overflow-hidden border-x border-slate-200/50 dark:border-slate-800/50 flex flex-col min-h-screen">
                {/* Safe area padding for mobile devices */}
                <div className="pt-safe flex-1 flex flex-col overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
