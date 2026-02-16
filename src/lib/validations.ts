import { z } from "zod";

// PIN validation
export const pinSchema = z
    .string()
    .length(6, "PIN harus 6 digit")
    .regex(/^[0-9]+$/, "PIN hanya boleh berisi angka");

// Security settings validation
export const securitySettingsSchema = z.object({
    securityPin: z.union([pinSchema, z.literal("")]).optional(),
    isAppLockEnabled: z.boolean(),
});

// Profile validation
export const profileSchema = z.object({
    firstName: z.string().max(100, "Nama terlalu panjang").optional(),
    lastName: z.string().max(100, "Nama terlalu panjang").optional(),
    username: z
        .string()
        .min(3, "Username minimal 3 karakter")
        .max(30, "Username maksimal 30 karakter")
        .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore")
        .optional(),
    whatsappId: z
        .string()
        .regex(/^[0-9]+$/, "Nomor WhatsApp tidak valid")
        .optional(),
    telegramId: z.string().optional(),
});

// Financial settings validation
export const financialSettingsSchema = z.object({
    hourlyRate: z
        .number()
        .min(0, "Hourly rate tidak boleh negatif")
        .max(100000000, "Hourly rate terlalu tinggi")
        .optional(),
    primaryGoalId: z.number().optional(),
});

// Transaction validation
export const transactionSchema = z.object({
    amount: z.number().positive("Jumlah harus positif").max(100000000000, "Jumlah terlalu besar"),
    description: z
        .string()
        .min(1, "Deskripsi wajib diisi")
        .max(500, "Deskripsi terlalu panjang"),
    merchantName: z.string().max(200).optional(),
    categoryId: z.number().int().positive("Kategori wajib dipilih"),
    type: z.enum(["expense", "income", "transfer"]),
    paymentMethod: z.string().max(50).optional(),
});

// Budget validation
export const budgetSchema = z.object({
    categoryId: z.number().int().positive("Kategori wajib dipilih"),
    amount: z.number().positive("Budget harus positif").max(100000000000, "Budget terlalu besar"),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
});

// Goal validation
export const goalSchema = z.object({
    name: z.string().min(1, "Nama goal wajib diisi").max(100, "Nama terlalu panjang"),
    targetAmount: z.number().positive("Target harus positif").max(1000000000000, "Target terlalu besar"),
    currentAmount: z.number().min(0).optional(),
    deadline: z.date().optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(7).optional(), // hex color like #RRGGBB
});

// Bill validation
export const billSchema = z.object({
    name: z.string().min(1, "Nama tagihan wajib diisi").max(100),
    amount: z.number().positive("Jumlah harus positif"),
    categoryId: z.number().int().optional(),
    dueDate: z.number().int().min(1).max(31).optional(),
    frequency: z.enum(["monthly", "weekly", "yearly"]),
    icon: z.string().max(50).optional(),
    color: z.string().max(7).optional(),
    notes: z.string().max(500).optional(),
});

// Investment validation
export const investmentSchema = z.object({
    name: z.string().min(1, "Nama investasi wajib diisi").max(100),
    type: z.enum(["stock", "crypto", "mutual_fund", "gold", "bond", "other"]),
    quantity: z.number().positive("Quantity harus positif"),
    avgBuyPrice: z.number().positive("Harga beli harus positif"),
    currentPrice: z.number().positive("Harga saat ini harus positif"),
    platform: z.string().max(100).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(7).optional(),
    notes: z.string().max(1000).optional(),
});

// Type exports
export type PinInput = z.infer<typeof pinSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type FinancialSettingsInput = z.infer<typeof financialSettingsSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type BillInput = z.infer<typeof billSchema>;
export type InvestmentInput = z.infer<typeof investmentSchema>;
