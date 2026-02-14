"use client";

import { useState } from "react";
import { BottomNav } from "@/frontend/components/BottomNav";
import { AddTransactionSheet } from "@/frontend/components/AddTransactionSheet";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

    return (
        <>
            <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-blue-100/50 to-indigo-100">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-200/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-200/30 via-transparent to-transparent" />
            </div>

            <main className="min-h-screen max-w-[500px] mx-auto bg-slate-50/40 backdrop-blur-xl shadow-2xl shadow-blue-900/10 pb-24 relative">
                {children}
            </main>

            <BottomNav onFabClick={() => setIsAddSheetOpen(true)} />
            <AddTransactionSheet
                isOpen={isAddSheetOpen}
                onClose={() => setIsAddSheetOpen(false)}
                onSuccess={() => window.location.reload()}
            />
        </>
    );
}
