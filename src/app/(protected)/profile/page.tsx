"use client";

import {
    ChevronLeft, ChevronRight, LogOut, Bell, Shield, Moon, Wallet, X, Check, Globe,
    User as UserIcon, MessageCircle, Smartphone, Crown, ShieldCheck, Database, FileJson, FileSpreadsheet, Upload,
    CheckCircle2, Copy, AlertCircle, ArrowLeft, Key, Zap, Info, Lock, Sparkles, Fingerprint, Trophy, Flame, Download,
    Tag, Plus, Trash2
} from "lucide-react";
import { LanguageSelector } from "@/frontend/components/LanguageSelector";
import { useI18n } from "@/frontend/lib/i18n-context";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { apiFetch } from "@/frontend/lib/api-client";
import { signOut } from "next-auth/react";
import { cn } from "@/frontend/lib/utils";
import { ThemeToggleSwitch } from "@/frontend/components/ThemeToggle";
import { useToast } from "@/frontend/components/UI";
import { Portal } from "@/frontend/components/Portal";
import { UserTier, canUseTelegram } from "@/lib/tier-gate";
import { useSession } from "next-auth/react";
import { useSecurity } from "@/components/SecurityProvider";

const TIER_STYLES: Record<UserTier, { label: string; color: string; bg: string; icon: any; border: string }> = {
    miskin: { label: "Miskin", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: Zap },
    kaya: { label: "Kaya", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-100 dark:border-sky-800", icon: Sparkles },
    sultan: { label: "Sultan", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800", icon: Crown },
};

const menuItems = [
    { id: "account", icon: UserIcon, label: "Pengaturan Akun", color: "blue", hasArrow: true },
    { id: "financial", icon: Wallet, label: "Konfigurasi Keuangan", color: "emerald", hasArrow: true },
    { id: "categories", icon: Tag, label: "Kategori Custom", color: "pink", hasArrow: true },
    { id: "notifications", icon: Bell, label: "Notifikasi", color: "purple", hasArrow: true },
    { id: "integrations", icon: MessageCircle, label: "Integrasi Bot", color: "indigo", hasArrow: true },
    { id: "security", icon: Shield, label: "Keamanan", color: "amber", hasArrow: true },
    { id: "export", icon: Database, label: "Data & Backup", color: "sky", hasArrow: true },
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

const ALL_BADGES = [
    { type: "first_tx", name: "Pencatat Pemula", description: "Mencatat transaksi pertama kali! 📝", icon: "📝" },
    { type: "streak_3", name: "Semangat 3 Hari", description: "Catat transaksi 3 hari berturut-turut! 🔥", icon: "🔥" },
    { type: "streak_7", name: "Petarung Mingguan", description: "7 hari tanpa putus! Hebat Bos! 🛡️", icon: "🛡️" },
    { type: "streak_30", name: "Legenda Finansial", description: "Sebulan penuh konsistensi! Sultan bangga. 👑", icon: "👑" },
    { type: "first_goal", name: "Pemimpi Cerdas", description: "Membuat target tabungan pertama. 🎯", icon: "🎯" },
    { type: "goal_reached", name: "Sang Pemenang", description: "Berhasil mencapai target tabungan! 🏆", icon: "🏆" },
    { type: "first_invest", name: "Investor Muda", description: "Melakukan investasi pertama kali. 📈", icon: "📈" },
];

export default function ProfilePage() {
    const { data: session } = useSession();
    const { t } = useI18n();
    const [user, setUser] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [streak, setStreak] = useState<any>(null);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { isStealthMode, toggleStealth, reauthenticate, deleteLocalData, autoLockTimeout } = useSecurity();
    const toast = useToast();

    // Modals
    const [activeModal, setActiveModal] = useState<"account" | "financial" | "integrations" | "security" | "notifications" | "collection" | "categories" | "export" | null>(null);

    // Notification toggles (Local state for now, persists with notificationsEnabled)
    const [notifToggles, setNotifToggles] = useState({
        dailyReport: true,
        budgetAlert: true,
        transactionUpdate: true,
        promoNews: false
    });

    // Form States
    const [newCategory, setNewCategory] = useState({ name: "", type: "expense", icon: "Tag", color: "#ec4899" });
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        image: "" as string | File, // Store URL string or File object
        whatsappId: "",
        telegramId: "", // New Field
        hourlyRate: "",
        primaryGoalId: "",
        securityPin: "",
        decoyPin: "",
        isAppLockEnabled: false,
        isBiometricEnabled: false,
        hideBalance: false,
        autoLockTimeout: 300000,
        financialPersona: null as any
    });

    useEffect(() => {
        loadData();
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (activeModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [activeModal]);

    const loadData = async () => {
        try {
            const response = await apiFetch("/api/profile");
            const result = await response.json();
            const data = result.success ? result.data : null;
            if (data) {
                setUser(data.user);
                setSettings(data.settings);
                setGoals(data.goals);
                setStreak(data.streak);
                setAchievements(data.achievements);
            }

            if (data?.user) {
                setFormData(prev => ({
                    ...prev,
                    firstName: data.user?.firstName || "",
                    lastName: data.user?.lastName || "",
                    username: data.user?.username || "",
                    image: data.user?.image || "", // Populate image
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
                    decoyPin: "",
                    isAppLockEnabled: data.settings.isAppLockEnabled || false,
                    isBiometricEnabled: data.settings.isBiometricEnabled || false,
                    autoLockTimeout: data.settings.autoLockTimeout ?? 300000,
                    financialPersona: data.settings.financialPersona ? JSON.parse(data.settings.financialPersona) : null
                }));
            }

            const catResponse = await apiFetch("/api/categories");
            const catResult = await catResponse.json();
            if (catResult.success && data?.user?.id) {
                // Filter only user-specific custom categories
                setCategories(catResult.data.filter((c: any) => c.userId === data.user.id));
            }

            setLoading(false);
        } catch (error) {
            console.error("Failed to load profile data:", error);
            setLoading(false);
        }
    };

    const handleMenuClick = (id: string) => {
        if (id === "account" || id === "financial" || id === "integrations" || id === "security" || id === "notifications" || id === "categories" || id === "export") {
            setActiveModal(id as any);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        const form = new FormData();
        form.append("firstName", formData.firstName);
        form.append("lastName", formData.lastName);
        form.append("username", formData.username);
        // Append File or keep existing image path
        if (formData.image instanceof File) {
            form.append("image", formData.image);
        }
        form.append("whatsappId", formData.whatsappId);
        form.append("telegramId", formData.telegramId);
        form.append("action", "updateProfile");

        const response = await apiFetch("/api/profile", {
            method: "POST",
            body: form
        });
        const result = await response.json();

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
        form.append("action", "updateFinancial");
        form.append("hourlyRate", formData.hourlyRate);
        form.append("primaryGoalId", formData.primaryGoalId);

        await apiFetch("/api/profile", {
            method: "POST",
            body: form
        });
        toast.success("Berhasil", "Pengaturan keuangan berhasil disimpan!");
        setActiveModal(null);
        loadData(); // Refresh
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error("Validasi", "Nama kategori wajib diisi.");
            return;
        }

        try {
            setLoading(true);
            const response = await apiFetch("/api/categories", {
                method: "POST",
                body: JSON.stringify(newCategory)
            });
            const result = await response.json();

            if (result.success) {
                toast.success("Berhasil", "Kategori berhasil ditambahkan!");
                setNewCategory({ name: "", type: "expense", icon: "Tag", color: "#ec4899" });
                loadData();
            } else {
                toast.error("Gagal", result.error || "Gagal menambahkan kategori.");
            }
        } catch (error) {
            toast.error("Gagal", "Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Yakin ingin menghapus kategori ini? Semua transaksi terkait akan menjadi tanpa kategori.")) return;

        try {
            setLoading(true);
            const response = await apiFetch(`/api/categories?id=${id}`, {
                method: "DELETE"
            });
            const result = await response.json();

            if (result.success) {
                toast.success("Berhasil", "Kategori dihapus.");
                loadData();
            } else {
                toast.error("Gagal", result.error || "Gagal menghapus kategori.");
            }
        } catch (error) {
            toast.error("Gagal", "Terjadi kesalahan sistem.");
        } finally {
            setLoading(false);
        }
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
        setActiveModal(null);
        loadData();
    };

    const handleExport = async (format: 'json' | 'csv' = 'json') => {
        try {
            window.location.href = `/api/export?format=${format}`;
            toast.success("Mengekspor...", "Data Bos sedang dipersiapkan.");
        } catch (error) {
            toast.error("Gagal", "Gagal mengekspor data.");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                setLoading(true);
                const response = await apiFetch("/api/export", {
                    method: "POST",
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    toast.success("Berhasil!", "Data berhasil di-restore.");
                    loadData();
                } else {
                    toast.error("Gagal", result.error || "Format backup tidak cocok.");
                }
            } catch (err) {
                toast.error("Error", "Bukan file JSON yang valid.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleGeneratePersona = async () => {
        try {
            setLoading(true);
            const response = await apiFetch("/api/profile/generate-persona", { method: "POST" });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, financialPersona: result.persona }));
                toast.success("Wah!", "Persona keuangan Bos sudah diupdate!");
            }
        } catch (error) {
            toast.error("Gagal", "Error saat analisa persona.");
        } finally {
            setLoading(false);
        }
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
            <div className="relative bg-gradient-to-br w-full rounded-b-[3rem] from-sky-500 via-sky-600 to-cyan-700 pb-10 pt-safe pt-3 px-6 shadow-2xl overflow-hidden z-[100]">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-400/30 rounded-full blur-3xl mix-blend-overlay" />
                    <div className="absolute top-1/2 -right-24 w-64 h-64 bg-cyan-400/30 rounded-full blur-3xl mix-blend-overlay" />
                </div>

                {/* Top Action Bar */}
                <div className="relative flex items-center justify-between mt-2 mb-6 z-10 w-full">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md shadow-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95"
                        >
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-white tracking-tight">{t("profile.title")}</h1>
                            <p className="text-[10px] text-white/80 font-medium uppercase tracking-widest mt-0.5">{t("profile.settings")}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                {/* Profile Info */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center relative z-10"
                >
                    <div className="relative mb-4 group">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center text-white text-3xl font-bold shadow-2xl overflow-hidden ring-4 ring-black/5">
                            {user?.image ? (
                                <Image
                                    src={user.image.split('?')[0]}
                                    alt={user.firstName || "Profile"}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                getInitials()
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-400 rounded-full border-[3px] border-sky-600 flex items-center justify-center shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black tracking-tight text-white mb-1.5 shadow-black/10 drop-shadow-sm text-center px-4">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Pengguna Baru"}
                    </h2>

                    <span className="text-sky-100/90 text-xs font-bold tracking-widest uppercase mb-5 bg-black/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm shadow-inner">
                        @{user?.username || "username"}
                    </span>

                    <div className="flex flex-col items-center gap-3">
                        <div className={cn(
                            "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border backdrop-blur-md shadow-xl transition-transform hover:scale-105",
                            user?.tier === "kaya" ? "bg-sky-500/30 border-sky-300" :
                                user?.tier === "sultan" ? "bg-amber-500/30 border-amber-300" :
                                    "bg-white/20 border-white/30"
                        )}>
                            {(() => {
                                const tier = (user?.tier || "miskin") as UserTier;
                                const tierStyle = TIER_STYLES[tier];
                                const Icon = tierStyle.icon;
                                return (
                                    <>
                                        <Icon size={14} className={tier === "miskin" ? "text-white" : tierStyle.color} />
                                        <span className="text-[11px] font-bold text-white tracking-widest uppercase">{tierStyle.label} Tier</span>
                                    </>
                                );
                            })()}
                        </div>

                        {user?.tier === "miskin" && (
                            <Link
                                href="/fitur/upgrade"
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-white to-sky-50 text-sky-700 rounded-2xl text-xs font-black shadow-xl shadow-sky-950/20 active:scale-95 transition-all outline-none ring-2 ring-white/50"
                            >
                                <Sparkles size={14} fill="currentColor" />
                                UPGRADE KE KAYA
                            </Link>
                        )}
                        {user?.tier === "kaya" && (
                            <Link
                                href="/fitur/upgrade"
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-amber-950/20 active:scale-95 transition-all outline-none ring-2 ring-amber-400/50"
                            >
                                <Crown size={14} fill="currentColor" />
                                JADI SULTAN
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Simplified Gamification Section */}
            <div className="px-6 -mt-6 relative z-[110]">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setActiveModal("collection")}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-2xl p-4 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-around cursor-pointer active:scale-95 transition-transform"
                >
                    {/* Streak Section */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                            <Flame size={20} className={streak?.currentStreak > 0 ? "fill-orange-500" : "opacity-30"} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Streak</p>
                            <p className="text-base font-black text-slate-900 dark:text-white leading-none mt-0.5">
                                {streak?.currentStreak || 0} <span className="text-[10px] font-bold opacity-40">HARI</span>
                            </p>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                    {/* Badges Section */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                            <Trophy size={20} className={achievements.length > 0 ? "fill-amber-500" : "opacity-30"} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Koleksi</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                {achievements.length === 0 ? (
                                    <p className="text-base font-black text-slate-300 dark:text-slate-700 leading-none">
                                        0 <span className="text-[10px] font-bold font-mono">ITEM</span>
                                    </p>
                                ) : (
                                    <div className="flex -space-x-1.5">
                                        {achievements.slice(0, 4).map((ach, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -2, zIndex: 10 }}
                                                className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-900 flex items-center justify-center text-xs shadow-sm"
                                            >
                                                {ALL_BADGES.find(b => b.type === ach.type)?.icon || "🏆"}
                                            </motion.div>
                                        ))}
                                        {achievements.length > 4 && (
                                            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-amber-600 dark:text-amber-400">
                                                +{achievements.length - 4}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>


            {/* Persona Section */}
            {formData.financialPersona && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-6 mt-6"
                >
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <Sparkles size={20} className="text-yellow-300" />
                                </div>
                                <h3 className="font-black text-xs uppercase tracking-widest opacity-80">Profil Psikologi Keuangan</h3>
                            </div>
                            <button
                                onClick={handleGeneratePersona}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Zap size={16} />
                            </button>
                        </div>

                        <div className="mt-4 relative z-10">
                            <h2 className="text-2xl font-black tracking-tight leading-tight">
                                {formData.financialPersona.title || formData.financialPersona.persona}
                            </h2>
                            <p className="text-sm text-indigo-50 font-medium mt-2 leading-relaxed opacity-90">
                                {formData.financialPersona.description}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}


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
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{t("profile.theme")}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Ubah tampilan aplikasi</p>
                        </div>
                    </div>
                    <ThemeToggleSwitch />
                </motion.div>

                {/* Language Selector Card */}
                <motion.div
                    variants={itemVariants}
                    className="card-clean p-4 space-y-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
                            <Globe size={20} className="text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{t("profile.language")}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih bahasa aplikasi</p>
                        </div>
                    </div>
                    <LanguageSelector />
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
                        pink: { bg: "bg-pink-50", text: "text-pink-600" },
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
                    onClick={() => signOut({ callbackUrl: "/login" })}
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
            <Portal>
                <AnimatePresence>
                    {activeModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4"
                            onClick={() => setActiveModal(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                className="w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 relative"
                            >
                                <div className="flex justify-between items-center p-6 pb-4 shrink-0">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {activeModal === "account" ? "Edit Profil" :
                                            activeModal === "integrations" ? "Integrasi Bot" :
                                                activeModal === "security" ? "Keamanan Aplikasi" :
                                                    activeModal === "export" ? "Export Data" :
                                                        "Konfigurasi Keuangan"}
                                    </h3>
                                    <button
                                        onClick={() => setActiveModal(null)}
                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 px-6 pb-6">
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
                                            <div className="flex flex-col items-center gap-4 py-4">
                                                <div className="relative group">
                                                    <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                                                        {formData.image ? (
                                                            <img
                                                                src={typeof formData.image === 'string' ? formData.image : URL.createObjectURL(formData.image)}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <UserIcon size={32} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <label className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] py-1 text-center font-bold cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                                        GANTI FOTO
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setFormData(prev => ({ ...prev, image: file }));
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                                <p className="text-[10px] text-slate-400 italic">Pilih file foto terbaikmu (maks. 2MB)</p>
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

                                            {/* Backup Section */}
                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 pb-2">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Backup Data</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Ekspor seluruh riwayat transaksi ke CSV</p>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => {
                                                            const a = document.createElement("a");
                                                            a.href = "/api/transactions/export/csv";
                                                            a.download = "monev_full_backup.csv";
                                                            a.click();
                                                        }}
                                                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-2"
                                                    >
                                                        <Download size={14} />
                                                        Download CSV
                                                    </motion.button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleSaveProfile}
                                                className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-[1rem] transition-colors flex items-center justify-center gap-2 mt-4"
                                            >
                                                <Check size={18} />
                                                Simpan Perubahan
                                            </button>
                                        </div>
                                    ) : activeModal === "integrations" ? (
                                        <div className="space-y-6">
                                            {/* Telegram Section */}
                                            <div className={cn(
                                                "p-6 rounded-[2rem] border transition-all relative overflow-hidden",
                                                canUseTelegram(user?.tier as UserTier)
                                                    ? "bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800"
                                                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-90"
                                            )}>
                                                {/* Status Badge */}
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
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-5 max-w-[200px]">
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
                                                            onChange={(e) => setFormData(prev => ({ ...prev, telegramId: e.target.value }))}
                                                            className="w-full pl-10 pr-4 py-2.5 font-mono text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                                                            placeholder="Contoh: 123456789"
                                                        />
                                                    </div>
                                                    {user?.telegramId && (
                                                        <button
                                                            onClick={async () => {
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
                                                            }}
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
                                                    {/* Hidden actual input for handling input logic */}
                                                    <input
                                                        type="tel"
                                                        pattern="[0-9]*"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        value={formData.securityPin}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            if (val.length <= 6) {
                                                                setFormData(prev => ({ ...prev, securityPin: val }));
                                                            }
                                                        }}
                                                        autoFocus
                                                        className="absolute inset-0 opacity-0 cursor-default"
                                                        style={{ fontSize: '16px' }} // Prevent zoom on mobile
                                                    />

                                                    {/* Discrete PIN Slots */}
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

                                            {/* Decoy PIN Section */}
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
                                                                setFormData(prev => ({ ...prev, decoyPin: val }));
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
                                                    onClick={() => setFormData(prev => ({ ...prev, isAppLockEnabled: !prev.isAppLockEnabled }))}
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

                                            {/* Biometric Toggle (Native Only) */}
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
                                                    onClick={() => setFormData(prev => ({ ...prev, isBiometricEnabled: !prev.isBiometricEnabled }))}
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

                                            {/* Auto-lock Timeout */}
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
                                                    onChange={(e) => setFormData(prev => ({ ...prev, autoLockTimeout: parseInt(e.target.value) }))}
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

                                            {/* === SESSION MANAGEMENT === */}
                                            <div className="mt-6 space-y-3">
                                                <h5 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Manajemen Sesi</h5>
                                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Log out dari semua perangkat lain yang sedang aktif menggunakan akun kamu.</p>
                                                    <button
                                                        onClick={async () => {
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
                                                        }}
                                                        className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Shield size={15} />
                                                        Logout Semua Perangkat Lain
                                                    </button>
                                                </div>
                                            </div>

                                            {/* === ACCOUNT DELETION ZONE === */}
                                            <div className="mt-4 space-y-3">
                                                <h5 className="text-[11px] font-black uppercase tracking-widest text-rose-500">Zona Bahaya</h5>
                                                {user?.deletionRequestedAt ? (
                                                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 space-y-3">
                                                        <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                                                            ⏳ Akun dijadwalkan dihapus dalam 30 hari sejak permintaan.
                                                        </p>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const res = await apiFetch("/api/profile/delete", { method: "DELETE" });
                                                                    if (res.ok) {
                                                                        toast.success("Dibatalkan!", "Akun kamu aman kembali");
                                                                        setUser((prev: any) => ({ ...prev, deletionRequestedAt: null }));
                                                                    }
                                                                } catch { toast.error("Gagal", "Coba lagi"); }
                                                            }}
                                                            className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm font-bold hover:bg-emerald-100 transition-colors"
                                                        >
                                                            ✅ Batalkan Penghapusan
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 space-y-3">
                                                        <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                                                            Hapus akun dan semua data kamu secara permanen. Kamu punya 30 hari untuk membatalkan setelah request.
                                                        </p>
                                                        <button
                                                            onClick={async () => {
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
                                                                        setUser((prev: any) => ({ ...prev, deletionRequestedAt: new Date() }));
                                                                    } else {
                                                                        toast.error("Gagal", data.error);
                                                                    }
                                                                } catch { toast.error("Gagal", "Terjadi kesalahan"); }
                                                            }}
                                                            className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Trash2 size={15} />
                                                            Hapus Akun
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    ) : activeModal === "notifications" ? (
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
                                                onClick={async () => {
                                                    try {
                                                        const res = await apiFetch("/api/user/settings", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ notifications: notifToggles }),
                                                        });
                                                        if (res.ok) {
                                                            toast.success("Berhasil", "Preferensi notifikasi disimpan!");
                                                        } else {
                                                            toast.error("Gagal", "Gagal menyimpan preferensi notifikasi");
                                                        }
                                                    } catch {
                                                        toast.error("Gagal", "Gagal menyimpan preferensi notifikasi");
                                                    }
                                                    setActiveModal(null);
                                                }}
                                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
                                            >
                                                <Check size={20} strokeWidth={3} />
                                                SIMPAN NOTIFIKASI
                                            </button>
                                        </div>
                                    ) : activeModal === "collection" ? (
                                        <div className="space-y-6">
                                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] p-6 border border-amber-100 dark:border-amber-900/50">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm">
                                                        <Trophy size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">Koleksi Badge</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                                                            Kumpulkan badge dengan disiplin mencatat transaksi dan menabung!
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {ALL_BADGES.map((badge) => {
                                                    const isUnlocked = achievements.some(a => a.type === badge.type);
                                                    return (
                                                        <div
                                                            key={badge.type}
                                                            className={cn(
                                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                                                isUnlocked
                                                                    ? "bg-white dark:bg-slate-900/50 border-amber-200 dark:border-amber-900/30 shadow-sm"
                                                                    : "bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800 opacity-60 grayscale"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800",
                                                                isUnlocked && "bg-amber-100 dark:bg-amber-900/40"
                                                            )}>
                                                                {badge.icon}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h5 className="font-bold text-sm text-slate-900 dark:text-white">{badge.name}</h5>
                                                                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{badge.description}</p>
                                                            </div>
                                                            {isUnlocked ? (
                                                                <div className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 p-1.5 rounded-full">
                                                                    <CheckCircle2 size={16} />
                                                                </div>
                                                            ) : (
                                                                <div className="text-slate-400 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                                                                    <Lock size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="bg-blue-50 dark:bg-sky-900/20 p-4 rounded-2xl border border-sky-100 dark:border-sky-900/30">
                                                <h6 className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-2">Tips Sultan 👑</h6>
                                                <p className="text-[11px] text-sky-700 dark:text-sky-300 font-medium leading-relaxed">
                                                    Tetap disiplin mencatat setiap pengeluaran dan pemasukan harian untuk mempertahankan streak dan membuka badge langka lainnya!
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => setActiveModal(null)}
                                                className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl hover:brightness-110 transition-all active:scale-95"
                                            >
                                                TUTUP KOLEKSI
                                            </button>
                                        </div>
                                    ) : activeModal === "categories" ? (
                                        <div className="space-y-6">
                                            {/* Header */}
                                            <div className="bg-pink-50 dark:bg-pink-900/20 rounded-[2rem] p-6 border border-pink-100 dark:border-pink-900/50">
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 bg-pink-100 dark:bg-pink-900/40 rounded-2xl text-pink-600 dark:text-pink-400 shadow-sm">
                                                        <Tag size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">Kategori Custom</h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                                                            Punya sumber pendapatan atau jenis pengeluaran unik? Tambahkan di sini.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add New Category */}
                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
                                                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Kategori Baru</h5>
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={newCategory.name}
                                                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Nama Kategori..."
                                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                                                    />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <select
                                                            value={newCategory.type}
                                                            onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as "expense" | "income" }))}
                                                            className="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-medium focus:outline-none transition-all appearance-none"
                                                        >
                                                            <option value="expense">Pengeluaran 📉</option>
                                                            <option value="income">Pemasukan 📈</option>
                                                        </select>
                                                        <input
                                                            type="color"
                                                            value={newCategory.color}
                                                            onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                                                            className="w-full h-full min-h-[46px] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 cursor-pointer"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={handleAddCategory}
                                                        className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={18} />
                                                        Tambah Kategori
                                                    </button>
                                                </div>
                                            </div>

                                            {/* List Categories */}
                                            {categories.length > 0 && (
                                                <div className="space-y-3">
                                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Kategori Milikmu</h5>
                                                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                        {categories.map((cat, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                                                                        <Tag size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</p>
                                                                        <p className="text-[10px] uppercase font-bold text-slate-500">{cat.type === "expense" ? "Pengeluaran" : "Pemasukan"}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    ) : activeModal === "export" ? (
                                        <div className="space-y-4">
                                            <div className="bg-sky-50 dark:bg-sky-900/20 p-5 rounded-3xl border border-sky-100 dark:border-sky-800">
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl w-fit shadow-sm text-sky-500 mb-4">
                                                    <Download size={24} />
                                                </div>
                                                <h4 className="font-black text-slate-900 dark:text-white text-lg mb-1">Export Data</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Download semua data transaksi dan keuanganmu dengan satu klik.</p>

                                                <div className="grid grid-cols-2 gap-3 mt-5">
                                                    <button
                                                        onClick={async () => {
                                                            const isVerified = await reauthenticate();
                                                            if (isVerified) window.open("/api/export?format=json", "_blank");
                                                        }}
                                                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                                                    >
                                                        <span className="text-xl group-hover:scale-110 transition-transform">📄</span>
                                                        <span>Format JSON</span>
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const isVerified = await reauthenticate();
                                                            if (isVerified) window.open("/api/export?format=csv", "_blank");
                                                        }}
                                                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                                                    >
                                                        <span className="text-xl group-hover:scale-110 transition-transform">📊</span>
                                                        <span>Monev CSV</span>
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const isVerified = await reauthenticate();
                                                            if (isVerified) window.open("/api/export?format=bca_csv", "_blank");
                                                        }}
                                                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                                                    >
                                                        <span className="text-xl group-hover:scale-110 transition-transform">🏦</span>
                                                        <span>BCA Template</span>
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const isVerified = await reauthenticate();
                                                            if (isVerified) window.open("/api/export?format=mandiri_csv", "_blank");
                                                        }}
                                                        className="p-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
                                                    >
                                                        <span className="text-xl group-hover:scale-110 transition-transform">💳</span>
                                                        <span>Mandiri Template</span>
                                                    </button>
                                                </div>
                                            </div>
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
                                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">Sembunyikan Saldo</span>
                                                <button
                                                    onClick={toggleStealth}
                                                    className={cn(
                                                        "relative w-12 h-6 rounded-full transition-colors duration-200",
                                                        isStealthMode ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                                                    )}
                                                >
                                                    <motion.div
                                                        animate={{ x: isStealthMode ? 26 : 2 }}
                                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
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
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Portal>
        </div >
    );
}
