import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type CurrencyCode = "IDR" | "USD" | "EUR" | "SGD" | "MYR";

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; minFrac: number }> = {
    IDR: { locale: "id-ID", minFrac: 0 },
    USD: { locale: "en-US", minFrac: 2 },
    EUR: { locale: "de-DE", minFrac: 2 },
    SGD: { locale: "en-SG", minFrac: 2 },
    MYR: { locale: "ms-MY", minFrac: 2 },
};

export function formatCurrency(amount: number): string {
    let code: CurrencyCode = "IDR";
    if (typeof window !== "undefined") {
        const saved = localStorage.getItem("monev_currency") as CurrencyCode;
        if (saved && CURRENCY_CONFIG[saved]) code = saved;
    }
    const config = CURRENCY_CONFIG[code];
    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: code,
        minimumFractionDigits: config.minFrac,
        maximumFractionDigits: config.minFrac,
    }).format(amount);
}
