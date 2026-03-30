#!/usr/bin/env python3
"""
Seed script untuk add 3 bulan data dummy untuk admin user
Target: admin@monevapp.com (user_id = 1)

Includes:
- Transactions (daily expenses + income)
- Goals (savings goals)
- Budgets (monthly budgets for 3 months)
- Bills (recurring bills + payments)
- Investments (stocks, crypto, mutual funds)
- Debts (loans)
- Achievements (unlocked badges)
"""

import sqlite3
from datetime import datetime, timedelta
import random
import hashlib

# Configuration
DB_PATH = "/home/ubuntu/monev/sqlite.db"
ADMIN_USER_ID = 1
ADMIN_EMAIL = "admin@monevapp.com"

# Date range: 3 months back from today
TODAY = datetime.now()
THREE_MONTHS_AGO = TODAY - timedelta(days=90)

# Sample data
EXPENSE_CATEGORIES = [
    (1, "Makanan & Minuman", "🍔", "#f59e0b"),
    (2, "Transportasi", "🚗", "#3b82f6"),
    (3, "Belanja", "🛍️", "#ec4899"),
    (4, "Hiburan", "🎬", "#8b5cf6"),
    (5, "Kesehatan", "💊", "#ef4444"),
    (6, "Pendidikan", "📚", "#10b981"),
    (7, "Tagihan & Utilitas", "💡", "#f97316"),
    (8, "Lain-lain", "📦", "#6b7280"),
]

INCOME_CATEGORIES = [
    (9, "Gaji", "💰", "#22c55e"),
    (10, "Bonus & Hadiah", "🎁", "#a855f7"),
]

EXPENSE_MERCHANTS = [
    ("Indomaret", 3),
    ("Alfamart", 3),
    ("Starbucks", 1),
    ("McDonald's", 1),
    ("KFC", 1),
    ("GoFood", 1),
    ("GrabFood", 1),
    ("ShopeeFood", 1),
    ("Pertamina", 2),
    ("Gojek", 2),
    ("Grab", 2),
    ("Bluebird", 2),
    ("PLN", 7),
    ("PDAM", 7),
    ("Telkom", 7),
    ("IndiHome", 7),
    ("XL", 7),
    ("Telkomsel", 7),
    ("Hypermart", 3),
    ("Lotte Mart", 3),
    ("Carrefour", 3),
    ("Uniqlo", 3),
    ("H&M", 3),
    ("Zara", 3),
    ("Gramedia", 6),
    ("Cinema XXI", 4),
    ("Fitness First", 5),
    ("Apotek Kimia Farma", 5),
    ("Watsons", 5),
    ("Guardian", 5),
]

INCOME_SOURCES = [
    "Gaji Bulanan",
    "Bonus Project",
    "Bonus Tahunan",
    "Dividen Saham",
    "Freelance Design",
    "Consulting Fee",
    "Investment Return",
]

GOALS_DATA = [
    ("Dana Darurat", 30000000, "#3b82f6", "🎯"),
    ("Liburan ke Jepang", 50000000, "#f59e0b", "✈️"),
    ("Beli Laptop Baru", 20000000, "#8b5cf6", "💻"),
    ("DP Rumah", 100000000, "#10b981", "🏠"),
    ("Nikah", 75000000, "#ec4899", "💍"),
]

BILLS_DATA = [
    ("Listrik PLN", 500000, 7, "#f97316", "💡"),
    ("Air PDAM", 150000, 7, "#3b82f6", "💧"),
    ("Internet IndiHome", 450000, 7, "#ec4899", "📶"),
    ("Netflix", 186000, 7, "#ef4444", "🎬"),
    ("Spotify", 54000, 7, "#22c55e", "🎵"),
    ("Gojek Plus", 49000, 7, "#10b981", "🛵"),
    ("ICBC Credit Card", 2000000, 7, "#ef4444", "💳"),
    ("Asuransi Kesehatan", 1500000, 7, "#8b5cf6", "🏥"),
]

INVESTMENTS_DATA = [
    ("BBCA - Bank BCA", "stock", 100, 9500, 10200, "Ajaib", "📈", "#22c55e"),
    ("BBRI - Bank BRI", "stock", 200, 4800, 5100, "Ajaib", "📈", "#22c55e"),
    ("TLKM - Telkom", "stock", 150, 3900, 4200, "Stockbit", "📈", "#22c55e"),
    ("Bitcoin", "crypto", 0.005, 650000000, 720000000, "Tokocrypto", "₿", "#f59e0b"),
    ("Ethereum", "crypto", 0.1, 45000000, 52000000, "Tokocrypto", "Ξ", "#6366f1"),
    ("Reksadana Pasar Uang", "mutual_fund", 5000000, 1, 1.08, "Bibit", "📊", "#3b82f6"),
    ("Emas Antam", "gold", 10, 1100000, 1250000, "Pegadaian", "🥇", "#fbbf24"),
]

DEBTS_DATA = [
    ("Pinjaman Teman - Budi", 5000000, "2026-04-15", "unpaid"),
    ("Kartu Kredit ICBC", 8500000, "2026-04-25", "unpaid"),
    ("PayLater Shopee", 1200000, "2026-04-10", "paid"),
]

ACHIEVEMENTS_DATA = [
    ("streak_7", "Streak 7 Hari", "🔥", "Transaksi 7 hari berturut-turut"),
    ("streak_30", "Streak 30 Hari", "🔥🔥", "Transaksi 30 hari berturut-turut"),
    ("budget_hero", "Budget Hero", "💰", "Tidak melebihi budget selama 1 bulan"),
    ("saver", "Saver", "🐷", "Menabung 20% dari income"),
    ("investor", "Investor", "📈", "Punya 5+ investasi"),
    ("goal_crusher", "Goal Crusher", "🎯", "Mencapai 3+ goals"),
    ("wealth_master", "Wealth Master", "👑", "Total aset > 100 juta"),
]


def get_db_connection():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def random_amount(min_val, max_val):
    """Generate random amount in range."""
    return round(random.uniform(min_val, max_val), 0)


def random_date(start, end):
    """Generate random date between start and end."""
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)


def seed_goals(conn):
    """Seed goals for admin user."""
    cursor = conn.cursor()
    print("\n🎯 Seeding Goals...")
    
    goals_inserted = 0
    for name, target, color, icon in GOALS_DATA:
        # Check if goal already exists
        cursor.execute(
            "SELECT id FROM goals WHERE user_id = ? AND name = ?",
            (ADMIN_USER_ID, name)
        )
        if cursor.fetchone():
            print(f"  ⏭️  Goal '{name}' already exists")
            continue
        
        # Random progress (30-80%)
        progress = random.uniform(0.3, 0.8)
        current = round(target * progress, 0)
        
        # Random deadline (1-12 months from now)
        deadline = TODAY + timedelta(days=random.randint(30, 365))
        
        cursor.execute("""
            INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, color, icon, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (ADMIN_USER_ID, name, target, current, deadline, color, icon, TODAY))
        
        goals_inserted += 1
        print(f"  ✓ Goal: {name} (Rp {target:,.0f}, {progress*100:.0f}% funded)")
    
    conn.commit()
    print(f"  ✅ {goals_inserted} goals inserted")
    return goals_inserted


def seed_budgets(conn):
    """Seed monthly budgets for 3 months."""
    cursor = conn.cursor()
    print("\n💰 Seeding Budgets...")
    
    budgets_inserted = 0
    
    # Generate budgets for last 3 months
    for month_offset in range(3):
        budget_date = TODAY - timedelta(days=month_offset * 30)
        month = budget_date.month
        year = budget_date.year
        
        # Create budgets for each expense category
        for cat_id, cat_name, _, _ in EXPENSE_CATEGORIES:
            # Check if budget exists
            cursor.execute("""
                SELECT id FROM budgets 
                WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
            """, (ADMIN_USER_ID, cat_id, month, year))
            
            if cursor.fetchone():
                continue
            
            # Random budget amount based on category
            if cat_id == 1:  # Food
                amount = random_amount(1500000, 3000000)
            elif cat_id == 2:  # Transport
                amount = random_amount(500000, 1500000)
            elif cat_id == 3:  # Shopping
                amount = random_amount(1000000, 3000000)
            elif cat_id == 4:  # Entertainment
                amount = random_amount(300000, 1000000)
            elif cat_id == 7:  # Bills
                amount = random_amount(2000000, 4000000)
            else:
                amount = random_amount(500000, 2000000)
            
            # Random spent (50-95% of budget)
            spent = amount * random.uniform(0.5, 0.95)
            
            cursor.execute("""
                INSERT INTO budgets (user_id, category_id, amount, spent, month, year, enable_rollover, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (ADMIN_USER_ID, cat_id, amount, spent, month, year, False, TODAY))
            
            budgets_inserted += 1
    
    conn.commit()
    print(f"  ✅ {budgets_inserted} budgets inserted (3 months)")
    return budgets_inserted


def seed_bills(conn):
    """Seed recurring bills."""
    cursor = conn.cursor()
    print("\n📋 Seeding Bills...")
    
    bills_inserted = 0
    bill_ids = []
    
    for name, amount, due_day, color, icon in BILLS_DATA:
        # Check if bill exists
        cursor.execute(
            "SELECT id FROM bills WHERE user_id = ? AND name = ?",
            (ADMIN_USER_ID, name)
        )
        if cursor.fetchone():
            print(f"  ⏭️  Bill '{name}' already exists")
            continue
        
        cursor.execute("""
            INSERT INTO bills (user_id, name, amount, due_date, frequency, is_paid, icon, color, is_active, is_subscription, created_at)
            VALUES (?, ?, ?, ?, 'monthly', 0, ?, ?, 1, 1, ?)
        """, (ADMIN_USER_ID, name, amount, due_day, icon, color, TODAY))
        
        bill_id = cursor.lastrowid
        bill_ids.append((bill_id, name, amount))
        bills_inserted += 1
        print(f"  ✓ Bill: {name} (Rp {amount:,.0f}/month)")
    
    # Seed bill payments for last 3 months
    print("\n📝 Seeding Bill Payments...")
    payments_inserted = 0
    
    for bill_id, bill_name, amount in bill_ids:
        for month_offset in range(3):
            payment_date = TODAY - timedelta(days=month_offset * 30)
            
            cursor.execute("""
                INSERT INTO bill_payments (bill_id, user_id, amount, paid_at, notes)
                VALUES (?, ?, ?, ?, ?)
            """, (bill_id, ADMIN_USER_ID, amount, payment_date, f"Payment for {payment_date.strftime('%B %Y')}"))
            
            payments_inserted += 1
    
    conn.commit()
    print(f"  ✅ {bills_inserted} bills + {payments_inserted} payments inserted")
    return bills_inserted, payments_inserted


def seed_investments(conn):
    """Seed investments."""
    cursor = conn.cursor()
    print("\n📈 Seeding Investments...")
    
    investments_inserted = 0
    
    for name, inv_type, quantity, avg_buy, current, platform, icon, color in INVESTMENTS_DATA:
        # Check if investment exists
        cursor.execute(
            "SELECT id FROM investments WHERE user_id = ? AND name = ?",
            (ADMIN_USER_ID, name)
        )
        if cursor.fetchone():
            print(f"  ⏭️  Investment '{name}' already exists")
            continue
        
        cursor.execute("""
            INSERT INTO investments (user_id, name, type, quantity, avg_buy_price, current_price, platform, icon, color, total_dividends, realized_profit, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        """, (ADMIN_USER_ID, name, inv_type, quantity, avg_buy, current, platform, icon, color, TODAY, TODAY))
        
        investments_inserted += 1
        total_value = quantity * current
        profit = (current - avg_buy) * quantity
        print(f"  ✓ {name}: {quantity} @ Rp {current:,.0f} (Profit: Rp {profit:,.0f})")
    
    conn.commit()
    print(f"  ✅ {investments_inserted} investments inserted")
    return investments_inserted


def seed_debts(conn):
    """Seed debts."""
    cursor = conn.cursor()
    print("\n💸 Seeding Debts...")
    
    debts_inserted = 0
    
    for name, amount, due_date, status in DEBTS_DATA:
        # Check if debt exists
        cursor.execute(
            "SELECT id FROM debts WHERE user_id = ? AND debtor_name = ?",
            (ADMIN_USER_ID, name)
        )
        if cursor.fetchone():
            print(f"  ⏭️  Debt '{name}' already exists")
            continue
        
        cursor.execute("""
            INSERT INTO debts (user_id, debtor_name, amount, description, due_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (ADMIN_USER_ID, name, amount, f"Debt due {due_date}", due_date, status, TODAY))
        
        debts_inserted += 1
        print(f"  ✓ Debt: {name} - Rp {amount:,.0f} ({status})")
    
    conn.commit()
    print(f"  ✅ {debts_inserted} debts inserted")
    return debts_inserted


def seed_achievements(conn):
    """Seed achievements."""
    cursor = conn.cursor()
    print("\n🏆 Seeding Achievements...")
    
    achievements_inserted = 0
    
    for type_, name, icon, desc in ACHIEVEMENTS_DATA:
        # Check if achievement exists
        cursor.execute(
            "SELECT id FROM achievements WHERE user_id = ? AND type = ?",
            (ADMIN_USER_ID, type_)
        )
        if cursor.fetchone():
            print(f"  ⏭️  Achievement '{name}' already exists")
            continue
        
        # Random unlock date in the past 3 months
        unlock_date = random_date(THREE_MONTHS_AGO, TODAY)
        
        cursor.execute("""
            INSERT INTO achievements (user_id, type, name, description, icon, unlocked_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (ADMIN_USER_ID, type_, name, desc, icon, unlock_date))
        
        achievements_inserted += 1
        print(f"  ✓ Achievement: {name} {icon}")
    
    conn.commit()
    print(f"  ✅ {achievements_inserted} achievements inserted")
    return achievements_inserted


def seed_transactions(conn):
    """Seed daily transactions for 3 months."""
    cursor = conn.cursor()
    print("\n💳 Seeding Transactions...")
    
    transactions_inserted = 0
    total_expense = 0
    total_income = 0
    
    # Generate transactions for each day
    current_date = THREE_MONTHS_AGO
    while current_date <= TODAY:
        # 85% chance of transactions on any given day
        if random.random() < 0.85:
            # Generate 1-4 expense transactions
            num_expenses = random.randint(1, 4)
            
            for _ in range(num_expenses):
                merchant, cat_id = random.choice(EXPENSE_MERCHANTS)
                amount = random_amount(15000, 500000)
                
                # Random time during the day
                hour = random.randint(6, 22)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                txn_datetime = current_date.replace(hour=hour, minute=minute, second=second)
                
                cursor.execute("""
                    INSERT INTO transactions 
                    (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                     account_id, date, is_verified, is_recurring, created_at)
                    VALUES (?, ?, ?, ?, ?, 'expense', ?, ?, ?, 1, 0, ?)
                """, (
                    ADMIN_USER_ID, amount, f"Belanja di {merchant}", merchant, cat_id,
                    random.choice(["cash", "bca", "gopay", "ovo"]), 1, txn_datetime, txn_datetime
                ))
                
                transactions_inserted += 1
                total_expense += amount
        
        # Add income on 1st and 15th of each month
        if current_date.day == 1:
            # Salary
            salary = 8000000
            cursor.execute("""
                INSERT INTO transactions 
                (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                 account_id, date, is_verified, is_recurring, created_at)
                VALUES (?, ?, ?, NULL, ?, 'income', 'bca', ?, ?, 1, 0, ?)
            """, (ADMIN_USER_ID, salary, "Gaji Bulanan", 9, 1, current_date, current_date))
            
            transactions_inserted += 1
            total_income += salary
            print(f"  💰 Salary: Rp {salary:,.0f} on {current_date.strftime('%Y-%m-%d')}")
        
        elif current_date.day == 15:
            # Bonus/freelance
            bonus = random_amount(500000, 3000000)
            cursor.execute("""
                INSERT INTO transactions 
                (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                 account_id, date, is_verified, is_recurring, created_at)
                VALUES (?, ?, ?, NULL, ?, 'income', 'bca', ?, ?, 1, 0, ?)
            """, (ADMIN_USER_ID, bonus, random.choice(INCOME_SOURCES[1:]), 10, 1, current_date, current_date))
            
            transactions_inserted += 1
            total_income += bonus
        
        current_date += timedelta(days=1)
    
    conn.commit()
    print(f"\n  ✅ {transactions_inserted} transactions inserted")
    print(f"  📊 Total Expense: Rp {total_expense:,.0f}")
    print(f"  📊 Total Income: Rp {total_income:,.0f}")
    print(f"  📊 Net: Rp {total_income - total_expense:,.0f}")
    
    return transactions_inserted, total_expense, total_income


def update_account_balance(conn, total_income, total_expense):
    """Update account balance based on transactions."""
    cursor = conn.cursor()
    print("\n💳 Updating Account Balance...")
    
    # Get current balance
    cursor.execute("SELECT balance FROM accounts WHERE user_id = ? AND id = 1", (ADMIN_USER_ID,))
    row = cursor.fetchone()
    current_balance = row[0] if row else 0
    
    # Calculate new balance (simplified - just add net)
    net = total_income - total_expense
    new_balance = current_balance + net
    
    cursor.execute("""
        UPDATE accounts SET balance = ?, updated_at = ? WHERE user_id = ? AND id = 1
    """, (new_balance, TODAY, ADMIN_USER_ID))
    
    conn.commit()
    print(f"  ✓ Balance updated: Rp {current_balance:,.0f} → Rp {new_balance:,.0f}")
    
    return new_balance


def main():
    """Main seed function."""
    print("=" * 60)
    print("🌱 MONEV SEED - Admin 3 Months Data")
    print("=" * 60)
    print(f"👤 User: {ADMIN_EMAIL} (ID: {ADMIN_USER_ID})")
    print(f"📅 Date Range: {THREE_MONTHS_AGO.strftime('%Y-%m-%d')} to {TODAY.strftime('%Y-%m-%d')}")
    print(f"📁 Database: {DB_PATH}")
    print("=" * 60)
    
    conn = get_db_connection()
    
    try:
        # Seed all data
        seed_goals(conn)
        seed_budgets(conn)
        seed_bills(conn)
        seed_investments(conn)
        seed_debts(conn)
        seed_achievements(conn)
        txn_count, total_expense, total_income = seed_transactions(conn)
        update_account_balance(conn, total_income, total_expense)
        
        print("\n" + "=" * 60)
        print("✅ SEEDING COMPLETE!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
