import { sqliteTable, AnySQLiteColumn, index, foreignKey, integer, real, text, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const budgets = sqliteTable("budgets", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	categoryId: integer("category_id").notNull().references(() => categories.id),
	amount: real().notNull(),
	month: integer().notNull(),
	year: integer().notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	index("idx_budgets_user_month_year").on(table.userId, table.month, table.year),
	index("idx_budgets_month_year").on(table.month, table.year),
	index("idx_budgets_user_id").on(table.userId),
]);

export const chatHistory = sqliteTable("chat_history", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	index("idx_chat_history_created_at").on(table.createdAt),
	index("idx_chat_history_user_id").on(table.userId),
]);

export const debts = sqliteTable("debts", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	debtorName: text("debtor_name").notNull(),
	amount: real().notNull(),
	description: text(),
	dueDate: integer("due_date"),
	status: text().default("unpaid").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const goals = sqliteTable("goals", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	name: text().notNull(),
	targetAmount: real("target_amount").notNull(),
	currentAmount: real("current_amount").notNull(),
	deadline: integer(),
	icon: text().default("Target").notNull(),
	color: text().default("#3b82f6").notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	index("idx_goals_user_id").on(table.userId),
]);

export const investments = sqliteTable("investments", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	name: text().notNull(),
	type: text().default("other").notNull(),
	quantity: real().notNull(),
	avgBuyPrice: real("avg_buy_price").notNull(),
	currentPrice: real("current_price").notNull(),
	platform: text(),
	icon: text().default("TrendingUp").notNull(),
	color: text().default("#10b981").notNull(),
	notes: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	totalDividends: real("total_dividends"),
	realizedProfit: real("realized_profit"),
},
(table) => [
	index("idx_investments_type").on(table.type),
	index("idx_investments_user_id").on(table.userId),
]);

export const merchantMappings = sqliteTable("merchant_mappings", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	merchantName: text("merchant_name").notNull(),
	categoryId: integer("category_id").notNull().references(() => categories.id),
	confidence: real().default(1).notNull(),
	createdAt: integer("created_at").notNull(),
});

export const scheduledMessages = sqliteTable("scheduled_messages", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	message: text().notNull(),
	scheduledAt: integer("scheduled_at").notNull(),
	status: text().default("pending").notNull(),
	type: text().default("other"),
	createdAt: integer("created_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	amount: real().notNull(),
	description: text().notNull(),
	merchantName: text("merchant_name"),
	categoryId: integer("category_id").references(() => categories.id),
	type: text().default("expense").notNull(),
	paymentMethod: text("payment_method").default("cash"),
	destinationType: text("destination_type"),
	destinationId: integer("destination_id"),
	date: integer().notNull(),
	isVerified: integer("is_verified").default(false).notNull(),
	isRecurring: integer("is_recurring").default(false).notNull(),
	createdAt: integer("created_at").notNull(),
	sourceType: text("source_type"),
	sourceId: integer("source_id"),
	fee: real(),
	splitGroupId: text("split_group_id"),
	accountId: integer("account_id"),
	targetAccountId: integer("target_account_id"),
},
(table) => [
	index("idx_transactions_user_date").on(table.userId, table.date),
	index("idx_transactions_category_id").on(table.categoryId),
	index("idx_transactions_type").on(table.type),
	index("idx_transactions_date").on(table.date),
	index("idx_transactions_user_id").on(table.userId),
]);

export const adminActivityLog = sqliteTable("admin_activity_log", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	adminId: integer("admin_id").notNull().references(() => users.id),
	action: text().notNull(),
	targetType: text("target_type"),
	targetId: integer("target_id"),
	details: text(),
	createdAt: integer("created_at").notNull(),
});

export const coupons = sqliteTable("coupons", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	code: text().notNull(),
	tier: text().notNull(),
	quota: integer().default(1).notNull(),
	claimedCount: integer("claimed_count").default(0).notNull(),
	expiresAt: integer("expires_at"),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	uniqueIndex("coupons_code_unique").on(table.code),
]);

export const couponClaims = sqliteTable("coupon_claims", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	couponId: integer("coupon_id").notNull().references(() => coupons.id),
	userId: integer("user_id").notNull().references(() => users.id),
	claimedAt: integer("claimed_at").notNull(),
});

export const users = sqliteTable("users", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	telegramId: integer("telegram_id"),
	email: text(),
	password: text(),
	name: text(),
	image: text(),
	username: text(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	whatsappId: text("whatsapp_id"),
	tier: text().default("miskin").notNull(),
	tierExpiresAt: integer("tier_expires_at"),
	isAdmin: integer("is_admin").default(false).notNull(),
	isActive: integer("is_active").default(true).notNull(),
	createdAt: integer("created_at").notNull(),
	emailVerified: integer("email_verified"),
},
(table) => [
	uniqueIndex("users_email_unique").on(table.email),
	uniqueIndex("users_telegram_id_unique").on(table.telegramId),
]);

export const aiInsightsCache = sqliteTable("ai_insights_cache", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	month: integer().notNull(),
	year: integer().notNull(),
	insights: text().notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	index("idx_ai_insights_month_year").on(table.month, table.year),
	index("idx_ai_insights_user_id").on(table.userId),
]);

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	identifier: text().notNull(),
	token: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	uniqueIndex("password_reset_tokens_token_unique").on(table.token),
]);

export const verificationTokens = sqliteTable("verification_tokens", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	identifier: text().notNull(),
	token: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	uniqueIndex("verification_tokens_token_unique").on(table.token),
]);

export const achievements = sqliteTable("achievements", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	type: text().notNull(),
	name: text().notNull(),
	description: text(),
	icon: text(),
	unlockedAt: integer("unlocked_at").notNull(),
});

export const streaks = sqliteTable("streaks", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	lastTransactionDate: integer("last_transaction_date"),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	uniqueIndex("streaks_user_id_unique").on(table.userId),
]);

export const bills = sqliteTable("bills", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	name: text().notNull(),
	amount: real().notNull(),
	categoryId: integer("category_id").references(() => categories.id),
	dueDate: integer("due_date").default(1).notNull(),
	frequency: text().default("monthly").notNull(),
	isPaid: integer("is_paid").default(false).notNull(),
	lastPaidAt: integer("last_paid_at"),
	icon: text().default("Receipt").notNull(),
	color: text().default("#6366f1").notNull(),
	isActive: integer("is_active").default(true).notNull(),
	isSubscription: integer("is_subscription").default(false).notNull(),
	lastDetectedDate: integer("last_detected_date"),
	notes: text(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	index("idx_bills_is_active").on(table.isActive),
	index("idx_bills_user_id").on(table.userId),
]);

export const userSettings = sqliteTable("user_settings", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	hourlyRate: real("hourly_rate").default(50000).notNull(),
	primaryGoalId: integer("primary_goal_id").references(() => goals.id),
	securityPin: text("security_pin"),
	isAppLockEnabled: integer("is_app_lock_enabled").default(false).notNull(),
	isBiometricEnabled: integer("is_biometric_enabled").default(false).notNull(),
	hideBalance: integer("hide_balance").default(false).notNull(),
	notificationsEnabled: integer("notifications_enabled").default(true).notNull(),
	hasCompletedOnboarding: integer("has_completed_onboarding").default(false).notNull(),
	financialPersona: text("financial_persona"),
	personaUpdatedAt: integer("persona_updated_at"),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	uniqueIndex("user_settings_user_id_unique").on(table.userId),
]);

export const recurringTransactions = sqliteTable("recurring_transactions", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	amount: real().notNull(),
	description: text().notNull(),
	categoryId: integer("category_id").references(() => categories.id),
	type: text().default("expense").notNull(),
	frequency: text().default("monthly").notNull(),
	nextRunAt: integer("next_run_at").notNull(),
	isActive: integer("is_active").default(true).notNull(),
	createdAt: integer("created_at").notNull(),
});

export const categories = sqliteTable("categories", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").references(() => users.id),
	name: text().notNull(),
	color: text().default("#3b82f6").notNull(),
	icon: text().default("Wallet").notNull(),
	type: text().default("expense").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const accounts = sqliteTable("accounts", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id").notNull().references(() => users.id),
	name: text().notNull(),
	type: text().default("bank").notNull(),
	balance: real().notNull(),
	color: text().default("#3b82f6").notNull(),
	icon: text().default("Wallet").notNull(),
	isActive: integer("is_active").default(true).notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	index("idx_accounts_user_id").on(table.userId),
]);

export const billPayments = sqliteTable("bill_payments", {
	id: integer().primaryKey({ autoIncrement: true }),
	billId: integer("bill_id").notNull().references(() => bills.id),
	userId: integer("user_id").notNull().references(() => users.id),
	amount: real().notNull(),
	paidAt: integer("paid_at").default(sql`(strftime('%s', 'now'))`).notNull(),
	transactionId: integer("transaction_id").references(() => transactions.id),
	notes: text(),
},
(table) => [
	index("idx_bill_payments_user_id").on(table.userId),
	index("idx_bill_payments_bill_id").on(table.billId),
]);

