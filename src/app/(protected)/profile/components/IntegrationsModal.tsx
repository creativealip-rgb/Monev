"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle2, LogOut, Crown, ExternalLink, Loader2 } from "lucide-react";
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
    const [isConnecting, setIsConnecting] = useState(false);
    const [isOpeningTelegram, setIsOpeningTelegram] = useState(false);

    const handleOpenTelegram = async () => {
        setIsOpeningTelegram(true);
        try {
            const response = await apiFetch("/api/profile/telegram-link");
            const result = await response.json();

            if (!result.success || !result.data?.url) {
                toast.error("Gagal", result.error || "Gagal membuka Telegram.");
                return;
            }

            window.location.href = result.data.url;
        } catch {
            toast.error("Gagal", "Terjadi kesalahan saat membuka Telegram.");
        } finally {
            setIsOpeningTelegram(false);
        }
    };

    const handleConnect = async () => {
        if (!formData.telegramId) {
            toast.error("Error", "Masukkan User ID Telegram Anda");
            return;
        }
        
        setIsConnecting(true);
        try {
            const response = await apiFetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "telegram",
                    telegramId: formData.telegramId,
                }),
            });
            const result = await response.json();
            
            if (result.success) {
                toast.success("Berhasil", "Telegram berhasil terhubung!");
                loadData();
            } else {
                toast.error("Gagal", result.message || "Gagal menghubungkan Telegram.");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan koneksi.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Putuskan koneksi Telegram?")) return;
        
        try {
            const response = await apiFetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "disconnectTelegram" }),
            });
            const result = await response.json();
            
            if (result.success) {
                toast.success("Berhasil", "Koneksi Telegram diputuskan.");
                setFormData((prev: any) => ({ ...prev, telegramId: "" }));
                loadData();
            }
        } catch {
            toast.error("Gagal", "Gagal memutuskan koneksi.");
        }
    };

    const isConnected = !!user?.telegramId;
    const canAccess = canUseTelegram(user?.tier as UserTier);

    return (
        <div className="space-y-4">
            {/* Telegram Integration */}
            <div className={cn(
                "p-4 rounded-xl border transition-all",
                isConnected 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800",
                !canAccess && "opacity-75"
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center text-white">
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">Telegram Bot</h4>
                            <p className="text-xs text-slate-500">@MonevappBot</p>
                        </div>
                    </div>
                    {isConnected ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 size={14} />
                            Terhubung
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400">Belum terhubung</span>
                    )}
                </div>

                {!canAccess ? (
                    <div className="text-center py-6">
                        <Crown size={32} className="text-amber-500 mx-auto mb-2" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Khusus Paket Sultan</p>
                        <p className="text-xs text-slate-500 mb-3">Upgrade untuk mengakses fitur ini</p>
                        <Link
                            href="/fitur/upgrade"
                            className="inline-block px-4 py-2 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 transition-colors"
                        >
                            Upgrade Sekarang
                        </Link>
                    </div>
                ) : isConnected ? (
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 mb-1">User ID</p>
                            <p className="font-mono text-sm font-medium">{user?.telegramId}</p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href="https://t.me/MonevappBot"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                Buka Bot
                                <ExternalLink size={14} />
                            </a>
                            <button
                                onClick={handleDisconnect}
                                className="px-4 py-2.5 text-rose-600 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/30"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                                <li>Klik tombol <span className="font-medium">Hubungkan Telegram</span></li>
                                <li>Telegram akan terbuka ke <span className="font-medium">@MonevappBot</span></li>
                                <li>Klik <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Start</span> / kirim <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">/start</span> untuk menghubungkan otomatis</li>
                            </ol>
                        </div>
                        <button
                            onClick={handleOpenTelegram}
                            disabled={isOpeningTelegram}
                            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {isOpeningTelegram ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Membuka Telegram...
                                </>
                            ) : (
                                <>
                                    Hubungkan Telegram
                                    <ExternalLink size={16} />
                                </>
                            )}
                        </button>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-[11px] text-slate-500 mb-2">Alternatif manual kalau deep link tidak terbuka:</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.telegramId || ""}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, telegramId: e.target.value }))}
                                    placeholder="Contoh: 123456789"
                                    className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                />
                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className="px-3 py-2 bg-slate-900 dark:bg-white disabled:opacity-50 text-white dark:text-slate-900 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                    {isConnecting ? <Loader2 size={14} className="animate-spin" /> : "Simpan ID"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* WhatsApp Coming Soon */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 opacity-60">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-900 dark:text-white text-sm">WhatsApp Bot</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                                Segera Hadir
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSave}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <CheckCircle2 size={18} />
                Simpan
            </motion.button>
        </div>
    );
}
