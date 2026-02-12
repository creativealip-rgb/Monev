-- Monev Finance App Database Schema (SQLite)

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT NOT NULL DEFAULT 'Wallet',
    type TEXT NOT NULL DEFAULT 'expense' CHECK(type IN ('expense', 'income')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    merchant_name TEXT,
    category_id INTEGER REFERENCES categories(id),
    type TEXT NOT NULL DEFAULT 'expense' CHECK(type IN ('expense', 'income', 'transfer')),
    payment_method TEXT DEFAULT 'cash',
    date INTEGER NOT NULL DEFAULT (unixepoch()),
    is_verified INTEGER DEFAULT 0,
    is_recurring INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 3. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    amount REAL NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 4. Goals Table
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    deadline INTEGER,
    icon TEXT NOT NULL DEFAULT 'Target',
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 5. Merchant Mappings Table (for auto-categorization)
CREATE TABLE IF NOT EXISTS merchant_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    confidence REAL NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_merchant_mappings_name ON merchant_mappings(merchant_name);
