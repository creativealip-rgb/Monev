"use client";

import { useState } from "react";
import { Check, Shield, Lock, Zap, Fingerprint, Trash2, LogOut, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    const [showPinInput, setShowPinInput] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

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
                isBiometricEnabled: formData.isBiometricEnabled,
                autoLockTimeout: formData.autoLockTimeout
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

    const formatTimeout = (ms: number) => {
        if (ms === -1) return "Tidak pernah";
        if (ms < 60000) return `${ms / 1000} detik`;
        if (ms < 3600000) return `${ms / 60000} menit`;
        return `${ms / 3600000} jam`;
    };

    const SettingItem = ({ 
        icon: Icon, 
        title, 
        description, 
        children,
        onClick,
        danger
    }: { 
        icon: any, 
        title: string, 
        description: string, 
        children?: React.ReactNode,
        onClick?: () => void,
        danger?: boolean
    }) => (
        <div 
            className={cn(
                "flex items-center justify-between py-4 px-1 border-b border-slate-100 dark:border-slate-800 last:border-0",
                onClick && "cursor-pointer"
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    danger ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}>
                    <Icon size={20} />
                </div>
                <div>
                    <p className={cn(
                        "font-semibold text-sm",
                        danger ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                    )}>{title}</p>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
            className={cn(
                "relative w-12 h-6 rounded-full transition-colors p-1",
                checked ? "bg-sky-500" : "bg-slate-200 dark:bg-slate-700"
            )}
        >
            <motion.div
                animate={{ x: checked ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow"
            />
        </button>
    );

    return (
        <div className="space-y-2">
            {/* App Lock */}
            <SettingItem
                icon={Lock}
                title="Kunci Aplikasi"
                description="PIN saat membuka aplikasi"
            >
                <Toggle 
                    checked={formData.isAppLockEnabled} 
                    onChange={() => {
                        if (!formData.isAppLockEnabled && !formData.securityPin) {
                            setShowPinInput(true);
                            setActiveSection("pin");
                        }
                        setFormData((prev: any) => ({ ...prev, isAppLockEnabled: !prev.isAppLockEnabled }));
                    }}
                />
            </SettingItem>

            {/* PIN Setup */}
            <SettingItem
                icon={Shield}
                title="Atur PIN"
                description={formData.securityPin ? "PIN sudah diatur" : "Belum diatur"}
                onClick={() => {
                    setShowPinInput(!showPinInput);
                    setActiveSection(showPinInput ? null : "pin");
                }}
            >
                <span className="text-sm font-medium text-sky-600">
                    {formData.securityPin ? "Ubah" : "Atur"}
                </span>
            </SettingItem>

            <AnimatePresence>
                {showPinInput && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mx-1 mb-4">
                            <p className="text-xs font-medium text-slate-500 mb-3 text-center">Masukkan 6 digit PIN</p>
                            <div className="flex justify-center gap-2 mb-4">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-10 h-12 rounded-lg border-2 flex items-center justify-center transition-all",
                                            formData.securityPin[i]
                                                ? "bg-sky-500 border-sky-500"
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        )}
                                    >
                                        {formData.securityPin[i] && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                ))}
                            </div>
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={6}
                                value={formData.securityPin}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    if (val.length <= 6) {
                                        setFormData((prev: any) => ({ ...prev, securityPin: val }));
                                    }
                                }}
                                className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                style={{ position: 'relative', height: '1px', width: '1px', margin: '-1px' }}
                                autoFocus
                            />
                            
                            {/* Decoy PIN */}
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <p className="text-xs font-medium text-slate-500 mb-2">PIN Palsu (Opsional)</p>
                                <p className="text-[10px] text-slate-400 mb-2">Tampilkan data palsu jika PIN ini digunakan</p>
                                <div className="flex justify-center gap-2">
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-8 h-10 rounded-lg border-2 flex items-center justify-center",
                                                formData.decoyPin[i]
                                                    ? "bg-rose-400 border-rose-400"
                                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            {formData.decoyPin[i] && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                    ))}
                                </div>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={formData.decoyPin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        if (val.length <= 6) {
                                            setFormData((prev: any) => ({ ...prev, decoyPin: val }));
                                        }
                                    }}
                                    className="absolute opacity-0"
                                    style={{ position: 'relative', height: '1px', width: '1px', margin: '-1px' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Biometric */}
            <SettingItem
                icon={Fingerprint}
                title="Sidik Jari / Wajah"
                description="Login dengan biometrik"
            >
                <Toggle 
                    checked={formData.isBiometricEnabled} 
                    onChange={() => setFormData((prev: any) => ({ ...prev, isBiometricEnabled: !prev.isBiometricEnabled }))}
                />
            </SettingItem>

            {/* Auto-lock */}
            <SettingItem
                icon={Zap}
                title="Kunci Otomatis"
                description="Kunci setelah tidak aktif"
            >
                <select
                    value={formData.autoLockTimeout}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, autoLockTimeout: parseInt(e.target.value) }))}
                    className="bg-transparent text-sm font-medium text-sky-600 focus:outline-none cursor-pointer"
                >
                    <option value={60000}>1 menit</option>
                    <option value={300000}>5 menit</option>
                    <option value={900000}>15 menit</option>
                    <option value={3600000}>1 jam</option>
                    <option value={-1}>Tidak pernah</option>
                </select>
            </SettingItem>

            {/* Sessions */}
            <SettingItem
                icon={Smartphone}
                title="Kelola Sesi"
                description="Logout dari perangkat lain"
                onClick={handleRevokeSessions}
            >
                <LogOut size={18} className="text-slate-400" />
            </SettingItem>

            {/* Save Button */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveSecurity}
                disabled={formData.securityPin && formData.securityPin.length !== 6}
                className={cn(
                    "w-full mt-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                    formData.securityPin && formData.securityPin.length === 6
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                )}
            >
                <Check size={18} />
                Simpan Pengaturan
            </motion.button>

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t-2 border-rose-100 dark:border-rose-900/30">
                <p className="text-xs font-semibold text-rose-500 mb-2">Zona Bahaya</p>
                <SettingItem
                    icon={Trash2}
                    title="Hapus Akun"
                    description="Hapus akun dan data secara permanen"
                    danger
                    onClick={handleDeleteAccount}
                />
            </div>
        </div>
    );
}
