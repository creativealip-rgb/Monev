import { z } from "zod";

// Transaction schemas
export const CreateTransactionSchema = z.object({
    amount: z.number().positive("Jumlah harus lebih dari 0"),
    description: z.string().min(1, "Deskripsi wajib diisi").max(255, "Deskripsi maksimal 255 karakter"),
    categoryId: z.number().optional(),
    type: z.enum(["income", "expense", "transfer"]).refine(
        (val) => ["income", "expense", "transfer"].includes(val),
        { message: "Tipe transaksi tidak valid" }
    ),
    date: z.date().default(() => new Date()),
    accountId: z.number().optional(),
    merchantName: z.string().max(100).optional(),
    paymentMethod: z.string().default("cash"),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial().extend({
    id: z.number(),
});

// Budget schemas
export const CreateBudgetSchema = z.object({
    categoryId: z.number(),
    limitAmount: z.number().positive("Limit harus lebih dari 0"),
    period: z.enum(["monthly", "weekly", "yearly"]).default("monthly"),
    rollover: z.boolean().default(false),
});

// Goal schemas
export const CreateGoalSchema = z.object({
    name: z.string().min(1, "Nama tujuan wajib diisi").max(100),
    targetAmount: z.number().positive("Target harus lebih dari 0"),
    deadline: z.date().optional(),
    autoTransferAmount: z.number().min(0).default(0),
});

export const UpdateGoalSchema = CreateGoalSchema.partial().extend({
    id: z.number(),
});

// Bill schemas
export const CreateBillSchema = z.object({
    name: z.string().min(1, "Nama tagihan wajib diisi").max(100),
    amount: z.number().positive("Jumlah harus lebih dari 0"),
    dueDate: z.date(),
    frequency: z.enum(["monthly", "weekly", "yearly", "once"]).default("monthly"),
    categoryId: z.number().optional(),
});

// Investment schemas
export const CreateInvestmentSchema = z.object({
    name: z.string().min(1, "Nama investasi wajib diisi"),
    type: z.enum(["stock", "crypto", "mutual_fund", "bond", "gold", "other"]),
    quantity: z.number().positive("Jumlah harus lebih dari 0"),
    currentPrice: z.number().positive("Harga harus lebih dari 0"),
    platform: z.string().max(50).optional(),
});

// Export types
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type CreateBillInput = z.infer<typeof CreateBillSchema>;
export type CreateInvestmentInput = z.infer<typeof CreateInvestmentSchema>;
