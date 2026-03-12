"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Locale, I18nContextType } from "./types";
import { id } from "./locales/id";
import { en } from "./locales/en";

const dictionaries = { id, en };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, initialLocale = "id" }: { children: ReactNode; initialLocale?: Locale }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("monev_language") as Locale;
            if (stored && (stored === "id" || stored === "en")) {
                return stored;
            }
        }
        return initialLocale;
    });

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("monev_language", newLocale);
    }, []);

    const t = useCallback((key: string, params?: Record<string, string | number>): string => {
        const value = dictionaries[locale]?.[key] || dictionaries.id[key] || key;
        
        // Automatic interpolation
        if (params) {
            return value.replace(/\{(\w+)\}/g, (match, key) => {
                return String(params[key] ?? match);
            });
        }
        
        return value;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within I18nProvider");
    }
    return context;
}

export { id, en };
