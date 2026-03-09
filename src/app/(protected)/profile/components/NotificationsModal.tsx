"use client";

import { useState } from "react";
import { Check, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";

interface NotificationsModalProps {
    onClose: () => void;
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
    const toast = useToast();
    const [notifToggles, setNotifToggles] = useState({
        dailyReport: true,
        budgetAlert: true,
        transactionUpdate: true,
        promoNews: false
    });

    const handleSave = async () => {
        try {
            const res = await apiFetch("/api/user/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notifications: notifToggles }),
            });
            if (res.ok) {
                toast.success("Berhasil", "Preferensi notifikasi disimpan!");
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

            <div className="space-y-3">
                {[
                    { id: "dailyReport", label: "Laporan Harian", desc: "Ringkasan pengeluaran setiap sore" },
                    { id: "budgetAlert", label: "Peringatan Anggaran", desc: "Notif saat anggaran hampir habis" },
                    { id: "transactionUpdate", label: "Update Transaksi", desc: "Konfirmasi setelah mencatat transaksi" },
                    { id: "promoNews", label: "Berita & Promo", desc: "Update fitur dan penawaran sultan" }
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
