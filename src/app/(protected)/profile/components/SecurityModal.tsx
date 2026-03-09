"use client";

import { useState } from "react";
import { X, Check, Shield, ShieldCheck, Lock, Zap, Fingerprint, Trash2, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { useSecurity } from "@/components/SecurityProvider";

interface SecurityModalProps {
    formData: any;
    setFormData: (data: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export function SecurityModal({ formData, setFormData, onClose, onSave }: SecurityModalProps) {
    const toast = useToast();
    const { deleteLocalData, reauthenticate } = useSecurity();

    const handleSaveSecurity = async () => {
        if (formData.isAppLockEnabled && !formData.securityPin) {
            toast.error("Validasi", "Harap atur PIN sebelum mengaktifkan App Lock.");
            return;
        }
        if (formData.securityPin && formData.securityPin.length !== 6) {
            toast.error("Validasi", "PIN harus 6 digit angka.");
            return;
        }

        await apiFetch("/api/profile", {
            method: "POST",
            body: JSON.stringify({
                type: "settings",
                securityPin: formData.securityPin,
                decoyPin: formData.decoyPin,
                isAppLockEnabled: formData.isAppLockEnabled,
                isBiometricEnabled: formData.isBiometricEnabled
            })
        });
        toast.success("Berhasil", "Pengaturan keamanan berhasil disimpan!");
        onSave();
    };

    const handleRevokeSessions = async () => {
        try {
            const res = await apiFetch("/api/profile/sessions", {
                method: "DELETE",
                body: JSON.stringify({ revokeAll: true }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                toast.success("Berhasil!", "Semua sesi lain telah diakhiri");
            } else {
                toast.error("Gagal", "Coba lagi nanti");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan");
        }
    };

    const handleDeleteAccount = async () => {
        const isVerified = await reauthenticate();
        if (!isVerified) return;

        const confirmText = window.prompt("Ketik 'HAPUS AKUN SAYA' untuk konfirmasi penghapusan:");
        if (!confirmText) return;
        
        try {
            const res = await apiFetch("/api/profile/delete", {
                method: "POST",
                body: JSON.stringify({ confirmText }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Permintaan diterima", data.message);
            } else {
                toast.error("Gagal", data.error);
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan");
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/10 rounded-[2.5rem] p-8 border border-amber-100 dark:border-amber-800/50 shadow-inner">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
                <div className="relative flex items-center gap-5">
                    <div className="p-4 bg-white dark:bg-amber-800/40 rounded-[1.5rem] text-amber-600 dark:text-amber-400 shadow-xl shadow-amber-500/10 ring-1 ring-amber-100 dark:ring-amber-700/50">
                        <Shield size={32} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-none">Proteksi Akun</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-bold leading-relaxed opacity-80">
                            Gunakan PIN 6 digit unik untuk mengunci akses ke dashboard utama Anda.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center py-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6">Masukkan 6 Digit PIN</p>
                <div className="relative flex gap-3 mb-8">
                    <input
                        type="tel"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.securityPin}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 6) {
                                setFormData((prev: any) => ({ ...prev, securityPin: val }));
                            }
                        }}
                        autoFocus
                        className="absolute inset-0 opacity-0 cursor-default"
                        style={{ fontSize: '16px' }}
                    />
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                        const digit = formData.securityPin[index];
                        const isActive = formData.securityPin.length === index;
                        return (
                            <motion.div
                                key={index}
                                whileHover={{ y: -2 }}
                                animate={digit ? { scale: [1, 1.15, 1], y: [0, -4, 0] } : isActive ? { borderColor: ['#f59e0b', '#fbbf24', '#f59e0b'] } : {}}
                                transition={{ duration: 0.3, repeat: isActive ? Infinity : 0 }}
                                className={cn(
                                    "w-12 h-16 rounded-[1.25rem] flex items-center justify-center border-2 transition-all duration-300 shadow-sm relative overflow-hidden",
                                    digit
                                        ? "bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/30"
                                        : isActive
                                            ? "bg-white dark:bg-slate-800 border-amber-400 ring-8 ring-amber-400/5"
                                            : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                )}
                            >
                                {digit && <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />}
                                <div className={cn(
                                    "w-3 h-3 rounded-full transition-all duration-300 shadow-sm",
                                    digit ? "bg-white scale-125" : "bg-slate-200 dark:bg-slate-700"
                                )} />
                            </motion.div>
                        );
                    })}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800/50 px-4 py-1.5 rounded-full">
                    PIN dienkripsi secara aman di server kami.
                </p>
            </div>

            <div className="p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-500">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Decoy PIN (Stealth Mode)</p>
                        <p className="text-[10px] text-slate-500 font-medium">Tunjukkan data palsu jika PIN ini digunakan.</p>
                    </div>
                </div>
                <div className="flex justify-center">
                    <div className="flex gap-2">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-8 h-10 rounded-lg border-2 flex items-center justify-center transition-all",
                                    formData.decoyPin[idx]
                                        ? "bg-rose-500 border-rose-500 shadow-md shadow-rose-500/20"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                )}
                            >
                                {formData.decoyPin[idx] && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                        ))}
                    </div>
                    <input
                        type="tel"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={6}
                        value={formData.decoyPin}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length <= 6) {
                                setFormData((prev: any) => ({ ...prev, decoyPin: val }));
                            }
                        }}
                        className="absolute opacity-0 w-full max-w-[200px] h-10 cursor-pointer"
                    />
                </div>
            </div>

            <div className="group flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-amber-200/50 dark:hover:border-amber-900/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-2xl transition-all duration-300",
                        formData.isAppLockEnabled ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white dark:bg-slate-800 text-slate-400"
                    )}>
                        <Lock size={18} />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 dark:text-white text-[13px] tracking-tight">Aktifkan App Lock</p>
                        <p className="text-[10px] text-slate-500 font-bold opacity-70">Minta PIN setiap kali membuka aplikasi</p>
                    </div>
                </div>
                <button
                    onClick={() => setFormData((prev: any) => ({ ...prev, isAppLockEnabled: !prev.isAppLockEnabled }))}
                    className={cn(
                        "relative w-14 h-7 rounded-full transition-all duration-500 p-1 shadow-inner",
                        formData.isAppLockEnabled ? "bg-amber-500 shadow-amber-900/20" : "bg-slate-200 dark:bg-slate-800"
                    )}
                >
                    <motion.div
                        animate={{ x: formData.isAppLockEnabled ? 28 : 0 }}
                        className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                    >
                        {formData.isAppLockEnabled && <div className="w-1 h-1 bg-amber-500 rounded-full" />}
                    </motion.div>
                </button>
            </div>

            <div className="group flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-sky-200/50 dark:hover:border-sky-900/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-2xl transition-all duration-300",
                        formData.isBiometricEnabled ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "bg-white dark:bg-slate-800 text-slate-400"
                    )}>
                        <Fingerprint size={18} />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 dark:text-white text-[13px] tracking-tight">Aktifkan Biometrik</p>
                        <p className="text-[10px] text-slate-500 font-bold opacity-70">Gunakan Sidik Jari/Wajah</p>
                    </div>
                </div>
                <button
                    onClick={() => setFormData((prev: any) => ({ ...prev, isBiometricEnabled: !prev.isBiometricEnabled }))}
                    className={cn(
                        "relative w-14 h-7 rounded-full transition-all duration-500 p-1 shadow-inner",
                        formData.isBiometricEnabled ? "bg-sky-500 shadow-sky-900/20" : "bg-slate-200 dark:bg-slate-800"
                    )}
                >
                    <motion.div
                        animate={{ x: formData.isBiometricEnabled ? 28 : 0 }}
                        className="w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                    >
                        {formData.isBiometricEnabled && <div className="w-1 h-1 bg-sky-500 rounded-full" />}
                    </motion.div>
                </button>
            </div>

            <div className="group flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-blue-200/50 dark:hover:border-blue-900/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400">
                        <Zap size={18} />
                    </div>
                    <div>
                        <p className="font-black text-slate-900 dark:text-white text-[13px] tracking-tight">Auto-lock Timeout</p>
                        <p className="text-[10px] text-slate-500 font-bold opacity-70">Kunci otomatis saat standby</p>
                    </div>
                </div>
                <select
                    value={formData.autoLockTimeout}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, autoLockTimeout: parseInt(e.target.value) }))}
                    className="bg-transparent text-sm font-black text-blue-600 focus:outline-none cursor-pointer"
                >
                    <option value={60000}>1 Menit</option>
                    <option value={300000}>5 Menit</option>
                    <option value={900000}>15 Menit</option>
                    <option value={3600000}>1 Jam</option>
                    <option value={-1}>Sultan (Never)</option>
                </select>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <button
                    onClick={() => {
                        if (confirm("Ingin menghapus data lokal? Kamu perlu login kembali.")) {
                            deleteLocalData();
                        }
                    }}
                    className="w-full py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Trash2 size={14} />
                    Hapus Data Lokal & Reset Sesi
                </button>
            </div>

            <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveSecurity}
                className={cn(
                    "w-full py-5 rounded-[2rem] font-black text-sm tracking-widest transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl overflow-hidden relative group",
                    formData.securityPin.length === 6
                        ? "bg-amber-500 text-white shadow-amber-500/30 ring-4 ring-amber-500/10"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div
                    animate={formData.securityPin.length === 6 ? { rotate: [0, 10, -10, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative z-10"
                >
                    <Check size={20} strokeWidth={3} />
                </motion.div>
                <span className="relative z-10">SIMPAN KEAMANAN</span>
            </motion.button>

            <div className="mt-6 space-y-3">
                <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Manajemen Sesi</h5>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Log out dari semua perangkat lain yang sedang aktif menggunakan akun kamu.</p>
                    <button
                        onClick={handleRevokeSessions}
                        className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                        <Shield size={15} />
                        Logout Semua Perangkat Lain
                    </button>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                <h5 className="text-[11px] font-black uppercase tracking-widest text-rose-500">Zona Bahaya</h5>
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 space-y-3">
                    <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                        Hapus akun dan semua data kamu secara permanen.
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={15} />
                        Hapus Akun
                    </button>
                </div>
            </div>
        </div>
    );
}
