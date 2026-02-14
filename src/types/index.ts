export type Transaction = {
    id: string;
    amount: number;
    description: string;
    merchant_name?: string;
    category: string;
    categoryId?: number;
    type: 'expense' | 'income' | 'transfer';
    payment_method?: string;
    created_at: string;
    is_verified: boolean;
};

export type User = {
    id: string;
    full_name: string;
    username: string;
    subscription_tier: 'free' | 'pro' | 'expert';
};

export type Budget = {
    id: number;
    category: string;
    categoryId: number;
    limit: number;
    spent: number;
    color: string;
    percentage: number;
};

export type Goal = {
    id: number;
    name: string;
    target: number;
    saved: number;
    percentage: number;
    icon: string;
    color: string;
    deadline?: string;
};

export type Bill = {
    id: number;
    name: string;
    amount: number;
    categoryId: number | null;
    dueDate: number;
    frequency: "monthly" | "weekly" | "yearly";
    isPaid: boolean;
    lastPaidAt: string | null;
    icon: string;
    color: string;
    isActive: boolean;
    notes: string | null;
};

export type Investment = {
    id: number;
    name: string;
    type: "stock" | "crypto" | "mutual_fund" | "gold" | "bond" | "other";
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    platform: string | null;
    icon: string;
    color: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};
