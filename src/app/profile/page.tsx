"use client";

import { ChevronLeft, Settings, CreditCard, LogOut, Bell, Shield, Moon, Wallet, X, Check, User as UserIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchProfileData, updateProfile, updateFinancialSettings, updateSecuritySettings } from "./actions";
import { cn } from "@/frontend/lib/utils";

const menuItems = [
    { id: "account", icon: UserIcon, label: "Pengaturan Akun", color: "blue", hasArrow: true },
    { id: "financial", icon: Wallet, label: "Konfigurasi Keuangan", color: "emerald", hasArrow: true },
    { id: "notifications", icon: Bell, label: "Notifikasi", color: "purple", hasArrow: true },
    { id: "integrations", icon: MessageCircle, label: "Integrasi Bot", color: "indigo", hasArrow: true },
    { id: "security", icon: Shield, label: "Keamanan", color: "amber", hasArrow: true },
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

    // Modals
    const [activeModal, setActiveModal] = useState<"account" | "financial" | "integrations" | "security" | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        whatsappId: "", // New Field
        hourlyRate: "",
        primaryGoalId: "",
        securityPin: "",
        isAppLockEnabled: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await fetchProfileData();
            setUser(data.user);
            setSettings(data.settings);
            setGoals(data.goals);

            if (data.user) {
                setFormData(prev => ({
                    ...prev,
                    firstName: data.user?.firstName || "",
                    lastName: data.user?.lastName || "",
                    username: data.user?.username || "",
                    whatsappId: data.user?.whatsappId || ""
                }));
            }

            if (data.settings) {
                setFormData(prev => ({
                    ...prev,
                    hourlyRate: data.settings.hourlyRate?.toString() || "",
                    primaryGoalId: data.settings.primaryGoalId?.toString() || "",
                    securityPin: data.settings.securityPin || "",
                    isAppLockEnabled: data.settings.isAppLockEnabled || false
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
        form.append("id", user.id.toString());
        form.append("telegramId", user.telegramId.toString());
        form.append("firstName", formData.firstName);
        form.append("lastName", formData.lastName);
        form.append("username", formData.username);
        form.append("whatsappId", formData.whatsappId); // Save Whatsapp ID

        await updateProfile(form);
        setActiveModal(null);
        loadData(); // Refresh
    };

    const handleSaveSettings = async () => {
        const form = new FormData();
        form.append("hourlyRate", formData.hourlyRate);
        form.append("primaryGoalId", formData.primaryGoalId);

        await updateFinancialSettings(form);
        setActiveModal(null);
        loadData(); // Refresh
    };

    const handleSaveSecurity = async () => {
        if (formData.isAppLockEnabled && !formData.securityPin) {
            alert("Harap atur PIN sebelum mengaktifkan App Lock.");
            return;
        }
        if (formData.securityPin && formData.securityPin.length !== 6) {
            alert("PIN harus 6 digit angka.");
            return;
        }

        const form = new FormData();
        form.append("securityPin", formData.securityPin);
        form.append("isAppLockEnabled", String(formData.isAppLockEnabled));

        await updateSecuritySettings(form);
        setActiveModal(null);
        loadData();
    };

    const getInitials = () => {
        if (!user) return "??";
        const first = user.firstName?.[0] || "";
        const last = user.lastName?.[0] || "";
        return (first + last).toUpperCase() || "WT"; // WT = Walet (placeholder)
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-50 pb-28">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pt-12 pb-8 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100"
            >
                {/* ... existing header content ... */}
                <div className="flex items-center gap-3 mb-8">
                    <Link
                        href="/"
                        className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Profil Saya</h1>
                </div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-600/30 flex items-center justify-center text-white text-2xl font-bold">
                            {getInitials()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Pengguna Baru"}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                            Free Tier
                        </span>
                        <span className="text-xs text-slate-400">@{user?.username || "username"}</span>
                    </div>
                </motion.div>
            </motion.header>

            {/* Menu Items */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-6 pt-6 space-y-3"
            >
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const colors: Record<string, { bg: string; text: string }> = {
                        blue: { bg: "bg-blue-50", text: "text-blue-600" },
                        emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
                        purple: { bg: "bg-purple-50", text: "text-purple-600" },
                        amber: { bg: "bg-amber-50", text: "text-amber-600" },
                        indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
                    };
                    const color = colors[item.color];

                    return (
                        <motion.button
                            key={index}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleMenuClick(item.id)}
                            className="w-full p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm group hover:border-blue-200 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", color.bg, color.text)}>
                                    <Icon size={20} strokeWidth={2} />
                                </div>
                                <span className="font-semibold text-slate-800">{item.label}</span>
                            </div>
                            {item.hasArrow && (
                                <ChevronLeft size={18} className="text-slate-300 rotate-180 group-hover:text-blue-400 transition-colors" />
                            )}
                        </motion.button>
                    );
                })}

                {/* Logout Button */}
                <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 bg-white rounded-2xl border border-rose-100 flex items-center gap-4 shadow-sm hover:bg-rose-50 hover:border-rose-200 transition-all mt-6"
                >
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <LogOut size={20} strokeWidth={2} />
                    </div>
                    <span className="font-semibold text-rose-500">Keluar</span>
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
                            className="fixed left-4 right-4 top-[15%] bg-white rounded-3xl p-6 z-50 shadow-2xl max-w-md mx-auto max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900">
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
                                    {/* ... existing account form ... */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Depan</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Nama Depan"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Belakang</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="Nama Belakang"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-slate-400">@</span>
                                            <input
                                                type="text"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
                                    >
                                        <Check size={18} />
                                        Simpan Perubahan
                                    </button>
                                </div>
                            ) : activeModal === "integrations" ? (
                                <div className="space-y-6">
                                    {/* Telegram Section */}
                                    <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.509 1.793.997 3.592 1.48 5.388.16.36.506.494.864.498l-.002.018s.281.028.555-.038a2.1 2.1 0 0 0 .933-.517c.345-.324 1.28-1.244 1.811-1.764l3.999 2.952.032.018s.442.311 1.09.355c.324.037.75-.048 1.118-.308.58-.458 9.079-42.94 11.231-48.455.576-1.532-1.22-3.83-3.647-4.225" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Telegram Bot</h4>
                                                <p className="text-xs text-sky-600 font-medium">@MonevappBot</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                            Terima notifikasi dan laporan harian langsung di Telegram Anda.
                                        </p>
                                        <div className="bg-white rounded-xl border border-sky-200 p-3 mb-3">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">User ID Anda</p>
                                            <p className="font-mono text-sm text-slate-700 select-all">{user?.telegramId || "-"}</p>
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
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-75">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
                                                <MessageCircle size={22} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">WhatsApp Bot</h4>
                                                <div className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full inline-block">
                                                    COMING SOON
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Fitur integrasi via WhatsApp sedang dalam pengembangan. Nantikan update selanjutnya! 🚀
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setActiveModal(null)}
                                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-colors mt-4"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            ) : activeModal === "security" ? (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                <Shield size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">App Lock</h4>
                                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                    Kunci aplikasi saat dibuka atau di-refresh. Gunakan PIN 6 digit untuk membuka.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">PIN Keamanan (6 Angka)</label>
                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={6}
                                            value={formData.securityPin}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, "");
                                                if (val.length <= 6) setFormData({ ...formData, securityPin: val });
                                            }}
                                            className="w-full text-center text-2xl font-bold tracking-[0.5em] py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                            placeholder="••••••"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-medium text-slate-700 text-sm">Aktifkan App Lock</span>
                                        <button
                                            onClick={() => setFormData({ ...formData, isAppLockEnabled: !formData.isAppLockEnabled })}
                                            className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${formData.isAppLockEnabled ? "bg-amber-500" : "bg-slate-300"}`}
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
                                    {/* ... existing financial settings form ... */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Gaji Per Jam (Hourly Rate)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3.5 text-slate-400">Rp</span>
                                            <input
                                                type="number"
                                                value={formData.hourlyRate}
                                                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                                placeholder="Contoh: 50000"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Digunakan untuk menghitung "Waktu Kerja vs Pengeluaran".</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Target Utama (Primary Goal)</label>
                                        <select
                                            value={formData.primaryGoalId}
                                            onChange={(e) => setFormData({ ...formData, primaryGoalId: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-white"
                                        >
                                            <option value="">-- Pilih Goal Utama --</option>
                                            {goals.map(goal => (
                                                <option key={goal.id} value={goal.id}>{goal.name}</option>
                                            ))}
                                        </select>
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

