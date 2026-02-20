"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CurrencyCode = "IDR" | "USD" | "EUR" | "SGD" | "MYR";

interface CurrencyConfig {
    code: CurrencyCode;
    locale: string;
}

const CURRENCY_MAP: Record<CurrencyCode, CurrencyConfig> = {
    IDR: { code: "IDR", locale: "id-ID" },
    USD: { code: "USD", locale: "en-US" },
    EUR: { code: "EUR", locale: "de-DE" },
    SGD: { code: "SGD", locale: "en-SG" },
    MYR: { code: "MYR", locale: "ms-MY" },
};

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (c: CurrencyCode) => void;
    format: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: "IDR",
    setCurrency: () => { },
    format: (amount) => `Rp${amount.toLocaleString("id-ID")}`,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<CurrencyCode>("IDR");

    useEffect(() => {
        // Load saved currency from localStorage or user settings
        const saved = localStorage.getItem("monev_currency") as CurrencyCode;
        if (saved && CURRENCY_MAP[saved]) {
            setCurrency(saved);
        }
    }, []);

    const handleSetCurrency = (c: CurrencyCode) => {
        setCurrency(c);
        localStorage.setItem("monev_currency", c);
    };

    const format = (amount: number): string => {
        const config = CURRENCY_MAP[currency] || CURRENCY_MAP.IDR;
        return new Intl.NumberFormat(config.locale, {
            style: "currency",
            currency: config.code,
            minimumFractionDigits: config.code === "IDR" ? 0 : 2,
            maximumFractionDigits: config.code === "IDR" ? 0 : 2,
        }).format(amount);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, format }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    return useContext(CurrencyContext);
}

/**
 * Standalone formatCurrency that reads from localStorage (for non-React contexts).
 * For React components, prefer useCurrency().format() instead.
 */
export function formatCurrencyDynamic(amount: number): string {
    if (typeof window === "undefined") {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    }
    const saved = (localStorage.getItem("monev_currency") || "IDR") as CurrencyCode;
    const config = CURRENCY_MAP[saved] || CURRENCY_MAP.IDR;
    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: config.code === "IDR" ? 0 : 2,
        maximumFractionDigits: config.code === "IDR" ? 0 : 2,
    }).format(amount);
}
