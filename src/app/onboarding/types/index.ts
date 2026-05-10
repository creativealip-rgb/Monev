export interface FeatureSlide {
    id: number;
    icon: string;
    title: string;
    description: string;
    image?: string;
}

export interface OnboardingFormData {
    currency: string;
    language: string;
    pin: string;
    notifications: boolean;
    initialBalance: number;
    monthlyIncome: number;
    budgetRecommendations?: BudgetRecommendation[];
    accounts?: OnboardingAccount[];
}

export interface BudgetRecommendation {
    category: string;
    amount: number;
    percentage: number;
}

export interface OnboardingAccount {
    name: string;
    type: "bank" | "ewallet" | "cash";
    balance: number;
}

export interface OnboardingState {
    currentScreen: number;
    totalScreens: number;
    formData: OnboardingFormData;
    isComplete: boolean;
}

export type OnboardingScreen = "welcome" | "features" | "setup" | "cta";

export const FEATURES: FeatureSlide[] = [
    {
        id: 1,
        icon: "Receipt",
        title: "Catat Transaksi dalam Sekejap",
        description: "Rekam pemasukan dan pengeluaran dengan mudah, kapan saja dan di mana saja",
        image: "/images/onboarding-budget.png",
    },
    {
        id: 2,
        icon: "BarChart3",
        title: "Analisis Keuangan Otomatis",
        description: "Lihat laporan mingguan dan bulanan untuk mengontrol keuanganmu dengan bijak",
        image: "/images/onboarding-ai.png",
    },
    {
        id: 3,
        icon: "Target",
        title: "Wujudkan Tujuan Keuangan",
        description: "Buat target tabungan dan pantau perkembangannya secara real-time",
    },
    {
        id: 4,
        icon: "Shield",
        title: "Data Aman & Terenkripsi",
        description: "Informasi keuanganmu dilindungi dengan enkripsi dan privasi terjamin",
    },
];

export const CURRENCIES = [
    { code: "IDR" },
    { code: "USD" },
    { code: "EUR" },
    { code: "SGD" },
    { code: "MYR" },
];

export const LANGUAGES = [
    { code: "id", name: "Bahasa Indonesia" },
    { code: "en", name: "English" },
];
