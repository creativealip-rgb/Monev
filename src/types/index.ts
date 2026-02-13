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
