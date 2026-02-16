-- Add performance indexes for frequently queried columns
-- Migration: 0001_performance_indexes

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(userId);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(userId, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(categoryId);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Budgets table indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(userId);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON budgets(userId, month, year);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(categoryId);

-- Goals table indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(userId);

-- Bills table indexes
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(userId);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(dueDate);

-- Investments table indexes
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(userId);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(userId);

-- Debts table indexes
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(userId);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);

-- Scheduled messages indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON scheduled_messages(userId);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_at ON scheduled_messages(scheduledAt);

-- Chat history indexes
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(userId);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(createdAt);

-- Merchant mappings indexes
CREATE INDEX IF NOT EXISTS idx_merchant_mappings_user_id ON merchant_mappings(userId);
CREATE INDEX IF NOT EXISTS idx_merchant_mappings_merchant ON merchant_mappings(merchantName);
