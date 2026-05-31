"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, LogOut, Bell, Shield, Moon, Wallet, Globe, User as UserIcon, MessageCircle, Smartphone, Database, Download, Tag, Flame, Trophy, ArrowLeft, Sparkles, Crown, Zap, Camera, HelpCircle, Book, Mail, MessageSquare, FileText, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { LanguageSelector } from "@/frontend/components/LanguageSelector";
import { CurrencySelector } from "@/frontend/components/CurrencySelector";
import { ThemeToggleSwitch } from "@/frontend/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSecurity } from "@/components/SecurityProvider";
import { apiFetch } from "@/frontend/lib/api-client";
import { useToast } from "@/frontend/components/UI";
import { useObjectURL } from "@/frontend/hooks/useObjectURL";
import { useProfileData } from "@/frontend/hooks/useProfileData";
import { ProfileModals } from "./components/ProfileModals";
import { UserTier, canUseTelegram } from "@/lib/tier-gate";

const TIER_STYLES: Record<UserTier, { label: string; color: string; bg: string; border: string; icon: any }> = {
    starter: { label: "Starter", color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: Zap },
    pro: { label: "Pro", color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-100 dark:border-sky-800", icon: Sparkles },
    sultan: { label: "Sulton", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800", icon: Crown },
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

const menuGroups = [
    {
        title: "Akun & Keuangan",
        items: [
            { id: "account", icon: UserIcon, label: "profile.accountSettings", color: "blue", hasArrow: true },
            { id: "financial", icon: Wallet, label: "profile.financialConfig", color: "emerald", hasArrow: true },
            { id: "reports", icon: FileText, label: "Laporan Keuangan", color: "sky", hasArrow: true, rawLabel: true },
            { id: "categories", icon: Tag, label: "profile.customCategories", color: "pink", hasArrow: true },
        ]
    },
    {
        title: "Sistem & Keamanan",
        items: [
            { id: "security", icon: Shield, label: "profile.security", color: "amber", hasArrow: true },
            { id: "notifications", icon: Bell, label: "profile.notifications", color: "purple", hasArrow: true },
            { id: "integrations", icon: MessageCircle, label: "profile.botIntegrations", color: "indigo", hasArrow: true },
        ]
    },
    {
        title: "Data & Aplikasi",
        items: [
            { id: "export", icon: Database, label: "profile.dataBackup", color: "sky", hasArrow: true },
            { id: "app_settings", icon: Smartphone, label: "Pengaturan Aplikasi", color: "blue", hasArrow: true, rawLabel: true },
            { id: "download", icon: Download, label: "profile.downloadApp", color: "sky", hasArrow: true, isDownload: true },
            { id: "about", icon: Info, label: "Tentang Monev", color: "slate", hasArrow: true, rawLabel: true },
        ]
    }
];

const helpItems = [
    { icon: Book, label: "Dokumentasi", description: "Panduan lengkap Monev", href: "/help/docs", color: "blue" },
    { icon: MessageSquare, label: "FAQ", description: "Pertanyaan umum", href: "/help/faq", color: "purple" },
    { icon: Mail, label: "Kontak Support", description: "Email: alifpm55@gmail.com", href: "mailto:alifpm55@gmail.com", color: "emerald" },
];

export default function ProfilePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const isApk = process.env.NEXT_PUBLIC_IS_APK === "true";
    const { t } = useI18n();
    const { user, settings, goals, streak, achievements, categories, loading, loadData, setUser } = useProfileData();
    const { isStealthMode, toggleStealth, reauthenticate, deleteLocalData } = useSecurity();
    const toast = useToast();

    const [activeModal, setActiveModal] = useState<"account" | "financial" | "integrations" | "security" | "notifications" | "collection" | "categories" | "export" | "reports" | "app_settings" | "about" | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        image: "" as string | File,
        whatsappId: "",
        telegramId: "",
        hourlyRate: "",
        primaryGoalId: "",
        securityPin: "",
        decoyPin: "",
        hasSecurityPin: false,
        isAppLockEnabled: false,
        isBiometricEnabled: false,
        autoLockTimeout: 300000,
        financialPersona: null as any
    });

    const [notifToggles, setNotifToggles] = useState({
        dailyReport: true,
        budgetAlert: true,
        transactionUpdate: true,
        promoNews: false
    });

    const [newCategory, setNewCategory] = useState({ name: "", type: "expense" as "expense" | "income", icon: "Tag", color: "#ec4899" });

    const imagePreviewUrl = useObjectURL(formData.image);

    useEffect(() => {
        if (!user && !settings) return;

        setFormData((prev) => ({
            ...prev,
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            username: user?.username || "",
            image: user?.image || "",
            whatsappId: user?.whatsappId || "",
            telegramId: user?.telegramId?.toString() || "",
            hourlyRate: settings?.hourlyRate?.toString() || "",
            primaryGoalId: settings?.primaryGoalId?.toString() || "",
            securityPin: "",
            decoyPin: "",
            hasSecurityPin: !!settings?.hasPin,
            isAppLockEnabled: !!settings?.isAppLockEnabled,
            isBiometricEnabled: !!settings?.isBiometricEnabled,
            autoLockTimeout: settings?.autoLockTimeout ?? 300000,
            financialPersona: settings?.financialPersona ?? null,
        }));
    }, [user, settings]);

    const getInitials = () => {
        if (!user) return "??";
        if (user.name) {
            const parts = user.name.split(" ");
            if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            return parts[0][0].toUpperCase();
        }
        const first = user.firstName?.[0] || "";
        const last = user.lastName?.[0] || "";
        return (first + last).toUpperCase() || "WT";
    };

    const handleMenuClick = (id: string) => {
        if (["account", "financial", "integrations", "security", "notifications", "categories", "export", "reports", "app_settings", "about"].includes(id)) {
            setActiveModal(id as any);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        const form = new FormData();
        form.append("firstName", formData.firstName);
        form.append("lastName", formData.lastName);
        form.append("username", formData.username);
        if (formData.image instanceof File) form.append("image", formData.image);
        form.append("whatsappId", formData.whatsappId);
        form.append("telegramId", formData.telegramId);
        form.append("action", "updateProfile");

        const response = await apiFetch("/api/profile", { method: "POST", body: form });
        const result = await response.json();

        if (result.success) {
            setActiveModal(null);
            toast.success("Berhasil", "Profil berhasil disimpan!");
            loadData();
        } else {
            toast.error("Gagal", result.message || "Gagal menyimpan profil.");
        }
    };

    const handleSaveSettings = async () => {
        const form = new FormData();
        form.append("action", "updateFinancial");
        form.append("hourlyRate", formData.hourlyRate);
        form.append("primaryGoalId", formData.primaryGoalId);

        await apiFetch("/api/profile", { method: "POST", body: form });
        toast.success("Berhasil", "Pengaturan keuangan berhasil disimpan!");
        setActiveModal(null);
        loadData();
    };

    const handleSaveSecurity = async () => {
        if (formData.isAppLockEnabled && !formData.securityPin && !formData.hasSecurityPin) {
            toast.error("Validasi", "Harap atur PIN sebelum mengaktifkan App Lock.");
            return;
        }
        if (formData.securityPin && formData.securityPin.length !== 6) {
            toast.error("Validasi", "PIN harus 6 digit angka.");
            return;
        }
        if (formData.decoyPin && formData.decoyPin.length !== 6) {
            toast.error("Validasi", "PIN palsu harus 6 digit angka.");
            return;
        }

        const payload: Record<string, unknown> = {
            type: "settings",
            decoyPin: formData.decoyPin,
            isAppLockEnabled: formData.isAppLockEnabled,
            isBiometricEnabled: formData.isBiometricEnabled,
            autoLockTimeout: formData.autoLockTimeout,
        };

        if (formData.securityPin) {
            payload.securityPin = formData.securityPin;
        }

        const response = await apiFetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            toast.success("Berhasil", "Pengaturan keamanan berhasil disimpan!");
            setActiveModal(null);
            loadData();
        } else {
            toast.error("Gagal", result.error || "Gagal menyimpan pengaturan keamanan.");
        }
    };

    const handleGeneratePersona = async () => {
        try {
            const response = await apiFetch("/api/profile/generate-persona", { method: "POST" });
            const result = await response.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, financialPersona: result.persona }));
                toast.success("Wah!", "Persona keuangan Bos sudah diupdate!");
            }
        } catch {
            toast.error("Gagal", "Error saat analisa persona.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            <div className="relative bg-gradient-to-br w-full rounded-b-[2.5rem] sm:rounded-b-[3rem] from-sky-500 via-sky-600 to-cyan-700 pb-8 sm:pb-10 pt-safe pt-3 px-6 shadow-2xl overflow-hidden z-[100]">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-sky-400/30 rounded-full blur-3xl mix-blend-overlay" />
                    <div className="absolute top-1/2 -right-24 w-64 h-64 bg-cyan-400/30 rounded-full blur-3xl mix-blend-overlay" />
                </div>

                <div className="relative flex items-center justify-between mt-1 mb-3 sm:mt-2 sm:mb-6 z-10 w-full">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md shadow-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-95">
                            <ArrowLeft size={20} strokeWidth={2.5} />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-white tracking-tight">{t("profile.title")}</h1>
                            <p className="text-[10px] text-white/80 font-medium uppercase tracking-widest mt-0.5">{t("profile.settings")}</p>
                        </div>
                    </div>
                </div>

                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center relative z-10">
                    <button type="button" className="relative mb-3 sm:mb-4 group cursor-pointer" onClick={() => setActiveModal("account")} aria-label="Edit profil">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-xl border-4 border-white/20 flex items-center justify-center text-white text-3xl font-bold shadow-2xl overflow-hidden ring-4 ring-black/5">
                            {user?.image ? (
                                <Image src={user.image.split('?')[0]} alt={user.firstName || "Profile"} width={96} height={96} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                getInitials()
                            )}
                        </div>
                        <div className="absolute bottom-0.5 right-0.5 w-5 h-5 sm:bottom-1 sm:right-1 sm:w-6 sm:h-6 bg-emerald-400 rounded-full border-[3px] border-sky-600 flex items-center justify-center shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera size={24} className="text-white" />
                        </div>
                    </button>

                    <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white mb-1 shadow-black/10 drop-shadow-sm text-center px-4">
                        {user?.firstName || user?.name ? `${user.firstName || user.name} ${user.lastName || ""}`.trim() : "Pengguna Baru"}
                    </h2>

                    <span className="text-sky-100/90 text-xs font-bold tracking-widest uppercase mb-3 sm:mb-5 bg-black/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm shadow-inner">
                        @{user?.username || user?.email?.split("@")[0] || "username"}
                    </span>

                    <div className="flex flex-col items-center gap-3">
                        <div className={cn("inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border backdrop-blur-md shadow-xl transition-transform hover:scale-105",
                             user?.tier === "pro" ? "bg-sky-500/30 border-sky-300" : user?.tier === "sultan" ? "bg-amber-500/30 border-amber-300" : "bg-white/20 border-white/30"
                        )}>
                            {(() => {
                                const tier = (user?.tier || "starter") as UserTier;
                                const tierStyle = TIER_STYLES[tier];
                                const Icon = tierStyle.icon;
                                return (
                                    <><Icon size={14} className={tier === "starter" ? "text-white" : tierStyle.color} /><span className="text-[11px] font-bold text-white tracking-widest uppercase">{tierStyle.label} Tier</span></>
                                );
                            })()}
                        </div>

                        {user?.tier === "starter" && (
                            <Link href="/fitur/upgrade" className="flex items-center gap-2 px-5 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-white to-sky-50 text-sky-700 rounded-2xl text-xs font-black shadow-xl shadow-sky-950/20 active:scale-95 transition-all outline-none ring-2 ring-white/50">
                                <Sparkles size={14} fill="currentColor" />
                                UPGRADE KE PRO
                            </Link>
                        )}
                        {user?.tier === "pro" && (
                            <Link href="/fitur/upgrade" className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-amber-950/20 active:scale-95 transition-all outline-none ring-2 ring-amber-400/50">
                                <Crown size={14} fill="currentColor" />
                                JADI SULTAN
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>

            <div className="px-6 -mt-5 sm:-mt-6 relative z-[110]">
                <motion.button type="button" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => setActiveModal("collection")} className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-around cursor-pointer active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-500/40" aria-label="Buka koleksi badge dan streak">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500">
                            <Flame size={20} className={streak?.currentStreak > 0 ? "fill-orange-500" : "opacity-30"} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("profile.streak")}</p>
                            <p className="text-base font-black text-slate-900 dark:text-white leading-none mt-0.5">{streak?.currentStreak || 0} <span className="text-[10px] font-bold opacity-40">{t("profile.days")}</span></p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
                            <Trophy size={20} className={achievements.length > 0 ? "fill-amber-500" : "opacity-30"} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("profile.collection")}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                {achievements.length === 0 ? (
                                    <p className="text-base font-black text-slate-300 dark:text-slate-700 leading-none">0 <span className="text-[10px] font-bold font-mono">{t("profile.items")}</span></p>
                                ) : (
                                    <div className="flex -space-x-1.5">
                                        {achievements.slice(0, 4).map((ach, i) => (
                                            <motion.div key={i} whileHover={{ y: -2, zIndex: 10 }} className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-900 flex items-center justify-center text-xs shadow-sm">
                                                {ALL_BADGES.find(b => b.type === ach.type)?.icon || "🏆"}
                                            </motion.div>
                                        ))}
                                        {achievements.length > 4 && (
                                            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-amber-600 dark:text-amber-400">+{achievements.length - 4}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.button>
            </div>

            {formData.financialPersona && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 mt-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Sparkles size={20} className="text-yellow-300" /></div>
                                <h3 className="font-black text-xs uppercase tracking-widest opacity-80">Profil Psikologi Keuangan</h3>
                            </div>
                            <button type="button" onClick={handleGeneratePersona} className="p-2 hover:bg-white/10 rounded-full transition-colors"><Zap size={16} /></button>
                        </div>
                        <div className="mt-4 relative z-10">
                            <h2 className="text-2xl font-black tracking-tight leading-tight">{formData.financialPersona.title || formData.financialPersona.persona}</h2>
                            <p className="text-sm text-indigo-50 font-medium mt-2 leading-relaxed opacity-90">{formData.financialPersona.description}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="px-6 pt-5 sm:pt-6 space-y-8 pb-6">
                {menuGroups.map((group, gIndex) => (
                    <div key={gIndex} className="space-y-3">
                        <div className="flex items-center gap-2 px-2">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.title}</h3>
                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800/50" />
                        </div>
                        
                        <div className="space-y-2">
                            {group.items.map((item, index) => {
                                const Icon = item.icon;
                                const colors: Record<string, { bg: string; text: string }> = {
                                    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400" },
                                    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400" },
                                    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400" },
                                    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400" },
                                    indigo: { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600 dark:text-indigo-400" },
                                    sky: { bg: "bg-sky-50 dark:bg-sky-900/20", text: "text-sky-600 dark:text-sky-400" },
                                    pink: { bg: "bg-pink-50 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400" },
                                    slate: { bg: "bg-slate-50 dark:bg-slate-900/20", text: "text-slate-600 dark:text-slate-400" },
                                };
                                const color = colors[item.color] || colors.slate;
                                const itemLabel = item.rawLabel ? item.label : t(item.label);

                                if (item.id === "download") {
                                    return (
                                        <motion.a key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} href="/monev-app.apk" download="monev-app.apk" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full p-4 card-clean flex items-center justify-between group hover:border-sky-300/50 hover:shadow-md transition-all no-underline">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", color.bg, color.text)}>
                                                    <Icon size={18} strokeWidth={2.5} />
                                                </div>
                                                <span className="font-bold text-[13px] text-slate-700 dark:text-slate-200 tracking-tight">{itemLabel}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-sky-500 bg-sky-50 dark:bg-sky-900/40 px-2 py-1 rounded-lg border border-sky-100 dark:border-sky-800 uppercase tracking-tighter">APK</span>
                                                <ChevronLeft size={16} className="text-slate-300 rotate-180 group-hover:text-sky-400 transition-colors" />
                                            </div>
                                        </motion.a>
                                    );
                                }

                                return (
                                    <motion.button type="button" key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => handleMenuClick(item.id)} className="w-full p-4 card-clean flex items-center justify-between group hover:border-sky-300/50 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", color.bg, color.text)}>
                                                <Icon size={18} strokeWidth={2.5} />
                                            </div>
                                            <span className="font-bold text-[13px] text-slate-700 dark:text-slate-200 tracking-tight">{itemLabel}</span>
                                        </div>
                                        {item.hasArrow && <ChevronLeft size={16} className="text-slate-300 rotate-180 group-hover:text-sky-400 transition-colors" />}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
                
                {/* Help & Support Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 1.0 }}
                    className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <HelpCircle size={18} className="text-slate-400" />
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Butuh Bantuan?</h3>
                    </div>
                    <div className="space-y-2">
                        {helpItems.map((item, index) => {
                            const Icon = item.icon;
                            const colors: Record<string, string> = {
                                blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                                purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
                                emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
                            };
                            
                            return (
                                <motion.button
                                    key={index}
                                    type="button"
                                    onClick={() => {
                                        if (item.href.startsWith('mailto:')) {
                                            window.location.href = item.href;
                                        } else {
                                            const finalHref = isApk && !item.href.endsWith('/') ? `${item.href}/` : item.href;
                                            router.push(finalHref);
                                        }
                                    }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.05 + index * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full p-4 card-clean flex items-center gap-4 group hover:border-slate-300/50 hover:shadow-md transition-all text-left"
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", colors[item.color])}>
                                        <Icon size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-[13px] text-slate-700 dark:text-slate-200 tracking-tight">{item.label}</p>
                                        <p className="text-[10px] text-slate-500">{item.description}</p>
                                    </div>
                                    <ChevronLeft size={16} className="text-slate-300 rotate-180 group-hover:text-slate-400 transition-colors" />
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
                
                <motion.button type="button" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => signOut({ callbackUrl: "/login" })} className="w-full p-4 card-clean border-rose-200/50 flex items-center gap-4 hover:bg-rose-500/10 hover:border-rose-300/50 transition-all mt-6">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><LogOut size={18} strokeWidth={2.5} /></div><span className="font-bold text-[13px] text-rose-500 dark:text-rose-400 tracking-tight">{t("profile.signOut")}</span>
                </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center mt-4 pb-20"><p className="text-xs text-slate-400">Monev v1.0.0</p></motion.div>

            <ProfileModals
                activeModal={activeModal}
                onClose={() => setActiveModal(null)}
                user={user}
                formData={formData}
                setFormData={setFormData}
                goals={goals}
                achievements={achievements}
                categories={categories}
                loadData={loadData}
                onSaveProfile={handleSaveProfile}
                onSaveSettings={handleSaveSettings}
                onSaveSecurity={handleSaveSecurity}
            />
        </div>
    );
}
