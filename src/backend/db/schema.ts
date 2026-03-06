import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const categories = sqliteTable("categories", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id), // Null = Global system category, Not Null = User specific
    name: text("name").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    icon: text("icon").notNull().default("Wallet"),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    telegramId: integer("telegram_id").unique(),
    email: text("email").unique(),
    emailVerified: integer("email_verified", { mode: "timestamp" }),
    password: text("password"),
    name: text("name"),
    image: text("image"),
    username: text("username"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    whatsappId: text("whatsapp_id"),
    tier: text("tier", { enum: ["miskin", "kaya", "sultan"] }).notNull().default("miskin"),
    tierExpiresAt: integer("tier_expires_at", { mode: "timestamp" }),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    amount: real("amount").notNull(),
    description: text("description").notNull(),
    merchantName: text("merchant_name"),
    categoryId: integer("category_id").references(() => categories.id),
    type: text("type", { enum: ["expense", "income", "transfer", "withdraw"] }).notNull().default("expense"),
    paymentMethod: text("payment_method").default("cash"),
    destinationType: text("destination_type", { enum: ["goal", "investment", "bill"] }),
    destinationId: integer("destination_id"),
    sourceType: text("source_type", { enum: ["goal", "investment"] }),
    sourceId: integer("source_id"),
    fee: real("fee").default(0),
    accountId: integer("account_id").references(() => accounts.id),
    targetAccountId: integer("target_account_id").references(() => accounts.id), // For internal transfers
    date: integer("date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
    isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
    splitGroupId: text("split_group_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_transactions_user_id").on(table.userId),
    dateIdx: index("idx_transactions_date").on(table.date),
    typeIdx: index("idx_transactions_type").on(table.type),
    categoryIdIdx: index("idx_transactions_category_id").on(table.categoryId),
    userIdDateIdx: index("idx_transactions_user_date").on(table.userId, table.date),
}));

export const budgets = sqliteTable("budgets", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(), // New: SaaS Isolation
    categoryId: integer("category_id").references(() => categories.id).notNull(),
    amount: real("amount").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_budgets_user_id").on(table.userId),
    monthYearIdx: index("idx_budgets_month_year").on(table.month, table.year),
    userIdMonthYearIdx: index("idx_budgets_user_month_year").on(table.userId, table.month, table.year),
}));

export const goals = sqliteTable("goals", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(), // New: SaaS Isolation
    name: text("name").notNull(),
    targetAmount: real("target_amount").notNull(),
    currentAmount: real("current_amount").notNull().default(0),
    deadline: integer("deadline", { mode: "timestamp" }),
    icon: text("icon").notNull().default("Target"),
    color: text("color").notNull().default("#3b82f6"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_goals_user_id").on(table.userId),
}));

export const merchantMappings = sqliteTable("merchant_mappings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(), // New: SaaS Isolation
    merchantName: text("merchant_name").notNull(),
    categoryId: integer("category_id").references(() => categories.id).notNull(),
    confidence: real("confidence").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const userSettings = sqliteTable("user_settings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).unique().notNull(), // New: Link to User
    hourlyRate: real("hourly_rate").notNull().default(50000),
    primaryGoalId: integer("primary_goal_id").references(() => goals.id),
    securityPin: text("security_pin"),
    isAppLockEnabled: integer("is_app_lock_enabled", { mode: "boolean" }).notNull().default(false),
    isBiometricEnabled: integer("is_biometric_enabled", { mode: "boolean" }).notNull().default(false),
    hideBalance: integer("hide_balance", { mode: "boolean" }).notNull().default(false), // New: Hide balance on dashboard
    notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).notNull().default(true), // New: Persistence for notifications
    hasCompletedOnboarding: integer("has_completed_onboarding", { mode: "boolean" }).notNull().default(false), // New: Track onboarding status
    financialPersona: text("financial_persona"), // AI generated persona
    personaUpdatedAt: integer("persona_updated_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    name: text("name").notNull(),
    type: text("type", { enum: ["bank", "emoney", "cash", "credit_card", "investment_wallet"] }).notNull().default("bank"),
    balance: real("balance").notNull().default(0),
    color: text("color").notNull().default("#3b82f6"),
    icon: text("icon").notNull().default("Wallet"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_accounts_user_id").on(table.userId),
}));

export const debts = sqliteTable("debts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    debtorName: text("debtor_name").notNull(),
    amount: real("amount").notNull(),
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
    userId: integer("user_id").references(() => users.id).notNull(), // New: SaaS Isolation
    name: text("name").notNull(),
    amount: real("amount").notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    dueDate: integer("due_date").notNull().default(1),
    frequency: text("frequency", { enum: ["monthly", "weekly", "yearly"] }).notNull().default("monthly"),
    isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
    lastPaidAt: integer("last_paid_at", { mode: "timestamp" }),
    icon: text("icon").notNull().default("Receipt"),
    color: text("color").notNull().default("#6366f1"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isSubscription: integer("is_subscription", { mode: "boolean" }).notNull().default(false),
    lastDetectedDate: integer("last_detected_date", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_bills_user_id").on(table.userId),
    isActiveIdx: index("idx_bills_is_active").on(table.isActive),
}));

export const chatHistory = sqliteTable("chat_history", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    role: text("role", { enum: ["user", "assistant"] }).notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_chat_history_user_id").on(table.userId),
    createdAtIdx: index("idx_chat_history_created_at").on(table.createdAt),
}));

export const investments = sqliteTable("investments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(), // New: SaaS Isolation
    name: text("name").notNull(),
    type: text("type", { enum: ["stock", "crypto", "mutual_fund", "gold", "bond", "other"] }).notNull().default("other"),
    quantity: real("quantity").notNull(),
    avgBuyPrice: real("avg_buy_price").notNull(),
    currentPrice: real("current_price").notNull(),
    platform: text("platform"),
    icon: text("icon").notNull().default("TrendingUp"),
    color: text("color").notNull().default("#10b981"),
    notes: text("notes"),
    totalDividends: real("total_dividends").default(0), // New: Track passive income
    realizedProfit: real("realized_profit").default(0), // New: Track profit from partial sells
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_investments_user_id").on(table.userId),
    typeIdx: index("idx_investments_type").on(table.type),
}));

export const coupons = sqliteTable("coupons", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").unique().notNull(),
    tier: text("tier", { enum: ["kaya", "sultan"] }).notNull(),
    quota: integer("quota").notNull().default(1),
    claimedCount: integer("claimed_count").notNull().default(0),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const couponClaims = sqliteTable("coupon_claims", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    couponId: integer("coupon_id").references(() => coupons.id).notNull(),
    userId: integer("user_id").references(() => users.id).notNull(),
    claimedAt: integer("claimed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const adminActivityLog = sqliteTable("admin_activity_log", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    adminId: integer("admin_id").references(() => users.id).notNull(),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: integer("target_id"),
    details: text("details"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const aiInsightsCache = sqliteTable("ai_insights_cache", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    insights: text("insights").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_ai_insights_user_id").on(table.userId),
    monthYearIdx: index("idx_ai_insights_month_year").on(table.month, table.year),
}));

export const verificationTokens = sqliteTable("verification_tokens", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    identifier: text("identifier").notNull(), // email address being verified
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    identifier: text("identifier").notNull(), // email address being reset
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const recurringTransactions = sqliteTable("recurring_transactions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    amount: real("amount").notNull(),
    description: text("description").notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    frequency: text("frequency", { enum: ["daily", "weekly", "monthly"] }).notNull().default("monthly"),
    nextRunAt: integer("next_run_at", { mode: "timestamp" }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const streaks = sqliteTable("streaks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).unique().notNull(),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastTransactionDate: integer("last_transaction_date", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const achievements = sqliteTable("achievements", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    type: text("type").notNull(), // e.g., 'streak_7', 'budget_hero', 'wealth_master'
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
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
export type ChatHistory = typeof chatHistory.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type CouponClaim = typeof couponClaims.$inferSelect;
export type AdminActivityLog = typeof adminActivityLog.$inferSelect;
export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;
export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type InsertRecurringTransaction = typeof recurringTransactions.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;

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
export type InsertChatHistory = typeof chatHistory.$inferInsert;
export type InsertAccount = typeof accounts.$inferInsert;
export type InsertInvestment = typeof investments.$inferInsert;
export type InsertCoupon = typeof coupons.$inferInsert;
export type InsertCouponClaim = typeof couponClaims.$inferInsert;
export type InsertAdminActivityLog = typeof adminActivityLog.$inferInsert;
export type InsertAiInsightsCache = typeof aiInsightsCache.$inferInsert;
export type InsertStreak = typeof streaks.$inferInsert;
export type InsertAchievement = typeof achievements.$inferInsert;

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
export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);
export const insertInvestmentSchema = createInsertSchema(investments);
export const selectInvestmentSchema = createSelectSchema(investments);
export const insertCouponSchema = createInsertSchema(coupons);
export const selectCouponSchema = createSelectSchema(coupons);
export const insertStreakSchema = createInsertSchema(streaks);
export const selectStreakSchema = createSelectSchema(streaks);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);
