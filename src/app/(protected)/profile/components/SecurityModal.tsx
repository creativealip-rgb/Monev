"use client";

import { useState } from "react";
import { Check, Shield, Lock, Zap, Fingerprint, Trash2, Smartphone, Key, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { useSecurity } from "@/components/SecurityProvider";
import { isBiometricSupported } from "@/lib/biometric";

interface SecurityModalProps {
    formData: any;
    setFormData: (data: any) => void;
    onClose: () => void;
    onSave: () => void;
}

export function SecurityModal({ formData, setFormData, onSave }: SecurityModalProps) {
    const toast = useToast();
    const { reauthenticate } = useSecurity();
    const [showPinInput, setShowPinInput] = useState(false);
    
    // Change Password state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        showCurrent: false,
        showNew: false,
        showConfirm: false
    });
    
    // Sessions state
    const [showSessions, setShowSessions] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const handleSaveSecurity = async () => {
        if (formData.isAppLockEnabled && !formData.securityPin && !formData.hasSecurityPin) {
            toast.error("Validasi", "Harap atur PIN sebelum mengaktifkan App Lock.");
            return;
        }
        if (formData.securityPin && formData.securityPin.length !== 6) {
            toast.error("Validasi", "PIN harus 6 digit angka.");
            return;
        }

        await onSave();
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
                loadSessions(); // Refresh sessions list
            } else {
                toast.error("Gagal", "Coba lagi nanti");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan");
        }
    };

    const loadSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await apiFetch("/api/profile/sessions");
            const result = await res.json();
            if (result.success) {
                setSessions(result.sessions || result.data || []);
            }
        } catch {
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleRevokeSession = async (sessionId: string) => {
        try {
            const res = await apiFetch("/api/profile/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId })
            });
            if (res.ok) {
                toast.success("Berhasil!", "Sesi berhasil diakhiri");
                loadSessions();
            } else {
                toast.error("Gagal", "Coba lagi nanti");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan");
        }
    };

    const handleToggleBiometric = async () => {
        const nextValue = !formData.isBiometricEnabled;

        if (nextValue) {
            const supported = await isBiometricSupported();
            if (!supported) {
                toast.error("Tidak didukung", "Biometrik belum tersedia di browser/perangkat ini.");
                return;
            }
            if (!formData.isAppLockEnabled || (!formData.securityPin && !formData.hasSecurityPin)) {
                toast.error("PIN dibutuhkan", "Aktifkan Kunci Aplikasi dan atur PIN dulu sebelum biometrik.");
                return;
            }
        }

        setFormData((prev: any) => ({ ...prev, isBiometricEnabled: nextValue }));
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

    const handleChangePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error("Validasi", "Semua field password harus diisi!");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error("Validasi", "Password baru minimal 8 karakter!");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Validasi", "Password baru dan konfirmasi tidak cocok!");
            return;
        }

        try {
            const res = await apiFetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });
            const result = await res.json();
            
            if (result.success) {
                toast.success("Berhasil!", "Password berhasil diubah. Silakan login ulang.");
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                    showCurrent: false,
                    showNew: false,
                    showConfirm: false
                });
                setShowPasswordForm(false);
                setTimeout(() => {
                    window.location.href = "/login?changed=success";
                }, 1500);
            } else {
                toast.error("Gagal", result.error || "Password saat ini salah!");
            }
        } catch {
            toast.error("Gagal", "Terjadi kesalahan. Coba lagi nanti.");
        }
    };

    const canSaveSecurity = !formData.securityPin || formData.securityPin.length === 6;

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
            type="button"
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
                        if (!formData.isAppLockEnabled && !formData.securityPin && !formData.hasSecurityPin) {
                            setShowPinInput(true);
                        }
                        setFormData((prev: any) => ({ ...prev, isAppLockEnabled: !prev.isAppLockEnabled }));
                    }}
                />
            </SettingItem>

            {/* PIN Setup */}
            <SettingItem
                icon={Shield}
                title="Atur PIN"
                description={formData.securityPin || formData.hasSecurityPin ? "PIN sudah diatur" : "Belum diatur"}
                onClick={() => {
                    setShowPinInput(!showPinInput);
                }}
            >
                <span className="text-sm font-medium text-sky-600">
                    {formData.securityPin || formData.hasSecurityPin ? "Ubah" : "Atur"}
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
                    onChange={handleToggleBiometric}
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
                description="Lihat & logout dari perangkat lain"
                onClick={() => {
                    setShowSessions(!showSessions);
                    if (!showSessions) loadSessions();
                }}
            >
                <span className="text-sm font-medium text-sky-600">
                    {showSessions ? "Tutup" : "Kelola"}
                </span>
            </SettingItem>

            {/* Sessions List */}
            <AnimatePresence>
                {showSessions && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mx-1 mb-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Perangkat Aktif</p>
                                <button
            type="button"
                                    onClick={handleRevokeSessions}
                                    disabled={loadingSessions}
                                    className="text-xs font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
                                >
                                    {loadingSessions ? "Loading..." : "Logout Semua"}
                                </button>
                            </div>

                            {loadingSessions ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={20} className="animate-spin text-slate-400" />
                                    <span className="text-xs text-slate-500 ml-2">Memuat sesi...</span>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center py-8">
                                    <Smartphone size={32} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-500">Tidak ada sesi aktif lainnya</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sessions.map((session: any) => (
                                        <div
                                            key={session.id}
                                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                    {(session.deviceInfo || "").toLowerCase().includes("mobile") ? (
                                                        <Smartphone size={16} className="text-slate-600 dark:text-slate-400" />
                                                    ) : (
                                                        <span className="text-xs">PC</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-slate-900 dark:text-white">
                                                        {session.deviceInfo || 'Unknown Device'} {session.isCurrent ? '(Saat ini)' : ''}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {session.ipAddress || 'Unknown IP'} - {new Date(session.lastActiveAt || session.createdAt).toLocaleDateString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
            type="button"
                                                onClick={() => handleRevokeSession(session.id)}
                                                className="text-xs font-medium text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save Button */}
            <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveSecurity}
                disabled={!canSaveSecurity}
                className={cn(
                    "w-full mt-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                    canSaveSecurity
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                )}
            >
                <Check size={18} />
                Simpan Pengaturan
            </motion.button>

            {/* Change Password Section */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Key size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">Ubah Password</p>
                            <p className="text-xs text-slate-500">Ganti password akun Anda</p>
                        </div>
                    </div>
                    <button
            type="button"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    >
                        {showPasswordForm ? "Batal" : "Ubah"}
                    </button>
                </div>

                <AnimatePresence>
                    {showPasswordForm && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password Saat Ini</label>
                                    <div className="relative">
                                        <input
                                            type={passwordData.showCurrent ? "text" : "password"}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                            placeholder="Masukkan password saat ini"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPasswordData(prev => ({ ...prev, showCurrent: !prev.showCurrent }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {passwordData.showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password Baru</label>
                                    <div className="relative">
                                        <input
                                            type={passwordData.showNew ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                                            placeholder="Minimal 8 karakter"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPasswordData(prev => ({ ...prev, showNew: !prev.showNew }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {passwordData.showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Password Baru</label>
                                    <div className="relative">
                                        <input
                                            type={passwordData.showConfirm ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                            className={cn(
                                                "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm",
                                                passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                                                    ? "border-red-400 focus:border-red-500"
                                                    : "border-slate-200 dark:border-slate-700"
                                            )}
                                            placeholder="Ulangi password baru"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPasswordData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {passwordData.showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Strength Indicator */}
                                {passwordData.newPassword && (
                                    <div className="pt-2">
                                        <div className="flex gap-1 h-1 mb-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={cn(
                                                        "flex-1 rounded-full transition-all",
                                                        passwordData.newPassword.length >= level * 2
                                                            ? passwordData.newPassword.length >= 8
                                                                ? "bg-emerald-500"
                                                                : "bg-yellow-500"
                                                            : "bg-slate-200 dark:bg-slate-700"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <p className={cn(
                                            "text-[10px] font-medium",
                                            passwordData.newPassword.length >= 8
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-slate-500"
                                        )}>
                                            {passwordData.newPassword.length >= 8
                                                ? "Password kuat"
                                                : `Minimal 8 karakter (${passwordData.newPassword.length}/${8})`}
                                        </p>
                                    </div>
                                )}

                                {/* Save Button */}
                                <button
            type="button"
                                    onClick={handleChangePassword}
                                    disabled={!passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword.length < 8}
                                    className={cn(
                                        "w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                                        passwordData.currentPassword && passwordData.newPassword.length >= 8 && passwordData.newPassword === passwordData.confirmPassword
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    <Key size={16} />
                                    Ubah Password
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
