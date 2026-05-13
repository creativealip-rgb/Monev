"use client";

import { useState } from "react";
import { Check, Bell, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { useWebPush } from "@/frontend/hooks/useWebPush";
import { Smartphone, Zap, ZapOff } from "lucide-react";

interface NotificationsModalProps {
    onClose: () => void;
    loadData?: () => void;
}

export function NotificationsModal({ onClose, loadData }: NotificationsModalProps) {
    const toast = useToast();
    const { isSupported, isSubscribed, subscribe, unsubscribe, isLoading } = useWebPush() as any;
    const [notifToggles, setNotifToggles] = useState({
        dailyReport: true,
        budgetAlert: true,
        transactionUpdate: true,
        promoNews: true,
        pushEnabled: true
    });

    const [reportPrefs, setReportPrefs] = useState({
        monthlyReportEmail: true,
        monthlyReportTelegram: true,
        weeklyInsightTelegram: false,
        reportLocale: "auto" as "auto" | "id" | "en",
    });

    const handleSave = async () => {
        try {
            const res = await apiFetch("/api/user/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notifications: notifToggles, reports: reportPrefs }),
            });
            if (res.ok) {
                toast.success("Berhasil", "Preferensi notifikasi disimpan!");
                loadData?.();
                onClose();
            } else {
                toast.error("Gagal", "Gagal menyimpan preferensi notifikasi");
            }
        } catch {
            toast.error("Gagal", "Gagal menyimpan preferensi notifikasi");
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-[2rem] p-6 border border-purple-100 dark:border-purple-900/50">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl text-purple-600 dark:text-purple-400 shadow-sm">
                        <Bell size={28} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">Notifikasi</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                            Atur kapan Anda ingin diingatkan tentang keuangan Anda.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Realtime Push Section */}
            <div className={cn(
                "p-5 rounded-3xl border transition-all duration-300",
                isSupported
                    ? isSubscribed
                        ? "bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
                        : "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30"
                    : "bg-slate-50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-800"
            )}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-xl shadow-sm",
                            !isSupported ? "bg-slate-100 text-slate-500" : isSubscribed ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                        )}>
                            {!isSupported ? <Smartphone size={20} /> : isSubscribed ? <Zap size={20} /> : <ZapOff size={20} />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Realtime Push</p>
                            <p className="text-[10px] text-slate-500 font-medium">
                                {!isSupported
                                    ? "Push tidak tersedia di browser/perangkat ini"
                                    : isSubscribed
                                        ? "Notifikasi aktif di perangkat ini"
                                        : "Aktifkan untuk menerima notifikasi instan"}
                            </p>
                        </div>
                    </div>

                    {isSupported && (
                        <button
                            onClick={async () => {
                                if (isSubscribed) {
                                    const ok = await unsubscribe();
                                    if (ok) toast.success("Berhasil", "Notifikasi push dinonaktifkan");
                                } else {
                                    const ok = await subscribe();
                                    if (ok) toast.success("Berhasil", "Notifikasi push aktif!");
                                    else toast.error("Gagal", "Gagal mengaktifkan notifikasi. Pastikan izin diberikan.");
                                }
                            }}
                            disabled={isLoading}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95",
                                isSubscribed
                                    ? "bg-white text-red-500 border border-red-100 hover:bg-red-50"
                                    : "bg-amber-500 text-white shadow-md shadow-amber-500/20 hover:bg-amber-600"
                            )}
                        >
                            {isLoading ? "..." : (isSubscribed ? "MATIKAN" : "AKTIFKAN")}
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {[
                    { id: "dailyReport", label: "Laporan Harian", desc: "Ringkasan pengeluaran setiap sore" },
                    { id: "budgetAlert", label: "Peringatan Anggaran", desc: "Notif saat anggaran hampir habis" },
                    { id: "transactionUpdate", label: "Update Transaksi", desc: "Konfirmasi setelah mencatat transaksi" },
                    { id: "promoNews", label: "Berita Penting", desc: "Pengumuman penting muncul di icon notifikasi dashboard" }
                ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-200 transition-colors">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.label}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{item.desc}</p>
                        </div>
                        <button
                            onClick={() => setNotifToggles(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifToggles] }))}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors duration-300",
                                notifToggles[item.id as keyof typeof notifToggles] ? "bg-purple-500" : "bg-slate-200 dark:bg-slate-700"
                            )}
                        >
                            <motion.div
                                animate={{ x: notifToggles[item.id as keyof typeof notifToggles] ? 22 : 2 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                        </button>
                    </div>
                ))}
            </div>

            {/* Report Preferences Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl text-sky-600 dark:text-sky-400">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Laporan Keuangan</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Laporan bulanan dan mingguan</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Monthly Report Email */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">📧 Laporan Bulanan (Email)</p>
                            <p className="text-[10px] text-slate-500 font-medium">PDF lengkap via email setiap bulan</p>
                        </div>
                        <button
                            onClick={() => setReportPrefs(prev => ({ ...prev, monthlyReportEmail: !prev.monthlyReportEmail }))}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors duration-300",
                                reportPrefs.monthlyReportEmail ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
                            )}
                        >
                            <motion.div
                                animate={{ x: reportPrefs.monthlyReportEmail ? 22 : 2 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                        </button>
                    </div>

                    {/* Monthly Report Telegram */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">📱 Laporan Bulanan (Telegram)</p>
                            <p className="text-[10px] text-slate-500 font-medium">Summary via Telegram setiap bulan</p>
                        </div>
                        <button
                            onClick={() => setReportPrefs(prev => ({ ...prev, monthlyReportTelegram: !prev.monthlyReportTelegram }))}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors duration-300",
                                reportPrefs.monthlyReportTelegram ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
                            )}
                        >
                            <motion.div
                                animate={{ x: reportPrefs.monthlyReportTelegram ? 22 : 2 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                        </button>
                    </div>

                    {/* Weekly Insight Telegram */}
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">💡 Insight Mingguan (Telegram)</p>
                            <p className="text-[10px] text-slate-500 font-medium">Tips & analisis setiap minggu</p>
                        </div>
                        <button
                            onClick={() => setReportPrefs(prev => ({ ...prev, weeklyInsightTelegram: !prev.weeklyInsightTelegram }))}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors duration-300",
                                reportPrefs.weeklyInsightTelegram ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
                            )}
                        >
                            <motion.div
                                animate={{ x: reportPrefs.weeklyInsightTelegram ? 22 : 2 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                        </button>
                    </div>

                    {/* Language Selector */}
                    <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-800">
                        <p className="font-bold text-slate-900 dark:text-white text-sm mb-3">Bahasa Laporan</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "auto", label: "Auto" },
                                { value: "id", label: "Indonesia" },
                                { value: "en", label: "English" }
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setReportPrefs(prev => ({ ...prev, reportLocale: opt.value as any }))}
                                    className={cn(
                                        "py-2 px-3 rounded-xl text-xs font-bold transition-all",
                                        reportPrefs.reportLocale === opt.value
                                            ? "bg-sky-500 text-white shadow-md"
                                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-900/30"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
            >
                <Check size={20} strokeWidth={3} />
                SIMPAN NOTIFIKASI
            </button>
        </div>
    );
}
