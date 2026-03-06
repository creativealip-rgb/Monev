"use client";

import { useI18n } from "@/frontend/lib/i18n-context";
import { motion } from "framer-motion";
import { cn } from "@/frontend/lib/utils";
import { useHaptics } from "@/frontend/hooks/useHaptics";

export function LanguageSelector({ variant = "default" }: { variant?: "default" | "minimal" }) {
    const { locale, setLocale } = useI18n();
    const haptics = useHaptics();

    const languages = [
        { id: "id" as const, label: "Indonesia", flag: "🇮🇩" },
        { id: "en" as const, label: "English", flag: "🇺🇸" },
    ];

    if (variant === "minimal") {
        return (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                {languages.map((lang) => (
                    <button
                        key={lang.id}
                        onClick={() => {
                            setLocale(lang.id);
                            haptics.tap();
                        }}
                        className={cn(
                            "relative px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                            locale === lang.id
                                ? "text-white"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        {locale === lang.id && (
                            <motion.div
                                layoutId="lang-active-min"
                                className="absolute inset-0 bg-sky-500 rounded-full z-0"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10">{lang.id.toUpperCase()}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-full border border-slate-200/50 dark:border-slate-700/50">
            {languages.map((lang) => (
                <button
                    key={lang.id}
                    onClick={() => {
                        setLocale(lang.id);
                        haptics.success();
                    }}
                    className={cn(
                        "relative flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all overflow-hidden",
                        locale === lang.id
                            ? "shadow-sm group"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
                    )}
                >
                    {locale === lang.id && (
                        <motion.div
                            layoutId="lang-active"
                            className="absolute inset-0 bg-sky-500 rounded-xl"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}

                    <span className="relative z-10 text-lg leading-none">{lang.flag}</span>
                    <span className={cn(
                        "relative z-10 text-[13px] font-bold transition-colors",
                        locale === lang.id ? "text-white" : "text-slate-600 dark:text-slate-300"
                    )}>
                        {lang.label}
                    </span>

                    {locale === lang.id && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.15 }}
                            className="absolute -right-2 -bottom-2 w-12 h-12 bg-white rounded-full z-0"
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
