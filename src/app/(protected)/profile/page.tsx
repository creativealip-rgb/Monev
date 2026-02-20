"use client";

import {
    ChevronLeft, LogOut, Bell, Shield, Moon, Wallet, X, Check,
    User as UserIcon, MessageCircle, Smartphone, Crown,
    CheckCircle2, Copy, AlertCircle, ArrowLeft, Key, Zap, Info, Lock, Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    fetchProfileData, updateProfile, updateFinancialSettings,
    updateSecuritySettings, disconnectTelegram
} from "./actions";
import { serverSignOut } from "@/app/actions/auth";
import { cn } from "@/frontend/lib/utils";
import { ThemeToggleSwitch } from "@/frontend/components/ThemeToggle";
import { useToast } from "@/frontend/components/UI";
import { UserTier, canUseTelegram } from "@/lib/tier-gate";
import { useSession } from "next-auth/react";

const TIER_STYLES: Record<UserTier, { label: string; color: string; bg: string; icon: any; border: string }> = {
    miskin: { label: "Miskin", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: Zap },
    kaya: { label: "Kaya", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-100 dark:border-sky-800", icon: Sparkles },
    sultan: { label: "Sultan", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800", icon: Crown },
};

const menuItems = [
    { id: "account", icon: UserIcon, label: "Pengaturan Akun", color: "blue", hasArrow: true },
    { id: "financial", icon: Wallet, label: "Konfigurasi Keuangan", color: "emerald", hasArrow: true },
    { id: "notifications", icon: Bell, label: "Notifikasi", color: "purple", hasArrow: true },
    { id: "integrations", icon: MessageCircle, label: "Integrasi Bot", color: "indigo", hasArrow: true },
    { id: "security", icon: Shield, label: "Keamanan", color: "amber", hasArrow: true },
    { id: "download", icon: Smartphone, label: "Download Aplikasi Android", color: "sky", hasArrow: true, isDownload: true },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Modals
    const [activeModal, setActiveModal] = useState<"account" | "financial" | "integrations" | "security" | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        whatsappId: "", // New Field
        telegramId: "", // New Field
        hourlyRate: "",
        primaryGoalId: "",
        securityPin: "",
        isAppLockEnabled: false,
        hideBalance: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchProfileData();
            if (data) {
                setUser(data.user);
                setSettings(data.settings);
                setGoals(data.goals);
            }

            if (data?.user) {
                setFormData(prev => ({
                    ...prev,
                    firstName: data.user?.firstName || "",
                    lastName: data.user?.lastName || "",
                    username: data.user?.username || "",
                    whatsappId: data.user?.whatsappId || "",
                    telegramId: data.user?.telegramId?.toString() || ""
                }));
            }

            if (data?.settings) {
                setFormData(prev => ({
                    ...prev,
                    hourlyRate: data.settings.hourlyRate?.toString() || "",
                    primaryGoalId: data.settings.primaryGoalId?.toString() || "",
                    // Don't load existing PIN for security - user must enter new one
                    securityPin: "",
                    isAppLockEnabled: data.settings.isAppLockEnabled || false,
                    hideBalance: data.settings.hideBalance || false
                }));
            }

            setLoading(false);
        } catch (error) {
            console.error("Failed to load profile data:", error);
            setLoading(false);
        }
    };

    const handleMenuClick = (id: string) => {
        if (id === "account" || id === "financial" || id === "integrations") {
            setActiveModal(id as any);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        const form = new FormData();
        // form.append("id", user.id.toString()); // Not needed for updateProfile action as it uses session
        form.append("firstName", formData.firstName);
        form.append("lastName", formData.lastName);
        form.append("username", formData.username);
        form.append("whatsappId", formData.whatsappId);
        form.append("telegramId", formData.telegramId);

        const result = await updateProfile(form);

        if (result.success) {
            setActiveModal(null);
            toast.success("Berhasil", "Profil berhasil disimpan!");
            loadData(); // Refresh data without page reload
        } else {
            toast.error("Gagal", result.message || "Gagal menyimpan profil.");
        }
    };

    const handleSaveSettings = async () => {
        const form = new FormData();
        form.append("hourlyRate", formData.hourlyRate);
        form.append("primaryGoalId", formData.primaryGoalId);
        form.append("hideBalance", String(formData.hideBalance)); // New: Append hideBalance

        await updateFinancialSettings(form);
        toast.success("Berhasil", "Pengaturan keuangan berhasil disimpan!");
        setActiveModal(null);
        loadData(); // Refresh
    };

    const handleSaveSecurity = async () => {
        if (formData.isAppLockEnabled && !formData.securityPin) {
            toast.error("Validasi", "Harap atur PIN sebelum mengaktifkan App Lock.");
            return;
        }
        if (formData.securityPin && formData.securityPin.length !== 6) {
            toast.error("Validasi", "PIN harus 6 digit angka.");
            return;
        }

        const form = new FormData();
        form.append("securityPin", formData.securityPin);
        form.append("isAppLockEnabled", String(formData.isAppLockEnabled));

        await updateSecuritySettings(form);
        toast.success("Berhasil", "Pengaturan keamanan berhasil disimpan!");
        setActiveModal(null);
        loadData();
    };

    const getInitials = () => {
        if (!user) return "??";
        if (user.name) {
            const parts = user.name.split(" ");
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return parts[0][0].toUpperCase();
        }
        const first = user.firstName?.[0] || "";
        const last = user.lastName?.[0] || "";
        return (first + last).toUpperCase() || "WT"; // WT = Walet (placeholder)
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-24">
            {/* Premium Header Profile Card */}
            <div className="relative bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-700 pb-10 pt-safe pt-3 px-6 rounded-b-[3rem] shadow-2xl overflow-hidden z-10">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-400/30 rounded-full blur-3xl mix-blend-overlay" />
                    <div className="absolute top-1/2 -right-24 w-64 h-64 bg-cyan-400/30 rounded-full blur-3xl mix-blend-overlay" />
                </div>

                {/* Top Action Bar */}
                <div className="relative flex items-center justify-between mt-2 mb-6 z-10">
                    <Link
                        href="/"
                        className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
                    >
                        <ChevronLeft size={16} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-sm font-bold text-white/90 tracking-tight">Profil Saya</h1>
                    <div className="w-7" /> {/* Spacer for balance */}
                </div>

                {/* Profile Info */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center relative z-10"
                >
                    <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
                            {user?.image ? (
                                <img src={user.image} alt={user.firstName || "Profile"} className="w-full h-full object-cover" />
                            ) : (
                                getInitials()
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-[2.5px] border-sky-600 flex items-center justify-center shadow-lg">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>

                    <h2 className="text-lg font-bold tracking-tight text-white mb-0.5">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Pengguna Baru"}
                    </h2>

                    <span className="text-indigo-200/80 text-[11px] font-bold tracking-widest uppercase mb-4">
                        @{user?.username || "username"}
                    </span>

                    <div className="flex flex-col items-center gap-3">
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-sm",
                            user?.tier === "kaya" ? "bg-sky-500/20 border-sky-400" :
                                user?.tier === "sultan" ? "bg-amber-500/20 border-amber-400" :
                                    "bg-white/10 border-white/10"
                        )}>
                            {(() => {
                                const tier = (user?.tier || "miskin") as UserTier;
                                const tierStyle = TIER_STYLES[tier];
                                const Icon = tierStyle.icon;
                                return (
                                    <>
                                        <Icon size={12} className={tier === "miskin" ? "text-white" : tierStyle.color} />
                                        <span className="text-[10px] font-bold text-white tracking-widest uppercase">{tierStyle.label} Tier</span>
                                    </>
                                );
                            })()}
                        </div>

                        {user?.tier === "miskin" && (
                            <Link
                                href="/fitur/upgrade"
                                className="flex items-center gap-2 px-6 py-2 bg-white text-sky-600 rounded-2xl text-xs font-black shadow-xl shadow-sky-950/20 active:scale-95 transition-all"
                            >
                                <Sparkles size={14} fill="currentColor" />
                                UPGRADE KE KAYA
                            </Link>
                        )}
                        {user?.tier === "kaya" && (
                            <Link
                                href="/fitur/upgrade"
                                className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-amber-950/20 active:scale-95 transition-all"
                            >
                                <Crown size={14} fill="currentColor" />
                                JADI SULTAN
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Menu Items */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 pt-6 space-y-3"
            >
                {/* Theme Toggle Card */}
                <motion.div
                    variants={itemVariants}
                    className="card-clean p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <Moon size={20} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">Mode Gelap</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Ubah tampilan aplikasi</p>
                        </div>
                    </div>
                    <ThemeToggleSwitch />
                </motion.div>

                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const colors: Record<string, { bg: string; text: string }> = {
                        blue: { bg: "bg-blue-50", text: "text-blue-600" },
                        emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
                        purple: { bg: "bg-purple-50", text: "text-purple-600" },
                        amber: { bg: "bg-amber-50", text: "text-amber-600" },
                        indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
                        sky: { bg: "bg-sky-50", text: "text-sky-600" },
                    };
                    const color = colors[item.color];

                    if (item.id === "download") {
                        return (
                            <motion.a
                                key={index}
                                href="/monev-app.apk"
                                download="monev-app.apk"
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full p-4 card-clean flex items-center justify-between group hover:border-sky-300/50 hover:shadow-md transition-all no-underline"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", color.bg, color.text)}>
                                        <Icon size={18} strokeWidth={2.5} />
                                    </div>
                                    <span className="font-bold text-[13px] text-slate-700 dark:text-slate-200 tracking-tight">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-sky-500 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100 uppercase tracking-tighter">APK</span>
                                    <ChevronLeft size={16} className="text-slate-300 rotate-180 group-hover:text-sky-400 transition-colors" />
                                </div>
                            </motion.a>
                        );
                    }

                    return (
                        <motion.button
                            key={index}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleMenuClick(item.id)}
                            className="w-full p-4 card-clean flex items-center justify-between group hover:border-sky-300/50 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", color.bg, color.text)}>
                                    <Icon size={18} strokeWidth={2.5} />
                                </div>
                                <span className="font-bold text-[13px] text-slate-700 dark:text-slate-200 tracking-tight">{item.label}</span>
                            </div>
                            {item.hasArrow && (
                                <ChevronLeft size={16} className="text-slate-300 rotate-180 group-hover:text-sky-400 transition-colors" />
                            )}
                        </motion.button>
                    );
                })}

                {/* Logout Button */}
                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => serverSignOut()}
                    className="w-full p-4 card-clean border-rose-200/50 flex items-center gap-4 hover:bg-rose-500/10 hover:border-rose-300/50 transition-all mt-6"
                >
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <LogOut size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-[13px] text-rose-500 dark:text-rose-400 tracking-tight">Keluar</span>
                </motion.button>
            </motion.div>

            {/* Version */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-8"
            >
                <p className="text-xs text-slate-400">Monev v1.0.0</p>
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {activeModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setActiveModal(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-4 right-4 top-[15%] bg-white dark:bg-slate-900 rounded-3xl p-6 z-50 shadow-2xl max-w-md mx-auto max-h-[80vh] overflow-y-auto border border-transparent dark:border-slate-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {activeModal === "account" ? "Edit Profil" :
                                        activeModal === "integrations" ? "Integrasi Bot" :
                                            activeModal === "security" ? "Keamanan Aplikasi" :
                                                "Konfigurasi Keuangan"}
                                </h3>
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {activeModal === "account" ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Depan</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                            placeholder="Nama Depan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Belakang</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                            placeholder="Nama Belakang"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-slate-400">@</span>
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>

                                    {/* Currency & Language Settings */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Preferensi Regional</p>

                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Currency Picker */}
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Mata Uang</label>
                                                <select
                                                    value={typeof window !== "undefined" ? (localStorage.getItem("monev_currency") || "IDR") : "IDR"}
                                                    onChange={(e) => {
                                                        localStorage.setItem("monev_currency", e.target.value);
                                                        window.dispatchEvent(new Event("storage"));
                                                        toast.success("✓", `Mata uang diubah ke ${e.target.value}`);
                                                    }}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="IDR">🇮🇩 IDR</option>
                                                    <option value="USD">🇺🇸 USD</option>
                                                    <option value="EUR">🇪🇺 EUR</option>
                                                    <option value="SGD">🇸🇬 SGD</option>
                                                    <option value="MYR">🇲🇾 MYR</option>
                                                </select>
                                            </div>

                                            {/* Language Picker */}
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Bahasa</label>
                                                <select
                                                    value={typeof window !== "undefined" ? (localStorage.getItem("monev_language") || "id") : "id"}
                                                    onChange={(e) => {
                                                        localStorage.setItem("monev_language", e.target.value);
                                                        window.dispatchEvent(new Event("storage"));
                                                        toast.success("✓", `Bahasa diubah ke ${e.target.value === "id" ? "Indonesia" : "English"}`);
                                                    }}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="id">🇮🇩 Indonesia</option>
                                                    <option value="en">🇬🇧 English</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveProfile}
                                        className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Check size={18} />
                                        Simpan Perubahan
                                    </button>
                                </div>
                            ) : activeModal === "integrations" ? (
                                <div className="space-y-6">
                                    {/* Telegram Section */}
                                    <div className={cn(
                                        "p-4 rounded-2xl border transition-all relative overflow-hidden",
                                        canUseTelegram(user?.tier as UserTier)
                                            ? "bg-sky-50 border-sky-100 dark:bg-sky-900/20 dark:border-sky-800"
                                            : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 opacity-90"
                                    )}>
                                        {!canUseTelegram(user?.tier as UserTier) && (
                                            <div className="absolute inset-0 z-10 bg-white/40 dark:bg-slate-900/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-2">
                                                    <Lock size={18} className="text-slate-400" />
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-900 dark:text-white mb-1">Fitur Khusus Sultan 👑</p>
                                                <Link
                                                    href="/fitur/upgrade"
                                                    className="text-[10px] font-black text-sky-600 dark:text-sky-500 underline uppercase tracking-tighter"
                                                >
                                                    Upgrade Sekarang
                                                </Link>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.509 1.793.997 3.592 1.48 5.388.16.36.506.494.864.498l-.002.018s.281.028.555-.038a2.1 2.1 0 0 0 .933-.517c.345-.324 1.28-1.244 1.811-1.764l3.999 2.952.032.018s.442.311 1.09.355c.324.037.75-.048 1.118-.308.58-.458 9.079-42.94 11.231-48.455.576-1.532-1.22-3.83-3.647-4.225" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200">Telegram Bot</h4>
                                                <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">@MonevappBot</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                                            Terima notifikasi dan laporan harian langsung di Telegram Anda.
                                        </p>
                                        <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-sky-200 dark:border-sky-900/50 p-3 mb-3">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">User ID Anda</p>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500">(Ketik /id di bot)</span>
                                            </div>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={formData.telegramId || ""}
                                                onChange={(e) => setFormData(prev => ({ ...prev, telegramId: e.target.value }))}
                                                className="w-full font-mono text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                                placeholder="Contoh: 123456789"
                                            />
                                            {formData.telegramId && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Apakah Anda yakin ingin memutuskan koneksi Telegram?")) {
                                                            const result = await disconnectTelegram();
                                                            if (result.success) {
                                                                toast.success("Berhasil", "Koneksi Telegram berhasil diputuskan.");
                                                                loadData(); // Refresh data without page reload
                                                            } else {
                                                                toast.error("Gagal", result.message || "Gagal memutuskan koneksi.");
                                                            }
                                                        }
                                                    }}
                                                    className="w-full mt-2 py-1.5 bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors"
                                                >
                                                    Putuskan Koneksi
                                                </button>
                                            )}
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
                                    </div>

                                    {/* WhatsApp Section */}
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
                                            onClick={handleSaveProfile}
                                            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky-200"
                                        >
                                            <Check size={18} />
                                            Simpan Integrasi
                                        </button>
                                        <button
                                            onClick={() => setActiveModal(null)}
                                            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </div>
                            ) : activeModal === "security" ? (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/50">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                                                <Shield size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">App Lock</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                    Kunci aplikasi saat dibuka atau di-refresh. Gunakan PIN 6 digit untuk membuka.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PIN Keamanan (6 Angka)</label>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            value={formData.securityPin}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, "");
                                                if (val.length <= 6) setFormData(prev => ({ ...prev, securityPin: val }));
                                            }}
                                            className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                            placeholder="••••••"
                                        />
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">
                                            PIN dienkripsi untuk keamanan. Masukkan PIN baru untuk mengubah.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">Aktifkan App Lock</span>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, isAppLockEnabled: !prev.isAppLockEnabled }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${formData.isAppLockEnabled ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                        >
                                            <span
                                                className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${formData.isAppLockEnabled ? "translate-x-6" : "translate-x-0"}`}
                                            />
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleSaveSecurity}
                                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} />
                                        Simpan Pengaturan Keamanan
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gaji Per Jam (Hourly Rate)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500">Rp</span>
                                            <input
                                                type="number"
                                                value={formData.hourlyRate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                                placeholder="Contoh: 50000"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Digunakan untuk menghitung "Waktu Kerja vs Pengeluaran".</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Utama (Primary Goal)</label>
                                        <select
                                            value={formData.primaryGoalId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, primaryGoalId: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
                                        >
                                            <option value="">-- Pilih Goal Utama --</option>
                                            {goals.map(goal => (
                                                <option key={goal.id} value={goal.id}>{goal.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* New: Hide Balance Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">Sembunyikan Saldo</span>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, hideBalance: !prev.hideBalance }))}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${formData.hideBalance ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                        >
                                            <span
                                                className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${formData.hideBalance ? "translate-x-6" : "translate-x-0"}`}
                                            />
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleSaveSettings}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Check size={18} />
                                        Simpan Pengaturan
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

