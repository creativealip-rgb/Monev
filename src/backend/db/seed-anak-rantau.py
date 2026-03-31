#!/usr/bin/env python3
"""
Seed script untuk simulasi pengeluaran anak rantau REALISTIS
Target: User dengan gaji 5jt/bulan + freelance 1-2jt (inconsistent)

Profile:
- Usia: 24-27 tahun
- Status: Single, ngekost
- Lokasi: Jakarta/urban area
- Pekerjaan: Full-time + freelance occasional

REALISTIC IMPROVEMENTS:
1. Transaction timestamps: realistic times (breakfast 7-9am, lunch 12-2pm, dinner 6-9pm)
2. Tier: "sultan" (untuk test fitur premium)
3. Goals/Investments: Sisihkan dari gaji (transfer transactions), bukan magic money
4. Cashflow: Hidup dari gaji ke gaji, kadang minus sebelum gajian
"""

import sqlite3
from datetime import datetime, timedelta
import random
import subprocess

# Configuration
DB_PATH = "/home/ubuntu/monev/sqlite.db"
USER_ID = 3  # New user
USER_EMAIL = "anakkost@gmail.com"
PASSWORD = "password123"

# Date range: 3 months back from today
TODAY = datetime.now().replace(hour=23, minute=59, second=59)
THREE_MONTHS_AGO = TODAY - timedelta(days=90)

# Income configuration
SALARY_AMOUNT = 5000000  # Gaji pokok
SALARY_DAY = 25  # Tanggal gajian
FREELANCE_RANGE = (800000, 1800000)  # Freelance income range (lebih realistis - kadang kecil)

# Fixed monthly expenses
FIXED_EXPENSES = {
    "kost": {
        "amount": 1300000,
        "day": 1,
        "hour": 10,
        "category_id": 11,
        "merchant": "Kost Bu Siti",
        "description": "Bayar kost bulanan",
    },
    "listrik": {
        "amount": 300000,  # Lebih realistis dengan AC
        "day": 5,
        "hour": 14,
        "category_id": 7,
        "merchant": "PLN Mobile",
        "description": "Token listrik bulanan",
    },
    "air": {
        "amount": 75000,
        "day": 5,
        "hour": 14,
        "category_id": 7,
        "merchant": "PDAM",
        "description": "Bayar air bulanan",
    },
    "pulsa_data": {
        "amount": 150000,
        "day": 10,
        "hour": 11,
        "category_id": 7,
        "merchant": "Telkomsel",
        "description": "Paket data bulanan",
    },
    "netflix": {
        "amount": 186000,
        "day": 15,
        "hour": 20,
        "category_id": 4,
        "merchant": "Netflix",
        "description": "Subscription Netflix",
    },
    "spotify": {
        "amount": 54000,
        "day": 15,
        "hour": 20,
        "category_id": 4,
        "merchant": "Spotify",
        "description": "Spotify Premium",
    },
}

# Daily expense patterns with realistic times
DAILY_EXPENSES = {
    "breakfast": {
        "time_range": (7, 9),  # 7-9 AM
        "amount_range": (10000, 25000),
        "freq": 0.85,  # 85% hari (kadang skip)
        "merchants": ["Nasi Uduk Pagi", "Bubur Ayam", "Warung Sarapan", "Bakso Malang"],
        "category_id": 1,
    },
    "lunch": {
        "time_range": (12, 14),  # 12-2 PM
        "amount_range": (15000, 35000),
        "freq": 0.95,  # 95% hari
        "merchants": ["Warteg Bu Dewi", "Nasi Goreng Kampung", "Warung Padang", "Ayam Geprek"],
        "category_id": 1,
    },
    "dinner": {
        "time_range": (18, 21),  # 6-9 PM
        "amount_range": (15000, 40000),
        "freq": 0.9,  # 90% hari
        "merchants": ["Warung Tegal", "Soto Betawi", "Mie Ayam", "Pecel Lele"],
        "category_id": 1,
    },
    "snack": {
        "time_range": (15, 17),  # 3-5 PM
        "amount_range": (10000, 25000),
        "freq": 0.5,  # 50% hari (kadang ada kadang tidak)
        "merchants": ["Es Teh Manis", "Gorengan", "Martabak", "Seblak"],
        "category_id": 1,
    },
    "transport_pagi": {
        "time_range": (7, 9),
        "amount_range": (15000, 30000),
        "freq": 0.7,  # 70% hari kerja
        "merchants": ["Gojek", "Grab"],
        "category_id": 2,
        "weekend_only": False,
    },
    "transport_sore": {
        "time_range": (17, 19),
        "amount_range": (15000, 35000),
        "freq": 0.7,
        "merchants": ["Gojek", "Grab"],
        "category_id": 2,
        "weekend_only": False,
    },
    "parkir": {
        "time_range": (8, 18),
        "amount_range": (2000, 10000),
        "freq": 0.4,
        "merchants": ["Parkir Kantor", "Parkir Mall"],
        "category_id": 2,
    },
    "nongkrong": {
        "time_range": (19, 22),
        "amount_range": (50000, 120000),
        "freq": 0.2,  # 1-2x per minggu
        "merchants": ["Kopi Kenangan", "Starbucks", "Cafe Senja", "Warung Kopi"],
        "category_id": 4,
        "weekend_only": True,
    },
}

# Savings goals (akan di-transfer dari gaji)
GOALS_DATA = [
    ("Dana Darurat", 10000000, "#3b82f6", "🎯"),
    ("Liburan ke Bali", 5000000, "#f59e0b", "✈️"),
    ("Beli Laptop Baru", 8000000, "#8b5cf6", "💻"),
]

# Investments (akan di-transfer dari gaji)
INVESTMENTS_DATA = [
    ("Reksadana Pasar Uang", "mutual_fund", 500000, "#3b82f6", "📊"),
    ("Emas Digital", "gold", 300000, "#fbbf24", "🥇"),
]


def get_db_connection():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def generate_password_hash():
    """Generate bcrypt password hash."""
    result = subprocess.run(
        ['python3', '-c', '''
import sys
sys.path.insert(0, "/usr/lib/python3/dist-packages")
import bcrypt
password = "password123"
hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
print(hash)
'''],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        raise Exception(f"Failed to generate password hash: {result.stderr}")
    
    return result.stdout.strip()


def create_user_if_not_exists(conn):
    """Create user if not exists."""
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (USER_EMAIL,))
    if cursor.fetchone():
        print(f"  ⏭️  User {USER_EMAIL} already exists")
        cursor.execute("SELECT id FROM users WHERE email = ?", (USER_EMAIL,))
        return cursor.fetchone()[0]
    
    # Generate password hash
    password_hash = generate_password_hash()
    
    # Create new user with "sultan" tier
    cursor.execute("""
        INSERT INTO users (email, password, tier, is_active, created_at)
        VALUES (?, ?, 'sultan', 1, ?)
    """, (USER_EMAIL, password_hash, TODAY))
    
    user_id = cursor.lastrowid
    print(f"  ✅ User created: {USER_EMAIL} (ID: {user_id}, Tier: Sultan)")
    
    # Create user settings
    cursor.execute("""
        INSERT INTO user_settings (user_id, has_completed_onboarding, notifications_enabled, updated_at)
        VALUES (?, 1, 1, ?)
    """, (user_id, TODAY))
    
    conn.commit()
    return user_id


def create_accounts(conn, user_id):
    """Create accounts for the user - starting with MINIMAL balance (realistic!)."""
    cursor = conn.cursor()
    
    # REALISTIC: Start with very little savings (struggling millennial)
    accounts = [
        ("BCA - Tabungan", "bank", 500000, "#1e40af", "Building"),  # Cuma 500rb!
        ("GoPay", "emoney", 100000, "#00aa13", "Smartphone"),  # 100rb
        ("OVO", "emoney", 50000, "#4c34e6", "Smartphone"),  # 50rb
        ("Dompet - Cash", "cash", 200000, "#f59e0b", "Wallet"),  # 200rb
        ("BCA - Kartu Kredit", "credit_card", 0, "#ef4444", "CreditCard"),  # Baru daftar
    ]
    
    accounts_created = 0
    for name, acc_type, balance, color, icon in accounts:
        cursor.execute(
            "SELECT id FROM accounts WHERE user_id = ? AND name = ?",
            (user_id, name)
        )
        if cursor.fetchone():
            continue
        
        cursor.execute("""
            INSERT INTO accounts (user_id, name, type, balance, color, icon, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
        """, (user_id, name, acc_type, balance, color, icon, TODAY, TODAY))
        
        accounts_created += 1
        print(f"    ✓ Account: {name} (Rp {balance:,.0f})")
    
    conn.commit()
    print(f"  ✅ {accounts_created} accounts created")
    return accounts_created


def create_goals(conn, user_id):
    """Create savings goals - starting from ZERO (realistic!)."""
    cursor = conn.cursor()
    
    goals_created = 0
    for name, target, color, icon in GOALS_DATA:
        cursor.execute(
            "SELECT id FROM goals WHERE user_id = ? AND name = ?",
            (user_id, name)
        )
        if cursor.fetchone():
            continue
        
        # START FROM ZERO - will add via transfer transactions
        cursor.execute("""
            INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, color, icon, created_at)
            VALUES (?, ?, ?, 0, ?, ?, ?, ?)
        """, (user_id, name, target, TODAY + timedelta(days=random.randint(180, 365)), color, icon, TODAY))
        
        goals_created += 1
        print(f"    ✓ Goal: {name} (Target: Rp {target:,.0f}, Starting from 0)")
    
    conn.commit()
    print(f"  ✅ {goals_created} goals created (starting from ZERO)")
    return goals_created


def create_investments(conn, user_id):
    """Create investments - starting from ZERO (realistic!)."""
    cursor = conn.cursor()
    
    investments_created = 0
    for name, inv_type, monthly_amount, color, icon in INVESTMENTS_DATA:
        cursor.execute(
            "SELECT id FROM investments WHERE user_id = ? AND name = ?",
            (user_id, name)
        )
        if cursor.fetchone():
            continue
        
        # START FROM ZERO - will add via transfer transactions
        cursor.execute("""
            INSERT INTO investments (user_id, name, type, quantity, avg_buy_price, current_price, platform, icon, color, total_dividends, realized_profit, created_at, updated_at)
            VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?, 0, 0, ?, ?)
        """, (user_id, name, inv_type, "Bibit" if inv_type == "mutual_fund" else "Pegadaian", icon, color, TODAY, TODAY))
        
        investments_created += 1
        print(f"    ✓ Investment: {name} (Starting from 0)")
    
    conn.commit()
    print(f"  ✅ {investments_created} investments created (starting from ZERO)")
    return investments_created


def get_realistic_time(date, time_range, expense_type):
    """Generate realistic timestamp for transaction."""
    hour_start, hour_end = time_range
    
    # Add some variance
    hour = random.randint(hour_start, hour_end)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    
    return date.replace(hour=hour, minute=minute, second=second)


def generate_transactions(conn, user_id):
    """Generate realistic transactions for 3 months."""
    cursor = conn.cursor()
    
    transactions_inserted = 0
    total_income = 0
    total_expense = 0
    total_savings = 0  # Track money going to goals/investments
    
    current_date = THREE_MONTHS_AGO
    day_count = 0
    
    # Track balance throughout the month (realistic cashflow)
    balance_tracker = 500000  # Starting balance
    
    print(f"\n📅 Generating transactions from {THREE_MONTHS_AGO.strftime('%Y-%m-%d')} to {TODAY.strftime('%Y-%m-%d')}")
    
    while current_date <= TODAY:
        day_of_month = current_date.day
        day_of_week = current_date.weekday()  # 0 = Monday, 6 = Sunday
        is_weekend = day_of_week >= 5
        is_payday = day_of_month == SALARY_DAY
        
        # === INCOME ===
        
        # Salary on 25th of each month
        if is_payday:
            timestamp = current_date.replace(hour=9, minute=random.randint(0, 59))  # Gaji masuk pagi
            
            cursor.execute("""
                INSERT INTO transactions 
                (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                 account_id, date, is_verified, is_recurring, created_at)
                VALUES (?, ?, ?, NULL, ?, 'income', 'transfer', 1, ?, 1, 0, ?)
            """, (user_id, SALARY_AMOUNT, f"Gaji Bulanan - {current_date.strftime('%B %Y')}", 9, timestamp, timestamp))
            
            transactions_inserted += 1
            total_income += SALARY_AMOUNT
            balance_tracker += SALARY_AMOUNT
            print(f"  💰 Salary: Rp {SALARY_AMOUNT:,.0f} on {current_date.strftime('%Y-%m-%d')} (Balance: Rp {balance_tracker:,.0f})")
        
        # Freelance income (inconsistent - some months more, some less)
        if random.random() < 0.04:  # ~1x per month average
            freelance_amount = random.randint(FREELANCE_RANGE[0], FREELANCE_RANGE[1])
            timestamp = current_date.replace(hour=random.randint(10, 16))
            
            cursor.execute("""
                INSERT INTO transactions 
                (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                 account_id, date, is_verified, is_recurring, created_at)
                VALUES (?, ?, ?, NULL, ?, 'income', 'transfer', 1, ?, 1, 0, ?)
            """, (user_id, freelance_amount, "Payment Freelance Design", 10, timestamp, timestamp))
            
            transactions_inserted += 1
            total_income += freelance_amount
            balance_tracker += freelance_amount
            print(f"  🎨 Freelance: Rp {freelance_amount:,.0f} on {current_date.strftime('%Y-%m-%d')}")
        
        # === SAVINGS TRANSFERS (Right after payday - realistic!) ===
        
        # Transfer to goals (5% of salary = 250k)
        if is_payday:
            savings_amount = 250000
            timestamp = current_date.replace(hour=10, minute=random.randint(0, 59))
            
            for goal_name, _, color, icon in GOALS_DATA[:1]:  # Just emergency fund
                cursor.execute("SELECT id FROM goals WHERE user_id = ? AND name = ?", (user_id, goal_name))
                goal = cursor.fetchone()
                if goal:
                    cursor.execute("""
                        INSERT INTO transactions 
                        (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                         account_id, destination_type, destination_id, date, is_verified, is_recurring, created_at)
                        VALUES (?, ?, ?, NULL, ?, 'transfer', 'transfer', 1, 'goal', ?, ?, 1, 0, ?)
                    """, (user_id, savings_amount // len(GOALS_DATA), f"Tabungan {goal_name}", 8, goal[0], timestamp, timestamp))
                    
                    transactions_inserted += 1
                    total_savings += savings_amount // len(GOALS_DATA)
                    balance_tracker -= savings_amount // len(GOALS_DATA)
            
            # Transfer to investments (3% of salary = 150k)
            for inv_name, inv_type, _, color, icon in INVESTMENTS_DATA:
                cursor.execute("SELECT id FROM investments WHERE user_id = ? AND name = ?", (user_id, inv_name))
                inv = cursor.fetchone()
                if inv:
                    invest_amount = 150000 // len(INVESTMENTS_DATA)
                    timestamp = current_date.replace(hour=10, minute=random.randint(30, 59))
                    
                    cursor.execute("""
                        INSERT INTO transactions 
                        (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                         account_id, destination_type, destination_id, date, is_verified, is_recurring, created_at)
                        VALUES (?, ?, ?, NULL, ?, 'transfer', 'transfer', 1, 'investment', ?, ?, 1, 0, ?)
                    """, (user_id, invest_amount, f"Investasi {inv_name}", 8, inv[0], timestamp, timestamp))
                    
                    transactions_inserted += 1
                    total_savings += invest_amount
                    balance_tracker -= invest_amount
            
            print(f"  💸 Savings Transfer: Rp {total_savings:,.0f} to goals & investments")
        
        # === FIXED EXPENSES ===
        
        for expense_name, expense_data in FIXED_EXPENSES.items():
            if expense_data["amount"] > 0 and day_of_month == expense_data["day"]:
                # Add variance to utilities
                amount = expense_data["amount"]
                if expense_name == "listrik":
                    amount = int(amount * random.uniform(0.85, 1.25))  # PLN variance
                
                timestamp = current_date.replace(hour=expense_data["hour"], minute=random.randint(0, 59))
                
                cursor.execute("""
                    INSERT INTO transactions 
                    (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                     account_id, date, is_verified, is_recurring, created_at)
                    VALUES (?, ?, ?, ?, ?, 'expense', 'transfer', 1, ?, 1, 0, ?)
                """, (user_id, amount, expense_data["description"], expense_data["merchant"], 
                      expense_data["category_id"], timestamp, timestamp))
                
                transactions_inserted += 1
                total_expense += amount
                balance_tracker -= amount
        
        # === DAILY EXPENSES ===
        
        # Skip some days (sick, traveling, etc.)
        if random.random() < 0.03:
            current_date += timedelta(days=1)
            day_count += 1
            continue
        
        # Meals with realistic times
        for meal_name, meal_data in DAILY_EXPENSES.items():
            if "transport" in meal_name or "parkir" in meal_name:
                continue  # Handle separately
            
            # Weekend vs weekday frequency
            freq = meal_data["freq"]
            if meal_data.get("weekend_only") and not is_weekend:
                freq = 0
            elif not meal_data.get("weekend_only") and is_weekend:
                freq = freq * 0.5  # Less regular meals on weekend
            
            if random.random() < freq:
                amount = random.randint(meal_data["amount_range"][0], meal_data["amount_range"][1])
                
                # Weekend meals usually more expensive
                if is_weekend and meal_name in ["breakfast", "lunch", "dinner"]:
                    amount = int(amount * random.uniform(1.2, 1.6))
                
                merchant = random.choice(meal_data["merchants"])
                timestamp = get_realistic_time(current_date, meal_data["time_range"], meal_name)
                
                # Payment method varies
                payment_method = random.choice(["cash", "gopay", "ovo"])
                account_id = 4 if payment_method == "cash" else (2 if payment_method == "gopay" else 3)
                
                cursor.execute("""
                    INSERT INTO transactions 
                    (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                     account_id, date, is_verified, is_recurring, created_at)
                    VALUES (?, ?, ?, ?, ?, 'expense', ?, ?, ?, 1, 0, ?)
                """, (user_id, amount, f"{meal_name.title()}", merchant, meal_data["category_id"], 
                      payment_method, account_id, timestamp, timestamp))
                
                transactions_inserted += 1
                total_expense += amount
                balance_tracker -= amount
        
        # Transport (weekday only mostly)
        if not is_weekend or random.random() < 0.3:
            for transport_name in ["transport_pagi", "transport_sore"]:
                transport_data = DAILY_EXPENSES[transport_name]
                
                if random.random() < transport_data["freq"]:
                    amount = random.randint(transport_data["amount_range"][0], transport_data["amount_range"][1])
                    merchant = random.choice(transport_data["merchants"])
                    timestamp = get_realistic_time(current_date, transport_data["time_range"], transport_name)
                    
                    cursor.execute("""
                        INSERT INTO transactions 
                        (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                         account_id, date, is_verified, is_recurring, created_at)
                        VALUES (?, ?, ?, ?, ?, 'expense', 'gopay', 2, ?, 1, 0, ?)
                    """, (user_id, amount, f"Transport {transport_name.replace('_', ' ')}", merchant, 
                          transport_data["category_id"], timestamp, timestamp))
                    
                    transactions_inserted += 1
                    total_expense += amount
                    balance_tracker -= amount
        
        # Entertainment (mostly weekend)
        if is_weekend and random.random() < 0.3:
            ent_data = DAILY_EXPENSES["nongkrong"]
            amount = random.randint(ent_data["amount_range"][0], ent_data["amount_range"][1])
            merchant = random.choice(ent_data["merchants"])
            timestamp = get_realistic_time(current_date, ent_data["time_range"], "nongkrong")
            
            cursor.execute("""
                INSERT INTO transactions 
                (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                 account_id, date, is_verified, is_recurring, created_at)
                VALUES (?, ?, ?, ?, ?, 'expense', ?, 2, ?, 1, 0, ?)
            """, (user_id, amount, f"Nongkrong di {merchant}", merchant, ent_data["category_id"], 
                  random.choice(["gopay", "ovo"]), timestamp, timestamp))
            
            transactions_inserted += 1
            total_expense += amount
            balance_tracker -= amount
        
        # Random impulse buys (realistic!)
        if random.random() < 0.05:  # 5% chance per day
            amount = random.randint(50000, 200000)
            merchants = ["Shopee", "Tokopedia", "Lazada", "Uniqlo", "H&M", "Gramedia"]
            merchant = random.choice(merchants)
            timestamp = current_date.replace(hour=random.randint(12, 22))
            
            cursor.execute("""
                INSERT INTO transactions 
                (user_id, amount, description, merchant_name, category_id, type, payment_method, 
                 account_id, date, is_verified, is_recurring, created_at)
                VALUES (?, ?, ?, ?, ?, 'expense', ?, 1, ?, 1, 0, ?)
            """, (user_id, amount, f"Belanja {merchant}", merchant, 3, 
                  random.choice(["gopay", "shopeepay", "bca"]), timestamp, timestamp))
            
            transactions_inserted += 1
            total_expense += amount
            balance_tracker -= amount
        
        # Move to next day
        current_date += timedelta(days=1)
        day_count += 1
    
    conn.commit()
    
    # Update account balances based on actual cashflow
    cursor.execute("UPDATE accounts SET balance = ? WHERE user_id = ? AND id = 1", (max(0, balance_tracker), user_id))
    conn.commit()
    
    print(f"\n  ✅ {transactions_inserted} transactions inserted")
    print(f"  📊 Total Income: Rp {total_income:,.0f}")
    print(f"  📊 Total Expense: Rp {total_expense:,.0f}")
    print(f"  📊 Total Savings: Rp {total_savings:,.0f}")
    print(f"  📊 Net Cashflow: Rp {total_income - total_expense - total_savings:,.0f}")
    print(f"  💰 Final Balance: Rp {max(0, balance_tracker):,.0f}")
    
    return transactions_inserted, total_income, total_expense, total_savings


def create_budgets(conn, user_id):
    """Create monthly budgets - realistic limits for 5jt salary."""
    cursor = conn.cursor()
    
    budgets_created = 0
    
    for month_offset in range(3):
        budget_date = TODAY - timedelta(days=month_offset * 30)
        month = budget_date.month
        year = budget_date.year
        
        # Realistic budget limits for 5jt salary
        budget_limits = [
            (1, 1800000),   # Makan: 1.8jt (36%)
            (2, 500000),    # Transport: 500k (10%)
            (3, 300000),    # Belanja: 300k (6%)
            (4, 400000),    # Hiburan: 400k (8%)
            (7, 750000),    # Tagihan: 750k (15%)
            (8, 400000),    # Lain-lain: 400k (8%)
            (11, 1300000),  # Kost: 1.3jt (26%)
        ]
        
        for cat_id, amount in budget_limits:
            cursor.execute("""
                SELECT id FROM budgets 
                WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
            """, (user_id, cat_id, month, year))
            
            if cursor.fetchone():
                continue
            
            # Realistic spending (sometimes over budget!)
            spent = amount * random.uniform(0.75, 1.15)  # Can go over budget
            
            cursor.execute("""
                INSERT INTO budgets (user_id, category_id, amount, spent, month, year, enable_rollover, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, cat_id, amount, spent, month, year, False, TODAY))
            
            budgets_created += 1
    
    conn.commit()
    print(f"\n  ✅ {budgets_created} budgets created (3 months)")
    return budgets_created


def main():
    """Main seed function."""
    print("=" * 70)
    print("🌱 MONEV SEED - Anak Rantau REALISTIS")
    print("=" * 70)
    print(f"👤 User: {USER_EMAIL}")
    print(f"📅 Date Range: {THREE_MONTHS_AGO.strftime('%Y-%m-%d')} to {TODAY.strftime('%Y-%m-%d')}")
    print(f"📁 Database: {DB_PATH}")
    print("=" * 70)
    print()
    
    print("📋 REALISTIC PROFILE:")
    print("   • Gaji: Rp 5.000.000/bulan (tanggal 25)")
    print("   • Freelance: Rp 800.000 - 1.800.000 (inconsistent)")
    print("   • Kost: Rp 1.300.000/bulan")
    print("   • Starting Balance: Rp 850.000 (struggling!)")
    print("   • Savings: Auto-transfer after payday (5% + 3%)")
    print("   • Tier: Sultan (for testing premium features)")
    print("=" * 70)
    
    conn = get_db_connection()
    
    try:
        print("\n👤 Creating User...")
        user_id = create_user_if_not_exists(conn)
        
        print("\n🏦 Creating Accounts...")
        create_accounts(conn, user_id)
        
        print("\n🎯 Creating Goals...")
        create_goals(conn, user_id)
        
        print("\n📈 Creating Investments...")
        create_investments(conn, user_id)
        
        print("\n💳 Generating Transactions...")
        txn_count, total_income, total_expense, total_savings = generate_transactions(conn, user_id)
        
        print("\n💰 Creating Budgets...")
        create_budgets(conn, user_id)
        
        print("\n" + "=" * 70)
        print("✅ SEEDING COMPLETE!")
        print("=" * 70)
        print()
        print("📊 SUMMARY:")
        print(f"   • Total Transactions: {txn_count}")
        print(f"   • Total Income: Rp {total_income:,.0f}")
        print(f"   • Total Expense: Rp {total_expense:,.0f}")
        print(f"   • Total Savings: Rp {total_savings:,.0f}")
        print(f"   • Net Cashflow: Rp {total_income - total_expense - total_savings:,.0f}")
        print(f"   • Savings Rate: {(total_savings/total_income*100):.1f}%")
        print()
        print("🔐 LOGIN CREDENTIALS:")
        print(f"   Email: {USER_EMAIL}")
        print(f"   Password: {PASSWORD}")
        print()
        print("💡 REALISTIC FEATURES:")
        print("   • Transaction timestamps match real-life patterns")
        print("   • Goals/Investments start from ZERO")
        print("   • Savings auto-transferred after payday")
        print("   • Cashflow varies throughout month (tight before payday)")
        print("   • Impulse buys included")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
