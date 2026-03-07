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
        "nav.transfer": "Transfer Internal",

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
        "common.transfer": "Transfer",
        "common.sourceAccount": "Sumber Saldo",
        "common.targetAccount": "Tujuan Saldo",
        "common.confirm": "Konfirmasi",

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
        "profile.language": "Bahasa",
        "profile.theme": "Tema",

        // Features
        "features.allFeatures": "Semua Fitur",
        "features.explore": "Eksplorasi Kemampuan Monev",
        "features.ready": "Siap",
        "features.soon": "Segera",
        "features.upgrade": "Upgrade",

        // Dashboard Features
        "features.monev_ai": "Monev AI",
        "features.analytics": "Analitik",
        "features.budgets": "Anggaran",
        "features.savings": "Tabungan",
        "features.simulations": "Simulasi",
        "features.bills": "Tagihan",
        "features.investments": "Investasi",
        "features.debts": "Hutang",
        "features.recurring": "Berulang",
        "nav.balances": "Saldo",

        // Saldo / Balances
        "saldo.title": "Saldo & Akun",
        "saldo.subtitle": "Kelola semua dompetmu",
        "saldo.netWorth": "Total Kekayaan Bersih",
        "saldo.accountsCount": "Akun Terdaftar",
        "saldo.noAccounts": "Belum ada akun",
        "saldo.addSample": "Tambahkan Bank, E-Wallet, atau Cash.",
        "saldo.addAccount": "Tambah Akun Baru",
        "saldo.accountName": "Nama Akun",
        "saldo.accountType": "Jenis",
        "saldo.currentBalance": "Saldo Saat Ini",
        "saldo.saveAccount": "Simpan Akun",
        "saldo.type.bank": "Bank",
        "saldo.type.emoney": "E-Money",
        "saldo.type.cash": "Tunai",
        "saldo.type.credit_card": "Kartu Kredit",
        "saldo.type.investment": "Investasi",
        "saldo.quickAdd": "Tambah Cepat",
        "saldo.selectType": "Pilih Jenis",
        "saldo.selectBank": "Pilih Bank",
        "saldo.selectEmoney": "Pilih E-Money",
        "saldo.selectCash": "Pilih Tunai",
        "saldo.selectCreditCard": "Pilih Kartu Kredit",
        "saldo.selectInvestment": "Pilih Investasi",
        "saldo.customOption": "Custom / Lainnya",
        "saldo.initialBalance": "Saldo Awal",
        "saldo.back": "Kembali",
        "saldo.addAccountSuccess": "Akun berhasil ditambahkan",
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
        "nav.transfer": "Internal Transfer",

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
        "common.confirm": "Confirm",
        "common.success": "Success",
        "common.failed": "Failed",
        "common.transfer": "Transfer",
        "common.sourceAccount": "Source Account",
        "common.targetAccount": "Target Account",

        // Dashboard
        "dashboard.title": "Home",
        "dashboard.balance": "Current Balance",
        "dashboard.income": "Income",
        "dashboard.expense": "Expense",
        "dashboard.recentTransactions": "Recent Transactions",
        "dashboard.viewAll": "View All",
        "dashboard.aiInsight": "AI Insight",

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
        "profile.language": "Language",
        "profile.theme": "Theme",

        // Features
        "features.allFeatures": "All Features",
        "features.explore": "Explore Monev Capabilities",
        "features.ready": "Ready",
        "features.soon": "Soon",
        "features.upgrade": "Upgrade",

        // Dashboard Features
        "features.monev_ai": "Monev AI",
        "features.analytics": "Analytics",
        "features.budgets": "Budgets",
        "features.savings": "Savings",
        "features.simulations": "Simulations",
        "features.bills": "Bills",
        "features.investments": "Investments",
        "features.debts": "Debts",
        "features.recurring": "Recurring",
        "nav.balances": "Balances",

        // Saldo / Balances
        "saldo.title": "Balances & Accounts",
        "saldo.subtitle": "Manage all your wallets",
        "saldo.netWorth": "Total Net Worth",
        "saldo.accountsCount": "Registered Accounts",
        "saldo.noAccounts": "No accounts yet",
        "saldo.addSample": "Add Bank, E-Wallet, or Cash.",
        "saldo.addAccount": "Add New Account",
        "saldo.accountName": "Account Name",
        "saldo.accountType": "Type",
        "saldo.currentBalance": "Current Balance",
        "saldo.saveAccount": "Save Account",
        "saldo.type.bank": "Bank",
        "saldo.type.emoney": "E-Money",
        "saldo.type.cash": "Cash",
        "saldo.type.credit_card": "Credit Card",
        "saldo.type.investment": "Investment",
        "saldo.quickAdd": "Quick Add",
        "saldo.selectType": "Select Type",
        "saldo.selectBank": "Select Bank",
        "saldo.selectEmoney": "Select E-Money",
        "saldo.selectCash": "Select Cash",
        "saldo.selectCreditCard": "Select Credit Card",
        "saldo.selectInvestment": "Select Investment",
        "saldo.customOption": "Custom / Other",
        "saldo.initialBalance": "Initial Balance",
        "saldo.back": "Back",
        "saldo.addAccountSuccess": "Account added successfully",
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
