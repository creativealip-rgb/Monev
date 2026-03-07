import { relations } from "drizzle-orm/relations";
import { categories, budgets, users, chatHistory, debts, goals, investments, merchantMappings, scheduledMessages, transactions, adminActivityLog, couponClaims, coupons, aiInsightsCache, achievements, streaks, bills, userSettings, recurringTransactions, accounts, billPayments } from "./schema";

export const budgetsRelations = relations(budgets, ({one}) => ({
	category: one(categories, {
		fields: [budgets.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [budgets.userId],
		references: [users.id]
	}),
}));

export const categoriesRelations = relations(categories, ({one, many}) => ({
	budgets: many(budgets),
	merchantMappings: many(merchantMappings),
	transactions: many(transactions),
	bills: many(bills),
	recurringTransactions: many(recurringTransactions),
	user: one(users, {
		fields: [categories.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	budgets: many(budgets),
	chatHistories: many(chatHistory),
	debts: many(debts),
	goals: many(goals),
	investments: many(investments),
	merchantMappings: many(merchantMappings),
	scheduledMessages: many(scheduledMessages),
	transactions: many(transactions),
	adminActivityLogs: many(adminActivityLog),
	couponClaims: many(couponClaims),
	aiInsightsCaches: many(aiInsightsCache),
	achievements: many(achievements),
	streaks: many(streaks),
	bills: many(bills),
	userSettings: many(userSettings),
	recurringTransactions: many(recurringTransactions),
	categories: many(categories),
	accounts: many(accounts),
	billPayments: many(billPayments),
}));

export const chatHistoryRelations = relations(chatHistory, ({one}) => ({
	user: one(users, {
		fields: [chatHistory.userId],
		references: [users.id]
	}),
}));

export const debtsRelations = relations(debts, ({one}) => ({
	user: one(users, {
		fields: [debts.userId],
		references: [users.id]
	}),
}));

export const goalsRelations = relations(goals, ({one, many}) => ({
	user: one(users, {
		fields: [goals.userId],
		references: [users.id]
	}),
	userSettings: many(userSettings),
}));

export const investmentsRelations = relations(investments, ({one}) => ({
	user: one(users, {
		fields: [investments.userId],
		references: [users.id]
	}),
}));

export const merchantMappingsRelations = relations(merchantMappings, ({one}) => ({
	category: one(categories, {
		fields: [merchantMappings.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [merchantMappings.userId],
		references: [users.id]
	}),
}));

export const scheduledMessagesRelations = relations(scheduledMessages, ({one}) => ({
	user: one(users, {
		fields: [scheduledMessages.userId],
		references: [users.id]
	}),
}));

export const transactionsRelations = relations(transactions, ({one, many}) => ({
	category: one(categories, {
		fields: [transactions.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
	billPayments: many(billPayments),
}));

export const adminActivityLogRelations = relations(adminActivityLog, ({one}) => ({
	user: one(users, {
		fields: [adminActivityLog.adminId],
		references: [users.id]
	}),
}));

export const couponClaimsRelations = relations(couponClaims, ({one}) => ({
	user: one(users, {
		fields: [couponClaims.userId],
		references: [users.id]
	}),
	coupon: one(coupons, {
		fields: [couponClaims.couponId],
		references: [coupons.id]
	}),
}));

export const couponsRelations = relations(coupons, ({many}) => ({
	couponClaims: many(couponClaims),
}));

export const aiInsightsCacheRelations = relations(aiInsightsCache, ({one}) => ({
	user: one(users, {
		fields: [aiInsightsCache.userId],
		references: [users.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({one}) => ({
	user: one(users, {
		fields: [achievements.userId],
		references: [users.id]
	}),
}));

export const streaksRelations = relations(streaks, ({one}) => ({
	user: one(users, {
		fields: [streaks.userId],
		references: [users.id]
	}),
}));

export const billsRelations = relations(bills, ({one, many}) => ({
	category: one(categories, {
		fields: [bills.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [bills.userId],
		references: [users.id]
	}),
	billPayments: many(billPayments),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	goal: one(goals, {
		fields: [userSettings.primaryGoalId],
		references: [goals.id]
	}),
	user: one(users, {
		fields: [userSettings.userId],
		references: [users.id]
	}),
}));

export const recurringTransactionsRelations = relations(recurringTransactions, ({one}) => ({
	category: one(categories, {
		fields: [recurringTransactions.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [recurringTransactions.userId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const billPaymentsRelations = relations(billPayments, ({one}) => ({
	transaction: one(transactions, {
		fields: [billPayments.transactionId],
		references: [transactions.id]
	}),
	user: one(users, {
		fields: [billPayments.userId],
		references: [users.id]
	}),
	bill: one(bills, {
		fields: [billPayments.billId],
		references: [bills.id]
	}),
}));