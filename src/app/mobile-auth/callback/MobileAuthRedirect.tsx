"use client";

import { useEffect } from "react";

export function MobileAuthRedirect({ deepLink, intentLink }: { deepLink: string; intentLink: string }) {
    useEffect(() => {
        const intentTimer = window.setTimeout(() => {
            window.location.href = intentLink;
        }, 250);
        const deepLinkTimer = window.setTimeout(() => {
            window.location.href = deepLink;
        }, 950);

        return () => {
            window.clearTimeout(intentTimer);
            window.clearTimeout(deepLinkTimer);
        };
    }, [deepLink, intentLink]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 px-6 text-white">
            <div className="max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-2xl font-bold">M</div>
                <h1 className="text-xl font-semibold">Login berhasil</h1>
                <p className="mt-2 text-sm text-slate-300">Membuka aplikasi Monev...</p>
                <a
                    href={intentLink}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white"
                >
                    Buka Aplikasi Monev
                </a>
            </div>
        </main>
    );
}
