"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Receipt, RefreshCw, Repeat, Sparkles, X } from "lucide-react";
import { formatCurrency } from "@/frontend/lib/utils";

type RecurringPattern = {
    key: string;
    description: string;
    amount: number;
    type: "expense" | "income";
    categoryId: number | null;
    frequency: "weekly" | "monthly";
    confidence: number;
    occurrences: number;
    nextRunAt: string;
};

const frequencyLabel: Record<RecurringPattern["frequency"], string> = {
    weekly: "Mingguan",
    monthly: "Bulanan",
};

export function RecurringSuggestionsCard() {
    const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingAction, setSavingAction] = useState<{ key: string; action: "recurring" | "bill" | "subscription" | "dismiss" } | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const loadPatterns = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/recurring/suggestions");
            const json = await response.json();
            if (json.success) setPatterns((json.data || []).slice(0, 3));
        } catch (error) {
            console.error("Failed to load recurring suggestions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatterns();
    }, []);

    const acceptPattern = async (pattern: RecurringPattern) => {
        setSavingAction({ key: pattern.key, action: "recurring" });
        setMessage(null);
        try {
            const response = await fetch("/api/recurring/from-pattern", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description: pattern.description,
                    amount: pattern.amount,
                    type: pattern.type,
                    categoryId: pattern.categoryId,
                    frequency: pattern.frequency,
                    nextRunAt: pattern.nextRunAt,
                    patternKey: pattern.key,
                }),
            });
            const json = await response.json();
            if (!json.success) throw new Error(json.error || "Gagal membuat transaksi rutin");
            setPatterns((current) => current.filter((item) => item.key !== pattern.key));
            setMessage("Transaksi berulang berhasil dibuat.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Gagal membuat transaksi berulang.");
        } finally {
            setSavingAction(null);
        }
    };

    const createBillFromPattern = async (pattern: RecurringPattern, isSubscription: boolean) => {
        setSavingAction({ key: pattern.key, action: isSubscription ? "subscription" : "bill" });
        setMessage(null);
        try {
            const nextDate = new Date(pattern.nextRunAt);
            const response = await fetch("/api/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: pattern.description,
                    amount: pattern.amount,
                    categoryId: pattern.categoryId,
                    dueDate: Number.isNaN(nextDate.getTime()) ? 1 : Math.max(1, Math.min(31, nextDate.getDate())),
                    frequency: pattern.frequency === "weekly" ? "weekly" : "monthly",
                    icon: isSubscription ? "Repeat" : "Receipt",
                    color: isSubscription ? "#14b8a6" : "#f59e0b",
                    isSubscription,
                    notes: isSubscription
                        ? "Dibuat sebagai langganan dari deteksi pembayaran berulang di dashboard."
                        : "Dibuat sebagai tagihan dari deteksi pembayaran berulang di dashboard.",
                }),
            });
            const json = await response.json();
            if (!json.success) throw new Error(json.error || "Gagal membuat tagihan");

            await fetch("/api/recurring/dismiss-suggestion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patternKey: pattern.key }),
            });

            setPatterns((current) => current.filter((item) => item.key !== pattern.key));
            setMessage(isSubscription ? "Langganan berhasil dibuat." : "Tagihan pengingat berhasil dibuat.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Gagal membuat tagihan.");
        } finally {
            setSavingAction(null);
        }
    };

    const dismissPattern = async (pattern: RecurringPattern) => {
        setSavingAction({ key: pattern.key, action: "dismiss" });
        setMessage(null);
        try {
            const response = await fetch("/api/recurring/dismiss-suggestion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patternKey: pattern.key }),
            });
            const json = await response.json();
            if (!json.success) throw new Error(json.error || "Gagal menyembunyikan rekomendasi");
            setPatterns((current) => current.filter((item) => item.key !== pattern.key));
            setMessage("Rekomendasi disembunyikan.");
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Gagal menyembunyikan rekomendasi.");
        } finally {
            setSavingAction(null);
        }
    };

    if (!loading && patterns.length === 0 && !message) return null;

    return (
        <section className="px-4 mb-4 sm:px-6 sm:mb-6">
            <div className="rounded-3xl border border-amber-100 bg-white/95 p-4 shadow-sm dark:border-amber-900/40 dark:bg-slate-900/90">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                            <Sparkles size={16} />
                            Pembayaran berulang terdeteksi
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Pilih mau dijadikan transaksi otomatis, tagihan pengingat, atau abaikan.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={loadPatterns}
                        className="rounded-full bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                        aria-label="Refresh rekomendasi rutin"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {message && (
                    <div className="mb-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <CheckCircle2 size={14} />
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                        Menganalisis pola transaksi...
                    </div>
                ) : (
                    <div className="space-y-2">
                        {patterns.map((pattern) => (
                            <div key={pattern.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{pattern.description}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span>{formatCurrency(pattern.amount)}</span>
                                            <span>•</span>
                                            <span>{frequencyLabel[pattern.frequency]}</span>
                                            <span>•</span>
                                            <span>{pattern.occurrences}x terdeteksi</span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                                        <CalendarClock size={12} />
                                        {Math.round(pattern.confidence * 100)}%
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                                    <button
                                        type="button"
                                        onClick={() => acceptPattern(pattern)}
                                        disabled={savingAction?.key === pattern.key}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                                    >
                                        <Repeat size={13} className={savingAction?.key === pattern.key && savingAction.action === "recurring" ? "animate-spin" : ""} />
                                        {savingAction?.key === pattern.key && savingAction.action === "recurring" ? "Menyimpan..." : "Jadikan recurring"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => createBillFromPattern(pattern, false)}
                                        disabled={savingAction?.key === pattern.key}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                                    >
                                        <Receipt size={13} className={savingAction?.key === pattern.key && savingAction.action === "bill" ? "animate-pulse" : ""} />
                                        {savingAction?.key === pattern.key && savingAction.action === "bill" ? "Menyimpan..." : "Jadikan tagihan"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => createBillFromPattern(pattern, true)}
                                        disabled={savingAction?.key === pattern.key}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-600 disabled:opacity-60"
                                    >
                                        <Repeat size={13} className={savingAction?.key === pattern.key && savingAction.action === "subscription" ? "animate-spin" : ""} />
                                        {savingAction?.key === pattern.key && savingAction.action === "subscription" ? "Menyimpan..." : "Jadikan langganan"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => dismissPattern(pattern)}
                                        disabled={savingAction?.key === pattern.key}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-slate-500 transition hover:bg-white disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                                        aria-label="Sembunyikan rekomendasi"
                                        title="Abaikan"
                                    >
                                        {savingAction?.key === pattern.key && savingAction.action === "dismiss" ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
