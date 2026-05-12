"use client";

import { useEffect, useState } from "react";
import { AlarmClock, Plus, RefreshCw, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { apiFetch } from "@/frontend/lib/api-client";
import { cn } from "@/frontend/lib/utils";

type Schedule = {
    id: number;
    name: string;
    title: string;
    message: string;
    hour: number;
    minute: number;
    target: "all" | "tier";
    tier: "starter" | "pro" | "sultan" | "benefactor" | null;
    isActive: boolean;
    lastRunAt: string | null;
};

const defaultForm = {
    name: "Reminder catat pengeluaran",
    title: "Jangan lupa catat pengeluaran hari ini",
    message: "Yuk catat pengeluaran hari ini biar cashflow tetap rapi.",
    time: "20:00",
    target: "all" as "all" | "tier",
    tier: "pro" as "starter" | "pro" | "sultan" | "benefactor",
    isActive: true,
};

const tierLabels = {
    starter: "Starter",
    pro: "Pro",
    sultan: "Sultan",
    benefactor: "Benefactor",
};

export default function NotificationSchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [message, setMessage] = useState<string | null>(null);

    const loadSchedules = async () => {
        setLoading(true);
        try {
            const res = await apiFetch("/api/admin/notification-schedules");
            const json = await res.json();
            if (json.success) setSchedules(json.data.schedules);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedules();
    }, []);

    const createSchedule = async () => {
        const [hour, minute] = form.time.split(":").map(Number);
        setSaving(true);
        setMessage(null);
        try {
            const res = await apiFetch("/api/admin/notification-schedules", {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    hour,
                    minute,
                    tier: form.target === "tier" ? form.tier : null,
                }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || "Failed to create schedule");
            setForm(defaultForm);
            setMessage("Schedule berhasil dibuat.");
            loadSchedules();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Gagal membuat schedule.");
        } finally {
            setSaving(false);
        }
    };

    const toggleSchedule = async (schedule: Schedule) => {
        await apiFetch("/api/admin/notification-schedules", {
            method: "PATCH",
            body: JSON.stringify({ id: schedule.id, isActive: !schedule.isActive }),
        });
        loadSchedules();
    };

    const deleteSchedule = async (id: number) => {
        if (!confirm("Hapus schedule ini?")) return;
        await apiFetch(`/api/admin/notification-schedules?id=${id}`, { method: "DELETE" });
        loadSchedules();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Schedules</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Atur reminder push notification otomatis harian.</p>
                </div>
                <button onClick={loadSchedules} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm">
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                        <Plus size={18} /> Buat Schedule
                    </div>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama schedule" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul notif" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Isi pesan" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            Jam WIB
                            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
                        </label>
                        <label className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            Target
                            <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as "all" | "tier" })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                                <option value="all">Semua user</option>
                                <option value="tier">Tier tertentu</option>
                            </select>
                        </label>
                    </div>
                    {form.target === "tier" && (
                        <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as typeof form.tier })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                            {Object.entries(tierLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    )}
                    {message && <p className="text-sm text-slate-500">{message}</p>}
                    <button disabled={saving} onClick={createSchedule} className="w-full px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
                        {saving ? "Saving..." : "Simpan Schedule"}
                    </button>
                </div>

                <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading schedules...</div>
                    ) : schedules.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">Belum ada schedule.</div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                            {schedules.map((schedule) => (
                                <div key={schedule.id} className="p-5 flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <AlarmClock size={18} className="text-sky-500" />
                                            <h2 className="font-semibold text-slate-900 dark:text-white">{schedule.name}</h2>
                                            <span className={cn("px-2 py-0.5 rounded-full text-xs", schedule.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500")}>{schedule.isActive ? "Aktif" : "Nonaktif"}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{schedule.title}</p>
                                        <p className="text-sm text-slate-500">{schedule.message}</p>
                                        <p className="text-xs text-slate-400">Setiap hari {String(schedule.hour).padStart(2, "0")}:{String(schedule.minute).padStart(2, "0")} WIB - {schedule.target === "all" ? "Semua user" : tierLabels[schedule.tier || "starter"]}</p>
                                        {schedule.lastRunAt && <p className="text-xs text-slate-400">Last run: {new Date(schedule.lastRunAt).toLocaleString("id-ID")}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleSchedule(schedule)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                                            {schedule.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                        </button>
                                        <button onClick={() => deleteSchedule(schedule.id)} className="p-2 hover:bg-rose-50 rounded-lg text-rose-500">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
