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

// Types
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type MerchantMapping = typeof merchantMappings.$inferSelect;

// Insert types
export type InsertCategory = typeof categories.$inferInsert;
export type InsertTransaction = typeof transactions.$inferInsert;
export type InsertBudget = typeof budgets.$inferInsert;
export type InsertGoal = typeof goals.$inferInsert;
export type InsertMerchantMapping = typeof merchantMappings.$inferInsert;

// Zod schemas
export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);
export const insertBudgetSchema = createInsertSchema(budgets);
export const selectBudgetSchema = createSelectSchema(budgets);
export const insertGoalSchema = createInsertSchema(goals);
export const selectGoalSchema = createSelectSchema(goals);
