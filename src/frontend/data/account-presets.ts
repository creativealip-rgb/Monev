export interface AccountPreset {
    name: string;
    color: string;
    icon: string;
}

export const ACCOUNT_PRESETS: Record<string, AccountPreset[]> = {
    bank: [
        { name: "BCA", color: "#00529C", icon: "Landmark" },
        { name: "BRI", color: "#0066CC", icon: "Landmark" },
        { name: "Mandiri", color: "#0E7B34", icon: "Landmark" },
        { name: "BNI", color: "#0085C8", icon: "Landmark" },
        { name: "Jago", color: "#00D4AA", icon: "Landmark" },
        { name: "BTPN", color: "#FF6B00", icon: "Landmark" },
        { name: "SeaBank", color: "#0055B8", icon: "Landmark" },
        { name: "Allo Bank", color: "#6C28D7", icon: "Landmark" },
        { name: "Permata", color: "#00B14F", icon: "Landmark" },
        { name: "Danamon", color: "#FDB913", icon: "Landmark" },
        { name: "OCBC", color: "#003DA5", icon: "Landmark" },
        { name: "UOB", color: "#0033A0", icon: "Landmark" },
        { name: "CIMB Niaga", color: "#D9292E", icon: "Landmark" },
        { name: "Panin", color: "#00529C", icon: "Landmark" },
        { name: "Maybank", color: "#E6001A", icon: "Landmark" },
    ],
    emoney: [
        { name: "GoPay", color: "#00AA13", icon: "Smartphone" },
        { name: "OVO", color: "#4C3494", icon: "Smartphone" },
        { name: "DANA", color: "#118EEA", icon: "Smartphone" },
        { name: "ShopeePay", color: "#EE4D2D", icon: "Smartphone" },
        { name: "LinkAja", color: "#ED3036", icon: "Smartphone" },
    ],
    cash: [
        { name: "Cash", color: "#10B981", icon: "Banknote" },
        { name: "Dompet", color: "#14B8A6", icon: "Wallet" },
    ],
    credit_card: [
        { name: "BCA Card", color: "#00529C", icon: "CreditCard" },
        { name: "Mandiri Card", color: "#0E7B34", icon: "CreditCard" },
        { name: "BNI Card", color: "#0085C8", icon: "CreditCard" },
        { name: "CIMB Niaga", color: "#D9292E", icon: "CreditCard" },
        { name: "Citibank", color: "#003B70", icon: "CreditCard" },
        { name: "Standard Chartered", color: "#003DA5", icon: "CreditCard" },
        { name: "HSBC", color: "#DB0011", icon: "CreditCard" },
        { name: "UOB Card", color: "#0033A0", icon: "CreditCard" },
    ],
    investment_wallet: [
        { name: "Bibit", color: "#5F9EA0", icon: "Wallet" },
        { name: "Ajaib", color: "#E63232", icon: "Wallet" },
        { name: "Stockbit", color: "#2E5CFF", icon: "Wallet" },
        { name: "Reksaoku", color: "#F97316", icon: "Wallet" },
        { name: "Pluang", color: "#F4B400", icon: "Wallet" },
        { name: "Gotrade", color: "#FF6B35", icon: "Wallet" },
        { name: "Nanovest", color: "#8B5CF6", icon: "Wallet" },
    ],
};

export const ACCOUNT_TYPES = [
    { id: "bank", label: "Bank", icon: "Landmark", color: "#3B82F6" },
    { id: "emoney", label: "E-Money", icon: "Smartphone", color: "#10B981" },
    { id: "cash", label: "Tunai", icon: "Banknote", color: "#F59E0B" },
    { id: "credit_card", label: "Kartu Kredit", icon: "CreditCard", color: "#EF4444" },
    { id: "investment_wallet", label: "Investasi", icon: "Wallet", color: "#8B5CF6" },
];

export const QUICK_ADD_PRESETS = [
    ACCOUNT_PRESETS.bank[0],
    ACCOUNT_PRESETS.bank[1],
    ACCOUNT_PRESETS.emoney[0],
    ACCOUNT_PRESETS.bank[2],
    ACCOUNT_PRESETS.cash[0],
];
