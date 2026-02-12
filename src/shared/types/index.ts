// Shared types between frontend and backend

export interface Transaction {
    id: string;
    amount: number;
    description: string;
    category: string;
    type: "expense" | "income" | "transfer";
    created_at: string;
    is_verified: boolean;
}

export interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

export interface Budget {
    id: number;
    categoryId: number;
    amount: number;
    month: number;
    year: number;
}

export interface Goal {
    id: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: Date;
    icon: string;
    color: string;
}

export interface MonthlyStats {
    income: number;
    expense: number;
    balance: number;
}
