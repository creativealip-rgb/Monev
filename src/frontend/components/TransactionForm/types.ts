export interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
    type: "expense" | "income";
}

export interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export interface QuickTemplate {
    id: string;
    label: string;
    amount: number;
    categoryId: number;
    categoryName: string;
    description?: string;
    type: "expense" | "income";
}

export type TransactionType = "expense" | "income" | "transfer";

export interface LastAddedTransaction {
    id?: number;
    amount: number;
    description: string;
}
