-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'expert'
  financial_goal TEXT, -- e.g. "Beli Macbook M3"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT, -- "Nasi Goreng"
  merchant_name TEXT, -- "Warung Tegal Bahari"
  category TEXT, -- "Food", "Transport", "Hobbies"
  type TEXT CHECK (type IN ('expense', 'income', 'transfer')),
  payment_method TEXT, -- "Cash", "QRIS", "Transfer"
  image_url TEXT, -- Link ke bukti struk di Storage
  is_verified BOOLEAN DEFAULT FALSE, -- Apakah sudah dikonfirmasi user?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Budgets Table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
