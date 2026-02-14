import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    icon: text("icon").notNull().default("Wallet"),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    telegramId: integer("telegram_id").unique().notNull(),
    username: text("username"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    whatsappId: text("whatsapp_id"), // Number in international format e.g. 62812...
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    amount: real("amount").notNull(),
    description: text("description").notNull(),
    merchantName: text("merchant_name"),
    categoryId: integer("category_id").references(() => categories.id),
    type: text("type", { enum: ["expense", "income", "transfer"] }).notNull().default("expense"),
    paymentMethod: text("payment_method").default("cash"),
    date: integer("date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const budgets = sqliteTable("budgets", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoryId: integer("category_id").references(() => categories.id).notNull(),
    amount: real("amount").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const goals = sqliteTable("goals", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    targetAmount: real("target_amount").notNull(),
    currentAmount: real("current_amount").notNull().default(0),
    deadline: integer("deadline", { mode: "timestamp" }),
    icon: text("icon").notNull().default("Target"),
    color: text("color").notNull().default("#3b82f6"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const merchantMappings = sqliteTable("merchant_mappings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    merchantName: text("merchant_name").notNull(),
    categoryId: integer("category_id").references(() => categories.id).notNull(),
    confidence: real("confidence").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const userSettings = sqliteTable("user_settings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    hourlyRate: real("hourly_rate").notNull().default(50000),
    primaryGoalId: integer("primary_goal_id").references(() => goals.id),
    securityPin: text("security_pin"),
    isAppLockEnabled: integer("is_app_lock_enabled", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const debts = sqliteTable("debts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    debtorName: text("debtor_name").notNull(),
    amount: real("amount").notNull(), // Positive = Receivables (Piutang), Negative = Payables (Utang)
    description: text("description"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    status: text("status", { enum: ["unpaid", "paid"] }).notNull().default("unpaid"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const scheduledMessages = sqliteTable("scheduled_messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    message: text("message").notNull(),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    status: text("status", { enum: ["pending", "sent", "failed"] }).notNull().default("pending"),
    type: text("type", { enum: ["stock_opname", "reminder", "other"] }).default("other"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const bills = sqliteTable("bills", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    amount: real("amount").notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    dueDate: integer("due_date").notNull().default(1), // day of month (1-31)
    frequency: text("frequency", { enum: ["monthly", "weekly", "yearly"] }).notNull().default("monthly"),
    isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
    lastPaidAt: integer("last_paid_at", { mode: "timestamp" }),
    icon: text("icon").notNull().default("Receipt"),
    color: text("color").notNull().default("#6366f1"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const investments = sqliteTable("investments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(), // e.g. BTC, BBCA, Emas
    type: text("type", { enum: ["stock", "crypto", "mutual_fund", "gold", "bond", "other"] }).notNull().default("other"),
    quantity: real("quantity").notNull(), // lembar/koin/gram
    avgBuyPrice: real("avg_buy_price").notNull(), // harga beli rata-rata
    currentPrice: real("current_price").notNull(), // harga pasar saat ini (manual update)
    platform: text("platform"), // Bibit, Ajaib, Indodax, dll
    icon: text("icon").notNull().default("TrendingUp"),
    color: text("color").notNull().default("#10b981"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Types
export type Category = typeof categories.$inferSelect;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type MerchantMapping = typeof merchantMappings.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type Investment = typeof investments.$inferSelect;

// Insert types
export type InsertCategory = typeof categories.$inferInsert;
export type InsertTransaction = typeof transactions.$inferInsert;
export type InsertBudget = typeof budgets.$inferInsert;
export type InsertGoal = typeof goals.$inferInsert;
export type InsertMerchantMapping = typeof merchantMappings.$inferInsert;
export type InsertUserSettings = typeof userSettings.$inferInsert;
export type InsertDebt = typeof debts.$inferInsert;
export type InsertScheduledMessage = typeof scheduledMessages.$inferInsert;
export type InsertBill = typeof bills.$inferInsert;
export type InsertInvestment = typeof investments.$inferInsert;

// Zod schemas
export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);
export const insertBudgetSchema = createInsertSchema(budgets);
export const selectBudgetSchema = createSelectSchema(budgets);
export const insertGoalSchema = createInsertSchema(goals);
export const selectGoalSchema = createSelectSchema(goals);
export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const selectUserSettingsSchema = createSelectSchema(userSettings);
export const insertBillSchema = createInsertSchema(bills);
export const selectBillSchema = createSelectSchema(bills);
export const insertInvestmentSchema = createInsertSchema(investments);
export const selectInvestmentSchema = createSelectSchema(investments);
