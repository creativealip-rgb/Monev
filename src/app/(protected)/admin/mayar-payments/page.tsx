"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";
import { formatCurrency } from "@/frontend/lib/utils";

type Payment = {
    id: number;
    transactionId: string;
    userId: number | null;
    customerEmail: string | null;
    customerName: string | null;
    productName: string | null;
    amount: number | null;
    status: string;
    tier: "pro" | "sultan" | null;
    isBenefector: boolean;
    createdAt: string | Date;
    userEmail: string | null;
    userName: string | null;
};

type UserOption = {
    id: number;
    name: string | null;
    email: string;
    tier: string;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

function formatDate(value: string | Date) {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

export default function AdminMayarPaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [search, setSearch] = useState("");
    const [unmatchedOnly, setUnmatchedOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [matching, setMatching] = useState(false);
    const [notice, setNotice] = useState("");

    const selectedPayment = useMemo(
        () => payments.find((payment) => payment.id === selectedPaymentId) || null,
        [payments, selectedPaymentId]
    );

    const loadPayments = async (page = pagination.page) => {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
        if (search.trim()) params.set("search", search.trim());
        if (unmatchedOnly) params.set("unmatched", "true");

        try {
            const response = await apiFetch(`/api/admin/mayar-payments?${params.toString()}`);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Gagal memuat payment Mayar");
            setPayments(result.data.payments);
            setPagination(result.data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal memuat payment Mayar");
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async () => {
        if (!userSearch.trim()) return;
        const response = await apiFetch(`/api/admin/users?limit=8&search=${encodeURIComponent(userSearch.trim())}`);
        const result = await response.json();
        if (response.ok && result.success) setUsers(result.data.users);
    };

    const matchPayment = async () => {
        if (!selectedPaymentId || !selectedUserId) return;
        setMatching(true);
        setNotice("");
        try {
            const response = await apiFetch("/api/admin/mayar-payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId: selectedPaymentId, userId: selectedUserId }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || "Gagal match payment");
            setNotice("Payment berhasil di-match dan benefit user sudah diaktifkan.");
            setSelectedPaymentId(null);
            setSelectedUserId(null);
            setUserSearch("");
            setUsers([]);
            await loadPayments();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal match payment");
        } finally {
            setMatching(false);
        }
    };

    useEffect(() => {
        loadPayments(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unmatchedOnly]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 pb-28 dark:bg-slate-950 sm:px-6">
            <section className="mx-auto max-w-6xl space-y-5">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="bg-gradient-to-br from-slate-950 via-slate-800 to-sky-700 p-6 text-white">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-200">Admin Tools</p>
                        <h1 className="mt-2 text-3xl font-black">Mayar Payments</h1>
                        <p className="mt-2 max-w-2xl text-sm font-semibold text-white/75">
                            Cek transaksi Mayar, temukan payment yang emailnya belum match, lalu aktifkan benefit ke user secara manual bila perlu.
                        </p>
                    </div>
                    <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
                        <label className="relative block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => event.key === "Enter" && loadPayments(1)}
                                placeholder="Cari email, nama, transaksi, produk..."
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-sky-900/40"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setUnmatchedOnly((value) => !value)}
                            className={`rounded-2xl px-4 py-3 text-sm font-black transition ${unmatchedOnly ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
                        >
                            Unmatched only
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPayments(1)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600"
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>
                </div>

                {notice && (
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                        <CheckCircle2 size={18} /> {notice}
                    </div>
                )}
                {error && (
                    <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-3">
                        {loading ? (
                            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900">Memuat payment...</div>
                        ) : payments.length === 0 ? (
                            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-900">Belum ada payment sesuai filter.</div>
                        ) : payments.map((payment) => (
                            <button
                                key={payment.id}
                                type="button"
                                onClick={() => setSelectedPaymentId(payment.id)}
                                className={`w-full rounded-[1.75rem] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${selectedPaymentId === payment.id ? "border-sky-400 ring-4 ring-sky-100 dark:ring-sky-900/40" : "border-slate-200 dark:border-slate-800"}`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-black text-slate-950 dark:text-white">{payment.customerName || "Tanpa nama"}</span>
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${payment.userId ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200"}`}>{payment.userId ? "matched" : "unmatched"}</span>
                                            {payment.isBenefector && <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase text-sky-700 dark:bg-sky-950 dark:text-sky-200">benefactor</span>}
                                            {payment.tier && <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-black uppercase text-violet-700 dark:bg-violet-950 dark:text-violet-200">{payment.tier}</span>}
                                        </div>
                                        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{payment.customerEmail || "No email"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-950 dark:text-white">{formatCurrency(payment.amount || 0)}</p>
                                        <p className="mt-1 text-[11px] font-semibold text-slate-400">{formatDate(payment.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                                    <span className="truncate">Produk: {payment.productName || "-"}</span>
                                    <span className="truncate">Txn: {payment.transactionId}</span>
                                    <span className="truncate">Status: {payment.status}</span>
                                    <span className="truncate">User: {payment.userEmail || "Belum match"}</span>
                                </div>
                            </button>
                        ))}

                        <div className="flex items-center justify-between rounded-2xl bg-white p-3 text-sm font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                            <span>{pagination.total} payment</span>
                            <div className="flex items-center gap-2">
                                <button disabled={pagination.page <= 1} onClick={() => loadPayments(pagination.page - 1)} className="rounded-xl bg-slate-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-800">Prev</button>
                                <span>{pagination.page}/{Math.max(1, pagination.totalPages)}</span>
                                <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadPayments(pagination.page + 1)} className="rounded-xl bg-slate-100 px-3 py-2 disabled:opacity-40 dark:bg-slate-800">Next</button>
                            </div>
                        </div>
                    </div>

                    <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-200">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-950 dark:text-white">Manual Match</h2>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pakai kalau payment email beda dengan akun.</p>
                            </div>
                        </div>
                        {selectedPayment ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950/60">
                                    <p className="font-black text-slate-950 dark:text-white">{selectedPayment.customerEmail || selectedPayment.transactionId}</p>
                                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{selectedPayment.productName || "Produk Mayar"}</p>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={userSearch}
                                        onChange={(event) => setUserSearch(event.target.value)}
                                        onKeyDown={(event) => event.key === "Enter" && searchUsers()}
                                        placeholder="Cari user email/nama"
                                        className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                    />
                                    <button onClick={searchUsers} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">Cari</button>
                                </div>
                                <div className="space-y-2">
                                    {users.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => setSelectedUserId(user.id)}
                                            className={`w-full rounded-2xl border p-3 text-left text-sm transition ${selectedUserId === user.id ? "border-sky-400 bg-sky-50 dark:bg-sky-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40"}`}
                                        >
                                            <p className="font-black text-slate-950 dark:text-white">{user.name || user.email}</p>
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{user.email} · {user.tier}</p>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    disabled={!selectedUserId || matching}
                                    onClick={matchPayment}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50"
                                >
                                    <UserRoundCheck size={18} /> {matching ? "Matching..." : "Match & Aktifkan"}
                                </button>
                            </div>
                        ) : (
                            <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">Pilih payment di kiri untuk manual match.</p>
                        )}
                    </aside>
                </div>
            </section>
        </main>
    );
}
