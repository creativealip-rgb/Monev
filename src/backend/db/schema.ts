import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
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
    tier: text("tier", { enum: ["starter", "pro", "sultan", "benefactor"] }).notNull().default("starter"),
    tierExpiresAt: integer("tier_expires_at", { mode: "timestamp" }),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    deletionRequestedAt: integer("deletion_requested_at", { mode: "timestamp" }),
    // Onboarding V2 fields
    onboardingVersion: text("onboarding_version").default("v1"),
    onboardingPath: text("onboarding_path", { enum: ["quick", "complete"] }),
    demoDataLoaded: integer("demo_data_loaded", { mode: "boolean" }).notNull().default(false),
    demoDataScope: text("demo_data_scope", { enum: ["quick", "standard", "complete"] }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
    id: text("id").primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    deviceInfo: text("device_info"),
    ipAddress: text("ip_address"),
    lastActiveAt: integer("last_active_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
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
    spent: real("spent").notNull().default(0),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    enableRollover: integer("enable_rollover", { mode: "boolean" }).notNull().default(false),
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
    monthlyIncome: real("monthly_income").notNull().default(0),
    primaryGoalId: integer("primary_goal_id").references(() => goals.id),
    securityPin: text("security_pin"),
    decoyPin: text("decoy_pin"),
    isAppLockEnabled: integer("is_app_lock_enabled", { mode: "boolean" }).notNull().default(false),
    isBiometricEnabled: integer("is_biometric_enabled", { mode: "boolean" }).notNull().default(false),
    hideBalance: integer("hide_balance", { mode: "boolean" }).notNull().default(false), // New: Hide balance on dashboard
    notificationsEnabled: integer("notifications_enabled", { mode: "boolean" }).notNull().default(true), // New: Persistence for notifications
    hasCompletedOnboarding: integer("has_completed_onboarding", { mode: "boolean" }).notNull().default(false), // New: Track onboarding status
    financialPersona: text("financial_persona"), // AI generated persona
    personaUpdatedAt: integer("persona_updated_at", { mode: "timestamp" }),
    // Notification preferences
    dailyReport: integer("daily_report", { mode: "boolean" }).notNull().default(true),
    budgetAlert: integer("budget_alert", { mode: "boolean" }).notNull().default(true),
    transactionUpdate: integer("transaction_update", { mode: "boolean" }).notNull().default(true),
    billReminder: integer("bill_reminder", { mode: "boolean" }).notNull().default(true),
    goalProgress: integer("goal_progress", { mode: "boolean" }).notNull().default(true),
    promoNews: integer("promo_news", { mode: "boolean" }).notNull().default(false),
    pushEnabled: integer("push_enabled", { mode: "boolean" }).notNull().default(true),
    emailEnabled: integer("email_enabled", { mode: "boolean" }).notNull().default(true),
    telegramEnabled: integer("telegram_enabled", { mode: "boolean" }).notNull().default(false),
    quietHoursEnabled: integer("quiet_hours_enabled", { mode: "boolean" }).notNull().default(false),
    quietHoursStart: text("quiet_hours_start").notNull().default("22:00"),
    quietHoursEnd: text("quiet_hours_end").notNull().default("08:00"),
    autoLockTimeout: integer("auto_lock_timeout").notNull().default(300000), // Default 5 minutes in ms
    // Report preferences
    monthlyReportEmail: integer("monthly_report_email", { mode: "boolean" }).notNull().default(true),
    monthlyReportTelegram: integer("monthly_report_telegram", { mode: "boolean" }).notNull().default(true),
    weeklyInsightTelegram: integer("weekly_insight_telegram", { mode: "boolean" }).notNull().default(false),
    reportLocale: text("report_locale", { enum: ["auto", "id", "en"] }).notNull().default("auto"),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const scheduledReports = sqliteTable("scheduled_reports", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    reportMonth: integer("month").notNull(),
    reportYear: integer("year").notNull(),
    locale: text("locale", { enum: ["id", "en"] }).notNull().default("id"),
    status: text("status", { enum: ["pending", "generating", "sent", "failed"] }).notNull().default("pending"),
    emailSentAt: integer("email_sent_at", { mode: "timestamp" }),
    telegramSentAt: integer("telegram_sent_at", { mode: "timestamp" }),
    errorMessage: text("error_message"),
    pdfData: text("pdf_data"), // Base64 encoded PDF for on-demand download
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_scheduled_reports_user_id").on(table.userId),
    monthYearIdx: index("idx_scheduled_reports_month_year").on(table.reportMonth, table.reportYear),
    userIdMonthYearIdx: index("idx_scheduled_reports_user_month_year").on(table.userId, table.reportMonth, table.reportYear),
    statusIdx: index("idx_scheduled_reports_status").on(table.status),
}));

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
    splitGroupId: text("split_group_id"),
    transactionId: integer("transaction_id").references(() => transactions.id),
    isSplitBill: integer("is_split_bill", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const splitBillMembers = sqliteTable("split_bill_members", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    splitGroupId: text("split_group_id").notNull(),
    userId: integer("user_id").references(() => users.id).notNull(),
    name: text("name").notNull(),
    email: text("email"),
    whatsappNumber: text("whatsapp_number"),
    shareAmount: real("share_amount").notNull(),
    paidAmount: real("paid_amount").notNull().default(0),
    status: text("status", { enum: ["pending", "paid", "partial"] }).notNull().default("pending"),
    invitedAt: integer("invited_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    splitGroupIdIdx: index("idx_split_bill_members_group").on(table.splitGroupId),
    userIdIdx: index("idx_split_bill_members_user").on(table.userId),
    statusIdx: index("idx_split_bill_members_status").on(table.status),
}));

export const scheduledMessages = sqliteTable("scheduled_messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    message: text("message").notNull(),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    status: text("status", { enum: ["pending", "sent", "failed"] }).notNull().default("pending"),
    type: text("type", { enum: ["stock_opname", "reminder", "other"] }).default("other"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const adminScheduledNotifications = sqliteTable("admin_scheduled_notifications", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull().default("Reminder"),
    title: text("title").notNull().default("Monev"),
    message: text("message").notNull(),
    target: text("target", { enum: ["all", "tier"] }).notNull().default("all"),
    tier: text("tier", { enum: ["starter", "pro", "sultan", "benefactor"] }),
    hour: integer("hour").notNull(),
    minute: integer("minute").notNull().default(0),
    timezone: text("timezone").notNull().default("Asia/Jakarta"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    lastRunAt: integer("last_run_at", { mode: "timestamp" }),
    lastRunKey: text("last_run_key"),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    isActiveIdx: index("idx_admin_scheduled_notifications_active").on(table.isActive),
    runKeyIdx: index("idx_admin_scheduled_notifications_run_key").on(table.lastRunKey),
}));

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

export const billPayments = sqliteTable("bill_payments", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billId: integer("bill_id").references(() => bills.id).notNull(),
    userId: integer("user_id").references(() => users.id).notNull(),
    amount: real("amount").notNull(),
    paidAt: integer("paid_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    transactionId: integer("transaction_id").references(() => transactions.id),
    notes: text("notes"),
}, (table) => ({
    billIdIdx: index("idx_bill_payments_bill_id").on(table.billId),
    userIdIdx: index("idx_bill_payments_user_id").on(table.userId),
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
    tier: text("tier", { enum: ["pro", "sultan", "benefactor"] }).notNull(),
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

export const aiAnomaliesCache = sqliteTable("ai_anomalies_cache", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    anomalies: text("anomalies").notNull(),
    summary: text("summary").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_ai_anomalies_user_id").on(table.userId),
    monthYearIdx: index("idx_ai_anomalies_month_year").on(table.month, table.year),
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
    accountId: integer("account_id").references(() => accounts.id),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    frequency: text("frequency", { enum: ["daily", "weekly", "monthly"] }).notNull().default("monthly"),
    nextRunAt: integer("next_run_at", { mode: "timestamp" }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const recurringSuggestionStates = sqliteTable("recurring_suggestion_states", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    patternKey: text("pattern_key").notNull(),
    status: text("status").notNull(), // accepted, dismissed
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userPatternIdx: uniqueIndex("idx_recurring_suggestion_states_user_pattern").on(table.userId, table.patternKey),
}));

export const syncQueue = sqliteTable("sync_queue", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    clientMutationId: text("client_mutation_id").notNull(),
    entityType: text("entity_type").notNull(),
    operation: text("operation").notNull(),
    payload: text("payload", { mode: "json" }).notNull(),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    processedAt: integer("processed_at", { mode: "timestamp" }),
}, (table) => ({
    userStatusIdx: index("idx_sync_queue_user_status").on(table.userId, table.status),
    userMutationIdx: uniqueIndex("idx_sync_queue_user_mutation").on(table.userId, table.clientMutationId),
}));

export const syncConflicts = sqliteTable("sync_conflicts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    queueId: integer("queue_id").references(() => syncQueue.id),
    entityType: text("entity_type").notNull(),
    localPayload: text("local_payload", { mode: "json" }).notNull(),
    serverPayload: text("server_payload", { mode: "json" }).notNull(),
    status: text("status").notNull().default("open"),
    resolution: text("resolution"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    resolvedAt: integer("resolved_at", { mode: "timestamp" }),
}, (table) => ({
    userStatusIdx: index("idx_sync_conflicts_user_status").on(table.userId, table.status),
}));

export const streaks = sqliteTable("streaks", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).unique().notNull(),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastTransactionDate: integer("last_transaction_date", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Onboarding V2: Demo data templates
export const demoDataTemplates = sqliteTable("demo_data_templates", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    scope: text("scope", { enum: ["quick", "standard", "complete"] }).notNull(),
    durationDays: integer("duration_days").notNull(),
    transactionCount: integer("transaction_count").notNull(),
    templateData: text("template_data", { mode: "json" }).notNull(), // {accounts, transactions, budgets, bills, goals, recurring}
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Onboarding V2: Achievement definitions (global)
export const achievements = sqliteTable("achievements", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(), // 'onboarding_complete', 'demo_data_loaded', etc.
    name: text("name").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(), // emoji or icon name
    tier: text("tier", { enum: ["bronze", "silver", "gold", "platinum"] }).notNull(),
    points: integer("points").notNull(),
    category: text("category", { enum: ["onboarding", "transaction", "budget", "goal", "streak"] }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Onboarding V2: User achievements (unlocked)
export const userAchievements = sqliteTable("user_achievements", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
    unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    progress: integer("progress").notNull().default(0), // for progressive achievements
}, (table) => ({
    userIdIdx: index("idx_user_achievements_user_id").on(table.userId),
    achievementIdIdx: index("idx_user_achievements_achievement_id").on(table.achievementId),
    userAchievementUnique: uniqueIndex("idx_user_achievements_user_achievement_unique").on(table.userId, table.achievementId),
}));

// Split Bill 2.0 tables.
export const splitBills = sqliteTable("split_bills", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    creatorId: integer("creator_id").notNull().references(() => users.id),
    publicId: text("public_id").notNull().unique(),
    title: text("title").notNull(),
    totalAmount: real("total_amount").notNull(),
    receiptImageUrl: text("receipt_image_url"),
    status: text("status", { enum: ["pending", "partial", "completed"] }).notNull().default("pending"),
    paymentInstructions: text("payment_instructions"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    creatorIdIdx: index("idx_split_bills_creator_id").on(table.creatorId),
    publicIdIdx: uniqueIndex("idx_split_bills_public_id_unique").on(table.publicId),
    statusIdx: index("idx_split_bills_status").on(table.status),
}));

export const splitBillItems = sqliteTable("split_bill_items", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    splitBillId: integer("split_bill_id").notNull().references(() => splitBills.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    price: real("price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    assignedParticipantId: integer("assigned_participant_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    splitBillIdIdx: index("idx_split_bill_items_split_bill_id").on(table.splitBillId),
}));

export const splitBillParticipants = sqliteTable("split_bill_participants", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    splitBillId: integer("split_bill_id").notNull().references(() => splitBills.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone"),
    amountOwed: real("amount_owed").notNull(),
    paymentToken: text("payment_token").notNull(),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    paymentProofUrl: text("payment_proof_url"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    splitBillIdIdx: index("idx_split_bill_participants_split_bill_id").on(table.splitBillId),
    paymentTokenUnique: uniqueIndex("idx_split_bill_participants_payment_token_unique").on(table.paymentToken),
}));

// Push subscriptions table (VAPID Web Push)
export const pushSubscriptions = sqliteTable("push_subscriptions", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    platform: text("platform", { enum: ["web", "android", "ios"] }).notNull().default("web"),
    userAgent: text("user_agent"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_push_subscriptions_user_id").on(table.userId),
    activeIdx: index("idx_push_subscriptions_active").on(table.isActive),
}));

// Notification logs table (audit trail)
export const notificationLogs = sqliteTable("notification_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id).notNull(),
    subscriptionId: integer("subscription_id").references(() => pushSubscriptions.id),
    type: text("type", { enum: ["daily_reminder", "budget_alert", "bill_reminder", "weekly_summary", "recurring_executed", "custom"] }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url"),
    status: text("status", { enum: ["sent", "failed", "skipped"] }).notNull(),
    errorMessage: text("error_message"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_notification_logs_user_id").on(table.userId),
    typeIdx: index("idx_notification_logs_type").on(table.type),
    statusIdx: index("idx_notification_logs_status").on(table.status),
}));



// Smart notification rules generated from user activity and preferences.
export const smartNotificationRules = sqliteTable("smart_notification_rules", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    type: text("type", { enum: ["anomaly_spending", "budget_warning", "positive_reinforcement", "weekly_recap"] }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    severity: text("severity", { enum: ["info", "warning", "critical"] }).notNull().default("info"),
    status: text("status", { enum: ["pending", "sent", "dismissed"] }).notNull().default("pending"),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_smart_notification_rules_user_id").on(table.userId),
    statusIdx: index("idx_smart_notification_rules_status").on(table.status),
    typeIdx: index("idx_smart_notification_rules_type").on(table.type),
}));

// One-tap transaction templates shown on the dashboard and add-transaction sheet.
export const quickAddShortcuts = sqliteTable("quick_add_shortcuts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    label: text("label").notNull(),
    amount: real("amount").notNull(),
    type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
    categoryId: integer("category_id").references(() => categories.id),
    accountId: integer("account_id").references(() => accounts.id),
    merchantName: text("merchant_name"),
    paymentMethod: text("payment_method").default("cash"),
    icon: text("icon").notNull().default("Zap"),
    color: text("color").notNull().default("#0ea5e9"),
    sortOrder: integer("sort_order").notNull().default(0),
    usageCount: integer("usage_count").notNull().default(0),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_quick_add_shortcuts_user_id").on(table.userId),
    activeIdx: index("idx_quick_add_shortcuts_active").on(table.isActive),
}));

// User vocabulary table (custom keywords for AI chat)
export const userVocabulary = sqliteTable("user_vocabulary", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    word: text("word").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index("idx_user_vocabulary_user_id").on(table.userId),
}));

// Usage tracking table
export const usageTracking = sqliteTable("usage_tracking", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    transactionsCount: integer("transactions_count").notNull(),
    aiChatsCount: integer("ai_chats_count").notNull(),
    ocrScansCount: integer("ocr_scans_count").notNull(),
    telegramMessagesCount: integer("telegram_messages_count").notNull(),
}, (table) => [
    index("idx_usage_tracking_user_month_year").on(table.userId, table.month, table.year),
]);

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

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
export type AdminScheduledNotification = typeof adminScheduledNotifications.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type ChatHistory = typeof chatHistory.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type CouponClaim = typeof couponClaims.$inferSelect;
export type AdminActivityLog = typeof adminActivityLog.$inferSelect;
export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;
export type AiAnomaliesCache = typeof aiAnomaliesCache.$inferSelect;
export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type InsertRecurringTransaction = typeof recurringTransactions.$inferInsert;
export type Streak = typeof streaks.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type BillPayment = typeof billPayments.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type SmartNotificationRule = typeof smartNotificationRules.$inferSelect;
export type QuickAddShortcut = typeof quickAddShortcuts.$inferSelect;

// Insert types
export type InsertCategory = typeof categories.$inferInsert;
export type InsertTransaction = typeof transactions.$inferInsert;
export type InsertBudget = typeof budgets.$inferInsert;
export type InsertGoal = typeof goals.$inferInsert;
export type InsertMerchantMapping = typeof merchantMappings.$inferInsert;
export type InsertUserSettings = typeof userSettings.$inferInsert;
export type InsertDebt = typeof debts.$inferInsert;
export type InsertScheduledMessage = typeof scheduledMessages.$inferInsert;
export type InsertAdminScheduledNotification = typeof adminScheduledNotifications.$inferInsert;
export type InsertBill = typeof bills.$inferInsert;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;
export type InsertChatHistory = typeof chatHistory.$inferInsert;
export type InsertAccount = typeof accounts.$inferInsert;
export type InsertInvestment = typeof investments.$inferInsert;
export type InsertCoupon = typeof coupons.$inferInsert;
export type InsertCouponClaim = typeof couponClaims.$inferInsert;
export type InsertAdminActivityLog = typeof adminActivityLog.$inferInsert;
export type InsertAiInsightsCache = typeof aiInsightsCache.$inferInsert;
export type InsertAiAnomaliesCache = typeof aiAnomaliesCache.$inferInsert;
export type InsertStreak = typeof streaks.$inferInsert;
export type InsertDemoDataTemplate = typeof demoDataTemplates.$inferInsert;
export type InsertAchievement = typeof achievements.$inferInsert;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
export type InsertBillPayment = typeof billPayments.$inferInsert;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;
export type InsertSmartNotificationRule = typeof smartNotificationRules.$inferInsert;
export type InsertQuickAddShortcut = typeof quickAddShortcuts.$inferInsert;

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
export const insertScheduledReportSchema = createInsertSchema(scheduledReports);
export const selectScheduledReportSchema = createSelectSchema(scheduledReports);
export const insertAccountSchema = createInsertSchema(accounts);
export const selectAccountSchema = createSelectSchema(accounts);
export const insertInvestmentSchema = createInsertSchema(investments);
export const selectInvestmentSchema = createSelectSchema(investments);
export const insertCouponSchema = createInsertSchema(coupons);
export const selectCouponSchema = createSelectSchema(coupons);
export const insertStreakSchema = createInsertSchema(streaks);
export const selectStreakSchema = createSelectSchema(streaks);
export const insertDemoDataTemplateSchema = createInsertSchema(demoDataTemplates);
export const selectDemoDataTemplateSchema = createSelectSchema(demoDataTemplates);
export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const selectUserAchievementSchema = createSelectSchema(userAchievements);
export const insertBillPaymentSchema = createInsertSchema(billPayments);
export const selectBillPaymentSchema = createSelectSchema(billPayments);
export const insertSplitBillMemberSchema = createInsertSchema(splitBillMembers);
export const selectSplitBillMemberSchema = createSelectSchema(splitBillMembers);
export const insertAiAnomaliesCacheSchema = createInsertSchema(aiAnomaliesCache);
export const selectAiAnomaliesCacheSchema = createSelectSchema(aiAnomaliesCache);
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions);
export const selectPushSubscriptionSchema = createSelectSchema(pushSubscriptions);
export const insertNotificationLogSchema = createInsertSchema(notificationLogs);
export const selectNotificationLogSchema = createSelectSchema(notificationLogs);
export const insertSmartNotificationRuleSchema = createInsertSchema(smartNotificationRules);
export const selectSmartNotificationRuleSchema = createSelectSchema(smartNotificationRules);
export const insertQuickAddShortcutSchema = createInsertSchema(quickAddShortcuts);
export const selectQuickAddShortcutSchema = createSelectSchema(quickAddShortcuts);
export const insertUserVocabularySchema = createInsertSchema(userVocabulary);
export const selectUserVocabularySchema = createSelectSchema(userVocabulary);
