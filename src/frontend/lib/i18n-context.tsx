"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

type Locale = "id" | "en";

// Translation dictionaries
const dictionaries: Record<Locale, Record<string, string>> = {
    id: {
        // Navigation
        "nav.dashboard": "Beranda",
        "nav.transactions": "Riwayat",
        "nav.analytics": "Analisa",
        "nav.budgets": "Anggaran",
        "nav.bills": "Tagihan",
        "nav.savings": "Tabungan",
        "nav.investments": "Investasi",
        "nav.chat": "Chat AI",
        "nav.profile": "Profil",

        // Common
        "common.save": "Simpan",
        "common.cancel": "Batal",
        "common.delete": "Hapus",
        "common.edit": "Edit",
        "common.add": "Tambah",
        "common.back": "Kembali",
        "common.loading": "Memuat...",
        "common.search": "Cari...",
        "common.all": "Semua",
        "common.filter": "Filter",
        "common.export": "Ekspor",
        "common.noData": "Belum ada data",

        // Dashboard
        "dashboard.title": "Beranda",
        "dashboard.balance": "Saldo Saat Ini",
        "dashboard.income": "Pemasukan",
        "dashboard.expense": "Pengeluaran",
        "dashboard.recentTransactions": "Transaksi Terbaru",
        "dashboard.viewAll": "Lihat Semua",

        // Transactions
        "transactions.title": "Riwayat",
        "transactions.search": "Cari transaksi...",
        "transactions.allTransactions": "Semua Transaksi",
        "transactions.searchResults": "Hasil Pencarian",
        "transactions.count": "Transaksi",

        // Analytics
        "analytics.title": "Analisa",
        "analytics.overview": "Ringkasan",
        "analytics.trends": "Tren",
        "analytics.insights": "Insight",
        "analytics.monthComparison": "Perbandingan Bulan",
        "analytics.vsLastMonth": "vs bulan lalu",
        "analytics.topCategories": "Top Kategori Pengeluaran",
        "analytics.noExpenseData": "Belum ada data pengeluaran.",
        "analytics.spendingHeatmap": "Peta Pengeluaran",

        // Bills
        "bills.title": "Tagihan",
        "bills.thisMonth": "Tagihan Bulan Ini",
        "bills.unpaid": "belum dibayar",
        "bills.paid": "Lunas",
        "bills.overdue": "Terlambat",
        "bills.addBill": "Tambah Tagihan",
        "bills.subscriptionsDetected": "Langganan Terdeteksi",

        // Profile
        "profile.title": "Profil",
        "profile.settings": "Pengaturan",
        "profile.security": "Keamanan",
        "profile.logout": "Keluar",
    },
    en: {
        // Navigation
        "nav.dashboard": "Home",
        "nav.transactions": "History",
        "nav.analytics": "Analytics",
        "nav.budgets": "Budgets",
        "nav.bills": "Bills",
        "nav.savings": "Savings",
        "nav.investments": "Investments",
        "nav.chat": "AI Chat",
        "nav.profile": "Profile",

        // Common
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.add": "Add",
        "common.back": "Back",
        "common.loading": "Loading...",
        "common.search": "Search...",
        "common.all": "All",
        "common.filter": "Filter",
        "common.export": "Export",
        "common.noData": "No data yet",

        // Dashboard
        "dashboard.title": "Home",
        "dashboard.balance": "Current Balance",
        "dashboard.income": "Income",
        "dashboard.expense": "Expense",
        "dashboard.recentTransactions": "Recent Transactions",
        "dashboard.viewAll": "View All",

        // Transactions
        "transactions.title": "History",
        "transactions.search": "Search transactions...",
        "transactions.allTransactions": "All Transactions",
        "transactions.searchResults": "Search Results",
        "transactions.count": "Transactions",

        // Analytics
        "analytics.title": "Analytics",
        "analytics.overview": "Overview",
        "analytics.trends": "Trends",
        "analytics.insights": "Insights",
        "analytics.monthComparison": "Month Comparison",
        "analytics.vsLastMonth": "vs last month",
        "analytics.topCategories": "Top Expense Categories",
        "analytics.noExpenseData": "No expense data yet.",
        "analytics.spendingHeatmap": "Spending Heatmap",

        // Bills
        "bills.title": "Bills",
        "bills.thisMonth": "Bills This Month",
        "bills.unpaid": "unpaid",
        "bills.paid": "Paid",
        "bills.overdue": "Overdue",
        "bills.addBill": "Add Bill",
        "bills.subscriptionsDetected": "Subscriptions Detected",

        // Profile
        "profile.title": "Profile",
        "profile.settings": "Settings",
        "profile.security": "Security",
        "profile.logout": "Sign Out",
    },
};

interface I18nContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
    locale: "id",
    setLocale: () => { },
    t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>("id");

    useEffect(() => {
        const saved = localStorage.getItem("monev_language") as Locale;
        if (saved && dictionaries[saved]) {
            setLocale(saved);
        }
    }, []);

    const handleSetLocale = (l: Locale) => {
        setLocale(l);
        localStorage.setItem("monev_language", l);
    };

    const t = useCallback((key: string): string => {
        return dictionaries[locale]?.[key] || dictionaries.id[key] || key;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
