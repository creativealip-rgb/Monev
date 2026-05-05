"use client";

import { useEffect } from "react";

export function MobileAuthRedirect({ deepLink }: { deepLink: string }) {
    useEffect(() => {
        const timer = window.setTimeout(() => {
            window.location.href = deepLink;
        }, 300);

        return () => window.clearTimeout(timer);
    }, [deepLink]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 px-6 text-white">
            <div className="max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-2xl">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-2xl font-bold">M</div>
                <h1 className="text-xl font-semibold">Login berhasil</h1>
                <p className="mt-2 text-sm text-slate-300">Membuka aplikasi Monev...</p>
                <a
                    href={deepLink}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 font-semibold text-white"
                >
                    Buka Aplikasi Monev
                </a>
            </div>
        </main>
    );
}
