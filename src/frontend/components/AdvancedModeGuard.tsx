"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LockKeyhole, Sparkles } from "lucide-react";
import { useViewMode } from "@/frontend/hooks/useViewMode";
import { advancedFeatureMenu } from "@/frontend/lib/navigation-menu";
import { trackProductEvent } from "@/frontend/lib/product-analytics";

const advancedPrefixes = advancedFeatureMenu.map((item) => item.href);

function isAdvancedRoute(pathname: string) {
    return advancedPrefixes.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

export function AdvancedModeGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isSimpleMode, setViewMode, loading } = useViewMode();
    const [allowedPath, setAllowedPath] = useState<string | null>(null);
    const showPageOnce = allowedPath === pathname;
    const shouldGate = !loading && isSimpleMode && isAdvancedRoute(pathname) && !showPageOnce;

    useEffect(() => {
        if (shouldGate) {
            trackProductEvent("advanced_feature_prompt_viewed", { path: pathname });
        }
    }, [pathname, shouldGate]);

    if (shouldGate) {
        return (
            <div className="min-h-screen bg-sky-50 px-5 py-10 dark:bg-slate-950">
                <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-[2rem] border border-sky-100 bg-white p-6 text-center shadow-[0_18px_60px_rgba(14,165,233,0.16)] dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                        <LockKeyhole size={28} />
                    </div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-sky-500">Advanced Mode</p>
                    <h1 className="mb-2 text-2xl font-black text-slate-950 dark:text-white">Fitur ini disimpan biar tampilan tetap simpel</h1>
                    <p className="mb-5 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                        Simple Mode fokus ke catat transaksi dan pantau uang. Aktifkan Advanced Mode untuk budgeting, laporan, AI, dan fitur finansial lengkap.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            trackProductEvent("advanced_feature_prompt_accepted", { path: pathname });
                            setViewMode("advanced");
                        }}
                        className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600"
                    >
                        <Sparkles size={18} />
                        Aktifkan Advanced Mode
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            trackProductEvent("advanced_feature_prompt_dismissed", { path: pathname, action: "view_once" });
                            setAllowedPath(pathname);
                        }}
                        className="mb-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-sky-200 hover:text-sky-600 dark:border-slate-700 dark:text-slate-300"
                    >
                        Lihat halaman ini saja
                    </button>
                    <Link
                        href="/dashboard"
                        onClick={() => trackProductEvent("advanced_feature_prompt_dismissed", { path: pathname, action: "back_to_simple" })}
                        className="text-sm font-bold text-slate-500 transition hover:text-sky-600 dark:text-slate-400"
                    >
                        Tetap di Mode Sederhana
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
