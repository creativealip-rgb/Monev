"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Wifi } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";
import { cn } from "@/frontend/lib/utils";

type SyncStatus = {
    pending: number;
    processing: number;
    synced: number;
    failed: number;
    conflicts: number;
    lastSyncedAt: string | null;
};

const initialStatus: SyncStatus = {
    pending: 0,
    processing: 0,
    synced: 0,
    failed: 0,
    conflicts: 0,
    lastSyncedAt: null,
};

export function SyncStatusBadge() {
    const [status, setStatus] = useState<SyncStatus>(initialStatus);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const loadStatus = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiFetch("/api/sync/status", { silent: true });
            if (!response.ok) return;
            const result = await response.json();
            if (result.success) setStatus({ ...initialStatus, ...result.data });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const processSync = useCallback(async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            await apiFetch("/api/sync/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mutations: [] }),
                silent: true,
            });
            await loadStatus();
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing, loadStatus]);

    useEffect(() => {
        loadStatus();
        const interval = window.setInterval(loadStatus, 30000);
        window.addEventListener("online", loadStatus);
        window.addEventListener("offline-queue-changed", loadStatus);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener("online", loadStatus);
            window.removeEventListener("offline-queue-changed", loadStatus);
        };
    }, [loadStatus]);

    const totalAttention = status.pending + status.processing + status.failed + status.conflicts;
    const label = useMemo(() => {
        if (status.conflicts > 0) return `${status.conflicts} konflik sync`;
        if (status.failed > 0) return `${status.failed} gagal sync`;
        if (status.pending > 0) return `${status.pending} menunggu sync`;
        if (status.processing > 0 || isSyncing) return "Sinkronisasi...";
        return "Tersinkron";
    }, [isSyncing, status]);

    if (totalAttention === 0 && !isExpanded) {
        return null;
    }

    return (
        <div className="fixed top-[calc(env(safe-area-inset-top)+5.25rem)] left-1/2 z-[110] w-[calc(100%-2rem)] max-w-[468px] -translate-x-1/2">
            <div className={cn(
                "rounded-3xl border shadow-xl backdrop-blur-xl transition-all",
                status.conflicts > 0 || status.failed > 0
                    ? "border-amber-200 bg-amber-50/95 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/90 dark:text-amber-100"
                    : "border-sky-200 bg-white/95 text-slate-800 dark:border-sky-500/30 dark:bg-slate-900/95 dark:text-slate-100"
            )}>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsExpanded(value => !value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") setIsExpanded(value => !value);
                    }}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
                    aria-label="Buka status sinkronisasi"
                >
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-2xl",
                            status.conflicts > 0 || status.failed > 0 ? "bg-amber-500 text-white" : "bg-sky-500 text-white"
                        )}>
                            {isLoading || isSyncing ? <Loader2 size={16} className="animate-spin" /> : status.conflicts > 0 ? <AlertTriangle size={16} /> : <Wifi size={16} />}
                        </div>
                        <div>
                            <p className="text-sm font-black leading-tight">{label}</p>
                            <p className="text-[11px] opacity-70">Offline-first sync</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            processSync();
                        }}
                        className="rounded-full bg-white/60 p-2 shadow-sm transition hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
                        aria-label="Proses sinkronisasi"
                    >
                        {isSyncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                    </button>
                </div>

                {isExpanded && (
                    <div className="grid grid-cols-4 gap-2 border-t border-current/10 px-4 pb-4 pt-3 text-center text-xs">
                        <div><b>{status.pending}</b><span className="block opacity-60">Pending</span></div>
                        <div><b>{status.failed}</b><span className="block opacity-60">Gagal</span></div>
                        <div><b>{status.conflicts}</b><span className="block opacity-60">Konflik</span></div>
                        <div><b>{status.synced}</b><span className="block opacity-60">Selesai</span></div>
                        {status.conflicts > 0 && (
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new Event("monev:open-sync-conflicts"))}
                                className="col-span-4 rounded-2xl bg-amber-500 px-3 py-2 font-bold text-white shadow-sm transition hover:bg-amber-600"
                            >
                                Buka resolusi konflik
                            </button>
                        )}
                        {totalAttention === 0 && (
                            <div className="col-span-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 px-3 py-2 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 size={14} /> Semua data aman.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
