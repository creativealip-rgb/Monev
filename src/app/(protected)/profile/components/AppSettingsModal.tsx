"use client";

import { Moon, Globe, Wallet, LayoutDashboard, Smartphone } from "lucide-react";
import { ThemeToggleSwitch } from "@/frontend/components/ThemeToggle";
import { LanguageSelector } from "@/frontend/components/LanguageSelector";
import { CurrencySelector } from "@/frontend/components/CurrencySelector";
import { useI18n } from "@/lib/i18n";
import { useViewMode } from "@/frontend/hooks/useViewMode";
import { cn } from "@/frontend/lib/utils";

export function AppSettingsModal() {
    const { t } = useI18n();
    const { viewMode, setViewMode } = useViewMode();

    return (
        <div className="space-y-6">
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-[2rem] p-6 border border-sky-100 dark:border-sky-900/50">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-100 dark:bg-sky-900/40 rounded-2xl text-sky-600 dark:text-sky-400 shadow-sm">
                        <Smartphone size={28} />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight">Pengaturan Aplikasi</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                            Sesuaikan tampilan dan preferensi regional Anda.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="card-clean p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                            <LayoutDashboard size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Mode Tampilan</p>
                            <p className="text-[10px] text-slate-500 font-medium">Simple untuk fitur inti, Advanced untuk menu lengkap</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                        {(["simple", "advanced"] as const).map((mode) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setViewMode(mode)}
                                className={cn(
                                    "rounded-xl px-3 py-2 text-xs font-black transition-all",
                                    viewMode === mode
                                        ? "bg-white text-sky-600 shadow-sm dark:bg-slate-950 dark:text-sky-400"
                                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                )}
                            >
                                {mode === "simple" ? "Simple" : "Advanced"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Theme Section */}
                <div className="card-clean p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                            <Moon size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{t("profile.theme")}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Ubah tampilan gelap/terang</p>
                        </div>
                    </div>
                    <ThemeToggleSwitch />
                </div>

                {/* Language Section */}
                <div className="card-clean p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Globe size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{t("profile.language")}</p>
                            <p className="text-[10px] text-slate-500 font-medium">Pilih bahasa antarmuka</p>
                        </div>
                    </div>
                    <LanguageSelector />
                </div>

                {/* Currency Section */}
                <div className="card-clean p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Mata Uang</p>
                            <p className="text-[10px] text-slate-500 font-medium">Pilih mata uang utama Anda</p>
                        </div>
                    </div>
                    <CurrencySelector />
                </div>
            </div>
        </div>
    );
}
