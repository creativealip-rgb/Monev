"use client";

import { useEffect, useState } from "react";
import {
    Ticket,
    Plus,
    Trash2,
    Copy,
    CheckCircle,
    XCircle,
    Crown,
    Sparkles,
    Loader2,
    RefreshCw,
    Users,
} from "lucide-react";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

interface Coupon {
    id: number;
    code: string;
    tier: "kaya" | "sultan";
    quota: number;
    claimedCount: number;
    expiresAt: string | null;
    createdAt: string;
}

interface CouponStats {
    tier: string;
    totalCoupons: number;
    totalClaimed: number;
    totalQuota: number;
}

interface CouponClaim {
    id: number;
    couponId: number;
    userId: number;
    claimedAt: string;
    user: {
        id: number;
        name: string | null;
        email: string | null;
    } | null;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [stats, setStats] = useState<CouponStats[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "used" | "unused">("all");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        codes: "",
        tier: "kaya" as "kaya" | "sultan",
        expiresAt: "",
        quota: 1,
    });
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        loadCoupons();
    }, [pagination.page, filter]);

    const loadCoupons = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (filter === "used") params.append("used", "true");
            if (filter === "unused") params.append("used", "false");

            const res = await apiFetch(`/api/admin/coupons?${params}`);
            const json = await res.json();
            if (json.success) {
                setCoupons(json.data.coupons);
                setStats(json.data.stats);
                setPagination(json.data.pagination);
            }
        } catch (error) {
            console.error("Failed to load coupons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!createForm.codes.trim()) return;

        setCreating(true);
        setResult(null);

        const codes = createForm.codes
            .split("\n")
            .map(c => c.trim())
            .filter(c => c.length > 0);

        try {
            const res = await apiFetch("/api/admin/coupons", {
                method: "POST",
                body: JSON.stringify({
                    codes,
                    tier: createForm.tier,
                    expiresAt: createForm.expiresAt || null,
                    quota: createForm.quota,
                }),
            });

            const json = await res.json();

            if (json.success) {
                setResult({
                    success: true,
                    message: `Created ${json.data.created.length} coupon(s)${json.data.errors.length > 0 ? `, ${json.data.errors.length} failed` : ""}`,
                });
                setCreateForm({ codes: "", tier: "kaya", expiresAt: "", quota: 1 });
                setShowCreateModal(false);
                loadCoupons();
            } else {
                setResult({ success: false, message: json.error || "Failed to create coupons" });
            }
        } catch (error) {
            setResult({ success: false, message: "An error occurred" });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (couponId: number) => {
        if (!confirm("Delete this coupon?")) return;

        try {
            const res = await apiFetch(`/api/admin/coupons?id=${couponId}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                loadCoupons();
            }
        } catch (error) {
            console.error("Failed to delete coupon:", error);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getTierBadge = (tier: string) => {
        if (tier === "sultan") {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600">
                    <Crown size={10} /> Sultan
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-600">
                <Sparkles size={10} /> Kaya
            </span>
        );
    };

    const totalCoupons = stats.reduce((a, b) => a + b.totalCoupons, 0);
    const usedCoupons = stats.reduce((a, b) => a + b.totalClaimed, 0);
    const unusedCoupons = stats.reduce((a, b) => a + (b.totalQuota - b.totalClaimed), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Coupon Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage subscription coupons</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    Create Coupons
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-slate-500">Total Coupons</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCoupons}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-slate-500">Unused</p>
                    <p className="text-2xl font-bold text-emerald-600">{unusedCoupons}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-sm text-slate-500">Used</p>
                    <p className="text-2xl font-bold text-sky-600">{usedCoupons}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex gap-2">
                        {(["all", "unused", "used"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setFilter(f);
                                    setPagination(p => ({ ...p, page: 1 }));
                                }}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
                                    filter === f
                                        ? "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={loadCoupons}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <RefreshCw size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Code</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tier</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Expires</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Created</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center">
                                        <Loader2 size={24} className="animate-spin mx-auto text-sky-500" />
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                        No coupons found
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <code className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                                                    {coupon.code}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(coupon.code)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                                    title="Copy"
                                                >
                                                    <Copy size={14} className="text-slate-400" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{getTierBadge(coupon.tier)}</td>
                                        <td className="px-4 py-3">
                                            {coupon.claimedCount >= coupon.quota ? (
                                                <span className="inline-flex items-center gap-1 text-rose-600 text-sm">
                                                    <XCircle size={14} /> Full
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                                                    <CheckCircle size={14} /> {coupon.claimedCount}/{coupon.quota}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {formatDate(coupon.expiresAt)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-500">
                                            {formatDate(coupon.createdAt)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} className="text-rose-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Create Coupons
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Coupon Codes (one per line)
                                </label>
                                <textarea
                                    value={createForm.codes}
                                    onChange={(e) => setCreateForm(f => ({ ...f, codes: e.target.value }))}
                                    placeholder="COUPON2024&#10;DISCOUNT50&#10;VIPUSER"
                                    rows={5}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Tier
                                </label>
                                <select
                                    value={createForm.tier}
                                    onChange={(e) => setCreateForm(f => ({ ...f, tier: e.target.value as "kaya" | "sultan" }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                >
                                    <option value="kaya">Kaya (Rp 29.000)</option>
                                    <option value="sultan">Sultan (Rp 99.000)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Quota (max claims)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={createForm.quota}
                                    onChange={(e) => setCreateForm(f => ({ ...f, quota: parseInt(e.target.value) || 1 }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Maximum number of times this coupon can be claimed
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Expires At (optional)
                                </label>
                                <input
                                    type="date"
                                    value={createForm.expiresAt}
                                    onChange={(e) => setCreateForm(f => ({ ...f, expiresAt: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                />
                            </div>

                            {result && (
                                <div className={cn(
                                    "p-3 rounded-lg text-sm",
                                    result.success
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                                        : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400"
                                )}>
                                    {result.message}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!createForm.codes.trim() || creating}
                                className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {creating && <Loader2 size={14} className="animate-spin" />}
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
