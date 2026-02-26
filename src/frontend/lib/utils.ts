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

    // Fallback static rates for utilities outside the React Context
    // Prevents displaying "USD 50,000" instead of "USD 3.2" 
    const fallbackRate = code === "USD" ? 0.000064 :
        code === "EUR" ? 0.000059 :
            code === "SGD" ? 0.000085 :
                code === "MYR" ? 0.00028 : 1;

    const convertedAmount = amount * fallbackRate;

    return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: code,
        minimumFractionDigits: config.minFrac,
        maximumFractionDigits: config.minFrac,
    }).format(convertedAmount);
}
