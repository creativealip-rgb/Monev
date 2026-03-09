"use client";

import { useState } from "react";
import { X, Check, MessageCircle, Key, Crown, CheckCircle2, LogOut } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { UserTier, canUseTelegram } from "@/lib/tier-gate";

interface IntegrationsModalProps {
    user: any;
    formData: any;
    setFormData: (data: any) => void;
    onClose: () => void;
    onSave: () => void;
    loadData: () => void;
}

export function IntegrationsModal({ user, formData, setFormData, onClose, onSave, loadData }: IntegrationsModalProps) {
    const toast = useToast();

    const handleDisconnectTelegram = async () => {
        if (confirm("Apakah Anda yakin ingin memutuskan koneksi Telegram?")) {
            const response = await apiFetch("/api/profile", {
                method: "POST",
                body: JSON.stringify({ type: "disconnectTelegram" })
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Berhasil", "Koneksi Telegram diputuskan.");
                loadData();
            } else {
                toast.error("Gagal", result.message || "Gagal memutuskan koneksi.");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className={cn(
                "p-6 rounded-[2rem] border transition-all relative overflow-hidden",
                canUseTelegram(user?.tier as UserTier)
                    ? "bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-90"
            )}>
                <div className="absolute top-4 right-4">
                    {user?.telegramId ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 size={10} />
                            Terhubung
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Terputus
                        </div>
                    )}
                </div>

                {!canUseTelegram(user?.tier as UserTier) && (
                    <div className="absolute inset-0 z-10 bg-white/60 dark:bg-slate-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-4 text-amber-500">
                            <Crown size={28} />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-tight">Khusus Paket Sultan 👑</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-5 max-w-[200px]">
                            Integrasi Telegram eksklusif untuk pengalaman finansial tanpa batas.
                        </p>
                        <Link
                            href="/fitur/upgrade"
                            className="px-6 py-2.5 bg-sky-500 text-white text-[12px] font-black rounded-xl shadow-lg shadow-sky-500/30 uppercase tracking-tighter active:scale-95 transition-all"
                        >
                            Upgrade Sekarang
                        </Link>
                    </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-xl shadow-sky-500/20">
                        <MessageCircle size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">Telegram Sidekick</h4>
                        <p className="text-xs text-sky-600 dark:text-sky-400 font-bold tracking-tight">@MonevappBot</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cara Menghubungkan:</p>
                    {[
                        { step: 1, text: "Buka Telegram & cari @MonevappBot" },
                        { step: 2, text: "Ketik /start lalu ketik /id" },
                        { step: 3, text: "Masukkan User ID Anda di bawah ini" }
                    ].map((item) => (
                        <div key={item.step} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
                                {item.step}
                            </div>
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.text}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-sky-900/30 p-4 shadow-sm">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">User ID Telegram</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formData.telegramId || ""}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, telegramId: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 font-mono text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            placeholder="Contoh: 123456789"
                        />
                    </div>
                    {user?.telegramId && (
                        <button
                            onClick={handleDisconnectTelegram}
                            className="w-full mt-3 py-2 text-rose-500 text-[11px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-colors border border-dashed border-rose-200 dark:border-rose-900/30"
                        >
                            Putuskan Koneksi
                        </button>
                    )}
                </div>

                <div className="mt-6">
                    <a
                        href="https://t.me/MonevappBot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                    >
                        <MessageCircle size={18} fill="currentColor" />
                        BUKA BOT TELEGRAM
                    </a>
                </div>
            </div>

            <div className="text-center">
                <a
                    href="https://t.me/MonevappBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-sky-200"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.509 1.793.997 3.592 1.48 5.388.16.36.506.494.864.498l-.002.018s.281.028.555-.038a2.1 2.1 0 0 0 .933-.517c.345-.324 1.28-1.244 1.811-1.764l3.999 2.952.032.018s.442.311 1.09.355c.324.037.75-.048 1.118-.308.58-.458 9.079-42.94 11.231-48.455.576-1.532-1.22-3.83-3.647-4.225" /></svg>
                    Buka Bot Telegram
                </a>
                <p className="text-[10px] text-slate-400 mt-2">
                    Klik tombol atau cari <span className="font-mono text-sky-600">@MonevappBot</span>
                </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 opacity-75">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <MessageCircle size={22} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">WhatsApp Bot</h4>
                        <div className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full inline-block">
                            COMING SOON
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Fitur integrasi via WhatsApp sedang dalam pengembangan. Nantikan update selanjutnya! 🚀
                </p>
            </div>

            <div className="flex flex-col gap-3 mt-4">
                <button
                    onClick={onSave}
                    className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
                >
                    <Check size={18} />
                    Simpan Integrasi
                </button>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}
