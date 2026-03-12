import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS class names.
 * Combines clsx for conditional classes with tailwind-merge to resolve conflicts.
 * 
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged class string with Tailwind conflicts resolved
 * 
 * @example
 * // Basic usage
 * cn("px-4", "py-2", "bg-blue-500")
 * // Returns: "px-4 py-2 bg-blue-500"
 * 
 * @example
 * // Conditional classes
 * cn("btn", isActive && "active", variant === "primary" && "bg-blue-500")
 * // Returns: "btn active bg-blue-500" (if isActive and variant are true)
 * 
 * @example
 * // Resolves Tailwind conflicts
 * cn("p-4", "p-2")
 * // Returns: "p-2" (last class wins)
 */
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

/**
 * Formats a numeric amount as localized currency string.
 * Reads user's currency preference from localStorage, defaults to IDR.
 * Uses static conversion rates for utilities outside React Context.
 * 
 * @param amount - Numeric amount in IDR (Indonesian Rupiah)
 * @returns Formatted currency string with locale-specific formatting
 * 
 * @example
 * // IDR formatting (default)
 * formatCurrency(50000)
 * // Returns: "Rp 50.000"
 * 
 * @example
 * // USD formatting (if user selected USD)
 * formatCurrency(50000)
 * // Returns: "USD 3.20" (using static rate 0.000064)
 * 
 * @example
 * // Handles zero and negatives
 * formatCurrency(0)      // Returns: "Rp 0"
 * formatCurrency(-25000) // Returns: "-Rp 25.000"
 * 
 * @remarks
 * Currency conversion uses static rates (not live API):
 * - USD: 1 IDR = 0.000064 USD
 * - EUR: 1 IDR = 0.000059 EUR
 * - SGD: 1 IDR = 0.000085 SGD
 * - MYR: 1 IDR = 0.00028 MYR
 */
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

/**
 * Payment method configuration for display
 */
export const PAYMENT_METHODS: Record<string, { label: string; icon: string }> = {
    cash: { label: "Tunai", icon: "Banknote" },
    transfer: { label: "Transfer Bank", icon: "Landmark" },
    gopay: { label: "GoPay", icon: "Wallet" },
    credit_card: { label: "Kartu Kredit", icon: "CreditCard" },
    qris: { label: "QRIS", icon: "QrCode" },
    dana: { label: "DANA", icon: "Wallet" },
    ovo: { label: "OVO", icon: "Wallet" },
    shopeepay: { label: "ShopeePay", icon: "Wallet" },
};

/**
 * Get payment method display info
 * @param method - Payment method code (e.g., "cash", "transfer")
 * @returns Object with label and icon name
 */
export function getPaymentMethod(method: string | null | undefined): { label: string; icon: string } {
    return PAYMENT_METHODS[method || "cash"] || PAYMENT_METHODS.cash;
}
