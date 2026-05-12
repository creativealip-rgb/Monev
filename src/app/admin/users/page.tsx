"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Crown,
    Sparkles,
    Zap,
    CheckCircle,
    XCircle,
    Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";

interface User {
    id: number;
    name: string | null;
    email: string | null;
    username: string | null;
    image: string | null;
    tier: "starter" | "pro" | "sultan" | "benefactor";
    isAdmin: boolean;
    isActive: boolean;
    telegramId: number | null;
    whatsappId: string | null;
    tierExpiresAt: string | null;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const tierConfig = {
    starter: { label: "Starter", bg: "bg-slate-100", text: "text-slate-600", icon: Zap },
    pro: { label: "Pro", bg: "bg-sky-50", text: "text-sky-600", icon: Sparkles },
    sultan: { label: "Sultan", bg: "bg-amber-50", text: "text-amber-600", icon: Crown },
    benefactor: { label: "Benefactor", bg: "bg-emerald-50", text: "text-emerald-600", icon: Crown },
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tierFilter, setTierFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ tier: "", isActive: true });
    const [saving, setSaving] = useState(false);
    const [deletingUser, setDeletingUser] = useState<number | null>(null);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (search) params.append("search", search);
            if (tierFilter) params.append("tier", tierFilter);
            if (statusFilter) params.append("isActive", statusFilter);

            const res = await apiFetch(`/api/admin/users?${params}`);
            const json = await res.json();
            if (json.success) {
                setUsers(json.data.users);
                setPagination(json.data.pagination);
            }
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, tierFilter, statusFilter]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSearch = (value: string) => {
        setSearch(value);
        setPagination(p => ({ ...p, page: 1 }));
    };

    const handleTierFilter = (value: string) => {
        setTierFilter(value);
        setPagination(p => ({ ...p, page: 1 }));
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        setPagination(p => ({ ...p, page: 1 }));
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditForm({ tier: user.tier, isActive: user.isActive });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);
        try {
            const res = await apiFetch("/api/admin/users", {
                method: "PATCH",
                body: JSON.stringify({
                    userId: editingUser.id,
                    tier: editForm.tier,
                    isActive: editForm.isActive,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setEditingUser(null);
                loadUsers();
            }
        } catch (error) {
            console.error("Failed to update user:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
        }
        setDeletingUser(userId);
        try {
            const res = await apiFetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
            const json = await res.json();
            if (json.success) {
                loadUsers();
            }
        } catch (error) {
            console.error("Failed to delete user:", error);
        } finally {
            setDeletingUser(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and view all registered users</p>
                </div>
                <div className="text-sm text-slate-500">
                    Total: {pagination.total} users
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or username..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    <select
                        value={tierFilter}
                        onChange={(e) => handleTierFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="">All Tiers</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="sultan">Sultan</option>
                        <option value="benefactor">Benefactor</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tier</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center">
                                        <Loader2 size={24} className="animate-spin mx-auto text-sky-500" />
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const tierStyle = tierConfig[user.tier];
                                    const TierIcon = tierStyle.icon;
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                                        {user.image ? (
                                                            <img src={user.image} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                                {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">{user.name || "Unknown"}</p>
                                                        <p className="text-sm text-slate-500">{user.email || "-"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", tierStyle.bg, tierStyle.text)}>
                                                    <TierIcon size={12} />
                                                    {tierStyle.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {user.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                                                        <CheckCircle size={14} /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-rose-600 text-sm">
                                                        <XCircle size={14} /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} className="text-slate-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={deletingUser === user.id}
                                                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        {deletingUser === user.id ? (
                                                            <Loader2 size={16} className="animate-spin text-rose-500" />
                                                        ) : (
                                                            <Trash2 size={16} className="text-rose-500" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setEditingUser(null)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                            Edit User: {editingUser.name || editingUser.email}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Subscription Tier
                                </label>
                                <select
                                    value={editForm.tier}
                                    onChange={(e) => setEditForm(f => ({ ...f, tier: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                >
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="sultan">Sultan</option>
                        <option value="benefactor">Benefactor</option>
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive}
                                        onChange={(e) => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                                        className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Active Account</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
