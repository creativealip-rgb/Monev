import { BarChart3, Bot, Calculator, CalendarClock, FileText, Handshake, Home, NotebookTabs, PiggyBank, ReceiptText, Repeat, TrendingUp, User, Wallet } from "lucide-react";

export type ViewMode = "simple" | "advanced";

export const simpleMenu = [
    { key: "dashboard", labelKey: "nav.dashboard", fallbackLabel: "Beranda", href: "/dashboard", icon: Home },
    { key: "transactions", labelKey: "nav.transactions", fallbackLabel: "Transaksi", href: "/transactions", icon: NotebookTabs },
    { key: "profile", labelKey: "nav.profile", fallbackLabel: "Profil", href: "/profile", icon: User },
];

export const advancedMenu = [
    { key: "dashboard", labelKey: "nav.dashboard", fallbackLabel: "Dashboard", href: "/dashboard", icon: Home },
    { key: "transactions", labelKey: "nav.transactions", fallbackLabel: "Transaksi", href: "/transactions", icon: NotebookTabs },
    { key: "saldo", labelKey: "nav.balances", fallbackLabel: "Saldo", href: "/saldo", icon: Wallet },
    { key: "profile", labelKey: "nav.profile", fallbackLabel: "Profil", href: "/profile", icon: User },
];

export const advancedFeatureMenu = [
    { key: "budgets", label: "Budget", href: "/budgets", icon: ReceiptText },
    { key: "savings", label: "Tabungan", href: "/savings", icon: PiggyBank },
    { key: "bills", label: "Tagihan", href: "/bills", icon: CalendarClock },
    { key: "debts", label: "Utang", href: "/debts", icon: Handshake },
    { key: "investments", label: "Investasi", href: "/investments", icon: TrendingUp },
    { key: "analytics", label: "Analitik", href: "/analytics", icon: BarChart3 },
    { key: "reports", label: "Laporan", href: "/reports", icon: FileText },
    { key: "recurring", label: "Berulang", href: "/recurring", icon: Repeat },
    { key: "simulations", label: "Simulasi", href: "/simulations", icon: Calculator },
    { key: "chat", label: "AI Chat", href: "/chat", icon: Bot },
];

export function normalizeViewMode(value: unknown): ViewMode {
    return value === "simple" ? "simple" : "advanced";
}

export function getPrimaryMenu(viewMode: ViewMode) {
    return viewMode === "simple" ? simpleMenu : advancedMenu;
}
