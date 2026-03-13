export type CurrencyCode = "IDR" | "USD" | "EUR" | "SGD" | "MYR";

export const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; minFrac: number }> = {
    IDR: { locale: "id-ID", minFrac: 0 },
    USD: { locale: "en-US", minFrac: 2 },
    EUR: { locale: "de-DE", minFrac: 2 },
    SGD: { locale: "en-SG", minFrac: 2 },
    MYR: { locale: "ms-MY", minFrac: 2 },
};

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
