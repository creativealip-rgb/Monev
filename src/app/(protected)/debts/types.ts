export interface Debt {
    id: number;
    debtorName: string;
    amount: number;
    description: string;
    dueDate: Date | null;
    status: "unpaid" | "paid";
    direction: "owe" | "owed";
    createdAt: Date;
}