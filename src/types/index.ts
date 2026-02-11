export type Transaction = {
    id: string;
    amount: number;
    description: string;
    merchant_name?: string;
    category: string;
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
