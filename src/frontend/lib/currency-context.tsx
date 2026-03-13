"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("Currency");

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
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

    useEffect(() => {
        // Load saved currency from localStorage or user settings
        const saved = localStorage.getItem("monev_currency") as CurrencyCode;
        if (saved && CURRENCY_MAP[saved]) {
            setCurrency(saved);
        }

        // Fetch live exchange rates against IDR
        const fetchRates = async () => {
            try {
                // Frankfurter doesn't support IDR as a base currently, so we fetch with USD base
                // and derive the IDR rates. Wait, Frankfurter DOES support IDR.
                // Actually, let's use the reliable frankfurter API to get rates for our currencies.
                // We'll fetch latest rates with base=IDR.
                const response = await fetch("https://api.frankfurter.dev/v1/latest?base=IDR");
                if (response.ok) {
                    const data = await response.json();

                    // The API returns how much 1 IDR is worth in other currencies (e.g., 1 IDR = 0.000064 USD).
                    // We need to multiply the IDR amount by this rate.
                    setExchangeRates({
                        USD: data.rates.USD || 0.000064,
                        EUR: data.rates.EUR || 0.000059,
                        SGD: data.rates.SGD || 0.000085,
                        MYR: data.rates.MYR || 0.00028,
                        IDR: 1 // Base currency
                    });
                } else {
                    logger.warn("Currency fetch failed, using fallbacks");
                    setExchangeRates({
                        USD: 0.000064, EUR: 0.000059, SGD: 0.000085, MYR: 0.00028, IDR: 1
                    });
                }
            } catch (error) {
                logger.error("Error fetching exchange rates", error);
                // Fallback rates if offline
                setExchangeRates({
                    USD: 0.000064, EUR: 0.000059, SGD: 0.000085, MYR: 0.00028, IDR: 1
                });
            }
        };

        fetchRates();
    }, []);

    const handleSetCurrency = (c: CurrencyCode) => {
        setCurrency(c);
        localStorage.setItem("monev_currency", c);
    };

    const format = (amount: number): string => {
        const config = CURRENCY_MAP[currency] || CURRENCY_MAP.IDR;

        // Apply exchange rate (assuming 'amount' is always originally in IDR)
        const rate = exchangeRates[currency] || (currency === 'IDR' ? 1 : 0);

        // If the rate is 0 (not loaded yet) and not IDR, fallback to hardcoded approx rates just in case
        const safeRate = rate > 0 ? rate : (
            currency === 'USD' ? 0.000064 :
                currency === 'EUR' ? 0.000059 :
                    currency === 'SGD' ? 0.000085 :
                        currency === 'MYR' ? 0.00028 : 1
        );

        const convertedAmount = amount * safeRate;

        return new Intl.NumberFormat(config.locale, {
            style: "currency",
            currency: config.code,
            minimumFractionDigits: config.code === "IDR" ? 0 : 2,
            maximumFractionDigits: config.code === "IDR" ? 0 : 2,
        }).format(convertedAmount);
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

    // Fallback static rates for standalone function (not perfectly real-time, 
    // but prevents massive wrong numbers before the React Context handles it correctly)
    const rate = saved === "USD" ? 0.000064 :
        saved === "EUR" ? 0.000059 :
            saved === "SGD" ? 0.000085 :
                saved === "MYR" ? 0.00028 : 1;

    const convertedAmount = amount * rate;

    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: config.code,
        minimumFractionDigits: config.code === "IDR" ? 0 : 2,
        maximumFractionDigits: config.code === "IDR" ? 0 : 2,
    }).format(convertedAmount);
}
