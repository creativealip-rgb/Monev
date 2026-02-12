-- =====================================================
-- Monev Finance App - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    icon VARCHAR(50) NOT NULL DEFAULT 'Wallet',
    type VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on type for filtering
CREATE INDEX idx_categories_type ON categories(type);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT NOT NULL,
    merchant_name VARCHAR(255),
    category_id INTEGER REFERENCES categories(id),
    type VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'transfer')),
    payment_method VARCHAR(50) DEFAULT 'cash',
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_date_type ON transactions(date DESC, type);

-- =====================================================
-- BUDGETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, month, year)
);

-- Add index for monthly budget queries
CREATE INDEX idx_budgets_month_year ON budgets(month, year);
CREATE INDEX idx_budgets_category ON budgets(category_id);

-- =====================================================
-- GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    icon VARCHAR(50) NOT NULL DEFAULT 'Target',
    color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for deadline queries
CREATE INDEX idx_goals_deadline ON goals(deadline);

-- =====================================================
-- MERCHANT MAPPINGS TABLE (for AI categorization)
-- =====================================================
CREATE TABLE IF NOT EXISTS merchant_mappings (
    id SERIAL PRIMARY KEY,
    merchant_name VARCHAR(255) NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for merchant lookups
CREATE INDEX idx_merchant_mappings_name ON merchant_mappings(merchant_name);

-- =====================================================
-- USER SETTINGS TABLE (for Telegram integration)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    telegram_chat_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    default_currency VARCHAR(3) DEFAULT 'IDR',
    monthly_budget DECIMAL(12, 2),
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for Telegram lookups
CREATE INDEX idx_user_settings_telegram ON user_settings(telegram_chat_id);

-- =====================================================
-- AI CONVERSATIONS TABLE (for chat history)
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for date queries
CREATE INDEX idx_ai_conversations_date ON ai_conversations(created_at DESC);

-- =====================================================
-- VIEWS FOR DASHBOARD
-- =====================================================

-- Monthly statistics view
CREATE OR REPLACE VIEW monthly_stats AS
SELECT 
    EXTRACT(YEAR FROM date) as year,
    EXTRACT(MONTH FROM date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance,
    COUNT(*) FILTER (WHERE type = 'income') as income_count,
    COUNT(*) FILTER (WHERE type = 'expense') as expense_count
FROM transactions
GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
ORDER BY year DESC, month DESC;

-- Category statistics view
CREATE OR REPLACE VIEW category_stats AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.color,
    c.type,
    EXTRACT(YEAR FROM t.date) as year,
    EXTRACT(MONTH FROM t.date) as month,
    SUM(t.amount) as total_amount,
    COUNT(*) as transaction_count
FROM transactions t
JOIN categories c ON t.category_id = c.id
GROUP BY c.id, c.name, c.color, c.type, EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to get monthly summary
CREATE OR REPLACE FUNCTION get_monthly_summary(p_year INTEGER, p_month INTEGER)
RETURNS TABLE (
    income DECIMAL,
    expense DECIMAL,
    balance DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance,
        COUNT(*) as transaction_count
    FROM transactions
    WHERE EXTRACT(YEAR FROM date) = p_year 
      AND EXTRACT(MONTH FROM date) = p_month;
END;
$$ LANGUAGE plpgsql;

-- Function to update goal progress
CREATE OR REPLACE FUNCTION add_to_goal(p_goal_id INTEGER, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
    UPDATE goals 
    SET current_amount = LEAST(current_amount + p_amount, target_amount)
    WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- For single-user mode (all access)
-- In production, replace with user-specific policies
CREATE POLICY "Allow all access" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON merchant_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default categories if not exists
INSERT INTO categories (name, color, icon, type) VALUES
    ('Makanan', '#ef4444', 'Utensils', 'expense'),
    ('Transportasi', '#3b82f6', 'Car', 'expense'),
    ('Hiburan', '#8b5cf6', 'Gamepad2', 'expense'),
    ('Belanja', '#f59e0b', 'ShoppingBag', 'expense'),
    ('Kesehatan', '#ec4899', 'Heart', 'expense'),
    ('Pendidikan', '#10b981', 'BookOpen', 'expense'),
    ('Lainnya', '#6b7280', 'MoreHorizontal', 'expense'),
    ('Gaji', '#10b981', 'Briefcase', 'income'),
    ('Investasi', '#3b82f6', 'TrendingUp', 'income'),
    ('Hadiah', '#f59e0b', 'Gift', 'income'),
    ('Lainnya', '#6b7280', 'MoreHorizontal', 'income')
ON CONFLICT DO NOTHING;

-- Insert sample goal
INSERT INTO goals (name, target_amount, current_amount, icon, color) VALUES
    ('Emergency Fund', 10000000, 2500000, 'Shield', '#10b981'),
    ('MacBook Pro', 25000000, 5000000, 'Laptop', '#3b82f6')
ON CONFLICT DO NOTHING;