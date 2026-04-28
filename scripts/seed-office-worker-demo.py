#!/usr/bin/env python3
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "sqlite.db"
USER_ID = 1
NOW = datetime.now()

def ts(dt):
    return int(dt.timestamp())

def month_shift(base, months_back):
    month = base.month - months_back
    year = base.year
    while month <= 0:
        month += 12
        year -= 1
    day = min(base.day, 28)
    return datetime(year, month, day, 12, 0, 0)

conn = sqlite3.connect(DB)
conn.execute("PRAGMA foreign_keys = ON")
cur = conn.cursor()

user = cur.execute("SELECT id FROM users WHERE id = ?", (USER_ID,)).fetchone()
if not user:
    raise SystemExit(f"User {USER_ID} not found")

# Reset demo finance data for this user only, keeping login/user credentials intact.
for table in [
    "bill_payments", "recurring_transactions", "usage_tracking", "ai_anomalies_cache",
    "ai_insights_cache", "merchant_mappings", "budgets", "bills", "goals",
    "investments", "debts", "transactions", "accounts", "categories", "user_settings",
]:
    cur.execute(f"DELETE FROM {table} WHERE user_id = ?", (USER_ID,))

categories = [
    ("Gaji", "#16a34a", "Briefcase", "income"),
    ("Kos", "#f97316", "Home", "expense"),
    ("Makan", "#ef4444", "Utensils", "expense"),
    ("Transport", "#0ea5e9", "Bus", "expense"),
    ("Internet & Pulsa", "#8b5cf6", "Wifi", "expense"),
    ("Laundry", "#06b6d4", "Shirt", "expense"),
    ("Hiburan", "#ec4899", "Gamepad2", "expense"),
    ("Kesehatan", "#22c55e", "HeartPulse", "expense"),
    ("Belanja Bulanan", "#eab308", "ShoppingCart", "expense"),
    ("Tabungan", "#14b8a6", "PiggyBank", "expense"),
]
cat_ids = {}
for name, color, icon, typ in categories:
    cur.execute(
        "INSERT INTO categories (user_id, name, color, icon, type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (USER_ID, name, color, icon, typ, ts(NOW)),
    )
    cat_ids[name] = cur.lastrowid

accounts = [
    ("BCA Payroll", "bank", 2450000, "#2563eb", "Landmark"),
    ("GoPay", "emoney", 320000, "#00aa13", "Wallet"),
    ("Cash Dompet", "cash", 280000, "#f59e0b", "Banknote"),
]
account_ids = {}
for name, typ, balance, color, icon in accounts:
    cur.execute(
        "INSERT INTO accounts (user_id, name, type, balance, color, icon, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
        (USER_ID, name, typ, balance, color, icon, ts(NOW), ts(NOW)),
    )
    account_ids[name] = cur.lastrowid

# Three months of realistic office-worker/ngekos cashflow: salary 5M, spend 3.8-4.4M, save the rest.
monthly_patterns = [
    {"salary": 5_000_000, "rent": 1_500_000, "food": 1_450_000, "transport": 430_000, "internet": 185_000, "laundry": 120_000, "shopping": 520_000, "fun": 310_000, "health": 85_000, "saving": 350_000},
    {"salary": 5_000_000, "rent": 1_500_000, "food": 1_320_000, "transport": 390_000, "internet": 185_000, "laundry": 105_000, "shopping": 470_000, "fun": 260_000, "health": 60_000, "saving": 450_000},
    {"salary": 5_000_000, "rent": 1_500_000, "food": 1_380_000, "transport": 410_000, "internet": 185_000, "laundry": 115_000, "shopping": 500_000, "fun": 290_000, "health": 75_000, "saving": 400_000},
]

def add_tx(month_dt, day, amount, desc, merchant, cat, typ="expense", method="debit", account="BCA Payroll", verified=1):
    when = month_dt.replace(day=min(day, 28), hour=9 + (day % 10), minute=15)
    cur.execute(
        """
        INSERT INTO transactions
        (user_id, amount, description, merchant_name, category_id, type, payment_method, account_id, date, is_verified, is_recurring, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (USER_ID, amount, desc, merchant, cat_ids[cat], typ, method, account_ids[account], ts(when), verified, 1 if desc in ["Gaji bulanan", "Bayar kos", "Paket internet + pulsa"] else 0, ts(when)),
    )
    return cur.lastrowid

bill_tx = []
for idx, pattern in enumerate(reversed(monthly_patterns)):
    month_dt = month_shift(NOW, idx)
    add_tx(month_dt, 25, pattern["salary"], "Gaji bulanan", "PT Nusantara Digital", "Gaji", "income", "bank_transfer")
    bill_tx.append(("Kos bulanan", add_tx(month_dt, 2, pattern["rent"], "Bayar kos", "Kos Ibu Ratna", "Kos", "expense", "bank_transfer"), pattern["rent"], month_dt.replace(day=2)))
    bill_tx.append(("Internet dan pulsa", add_tx(month_dt, 7, pattern["internet"], "Paket internet + pulsa", "Telkomsel/MyRepublic", "Internet & Pulsa", "expense", "debit"), pattern["internet"], month_dt.replace(day=7)))
    add_tx(month_dt, 3, 420_000, "Belanja groceries awal bulan", "Indomaret Fresh", "Belanja Bulanan", account="BCA Payroll")
    add_tx(month_dt, 5, 180_000, "Top up GoPay transport", "GoPay", "Transport", method="transfer", account="BCA Payroll")
    add_tx(month_dt, 8, 360_000, "Makan siang kantor minggu 1", "Kantin kantor", "Makan", method="qris", account="GoPay")
    add_tx(month_dt, 12, 340_000, "Makan siang kantor minggu 2", "Warteg Bahari", "Makan", method="qris", account="GoPay")
    add_tx(month_dt, 16, 350_000, "Makan malam dan kopi", "Kopi Kenangan", "Makan", method="qris", account="GoPay")
    add_tx(month_dt, 20, pattern["food"] - 1_050_000, "Meal prep dan jajanan", "Pasar Minggu", "Makan", method="cash", account="Cash Dompet")
    add_tx(month_dt, 10, pattern["transport"] - 180_000, "KRL MRT ojek kantor", "Transport harian", "Transport", method="qris", account="GoPay")
    add_tx(month_dt, 14, pattern["laundry"], "Laundry kiloan", "Laundry 24 Jam", "Laundry", method="cash", account="Cash Dompet")
    add_tx(month_dt, 18, pattern["shopping"] - 420_000, "Perlengkapan kamar kos", "Tokopedia", "Belanja Bulanan")
    add_tx(month_dt, 22, pattern["fun"], "Nonton + nongkrong weekend", "XXI / Kafe", "Hiburan", method="qris", account="GoPay")
    add_tx(month_dt, 24, pattern["health"], "Vitamin dan obat ringan", "Apotek K24", "Kesehatan")
    add_tx(month_dt, 26, pattern["saving"], "Setoran dana darurat", "Tabungan BCA", "Tabungan", "transfer", "bank_transfer")

# Current-month budgets with realistic caps and spent values derived from the pattern.
current = month_shift(NOW, 0)
current_pattern = monthly_patterns[-1]
budget_defs = [
    ("Kos", 1_500_000, current_pattern["rent"]),
    ("Makan", 1_400_000, current_pattern["food"]),
    ("Transport", 450_000, current_pattern["transport"]),
    ("Internet & Pulsa", 200_000, current_pattern["internet"]),
    ("Laundry", 130_000, current_pattern["laundry"]),
    ("Belanja Bulanan", 550_000, current_pattern["shopping"]),
    ("Hiburan", 300_000, current_pattern["fun"]),
    ("Kesehatan", 150_000, current_pattern["health"]),
]
for cat, amount, spent in budget_defs:
    cur.execute(
        "INSERT INTO budgets (user_id, category_id, amount, spent, month, year, enable_rollover, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
        (USER_ID, cat_ids[cat], amount, spent, current.month, current.year, ts(NOW)),
    )

# Savings goals and recurring bills.
goals = [
    ("Dana darurat 3 bulan", 15_000_000, 3_200_000, NOW + timedelta(days=240), "ShieldCheck", "#10b981"),
    ("Laptop kerja baru", 9_000_000, 1_450_000, NOW + timedelta(days=180), "Laptop", "#6366f1"),
    ("Mudik dan liburan akhir tahun", 4_000_000, 900_000, NOW + timedelta(days=120), "Plane", "#f97316"),
]
primary_goal = None
for name, target, current_amount, deadline, icon, color in goals:
    cur.execute(
        "INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (USER_ID, name, target, current_amount, ts(deadline), icon, color, ts(NOW)),
    )
    if primary_goal is None:
        primary_goal = cur.lastrowid

bill_defs = [
    ("Kos bulanan", 1_500_000, "Kos", 2, "monthly", "Home", "#f97316", "Transfer ke pemilik kos tiap awal bulan"),
    ("Internet dan pulsa", 185_000, "Internet & Pulsa", 7, "monthly", "Wifi", "#8b5cf6", "Paket WiFi kos + pulsa data"),
    ("BPJS Kesehatan", 42_000, "Kesehatan", 10, "monthly", "HeartPulse", "#22c55e", "Kelas 3 mandiri"),
    ("Spotify", 55_000, "Hiburan", 15, "monthly", "Music", "#1db954", "Subscription hiburan"),
]
bill_ids = {}
for name, amount, cat, due, freq, icon, color, notes in bill_defs:
    cur.execute(
        """
        INSERT INTO bills (user_id, name, amount, category_id, due_date, frequency, is_paid, last_paid_at, icon, color, is_active, is_subscription, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        """,
        (USER_ID, name, amount, cat_ids[cat], due, freq, 1 if due <= NOW.day else 0, ts(NOW) if due <= NOW.day else None, icon, color, 1 if name == "Spotify" else 0, notes, ts(NOW)),
    )
    bill_ids[name] = cur.lastrowid

for bill_name, tx_id, amount, paid_at in bill_tx:
    if bill_name in bill_ids:
        cur.execute(
            "INSERT INTO bill_payments (bill_id, user_id, amount, paid_at, transaction_id, notes) VALUES (?, ?, ?, ?, ?, ?)",
            (bill_ids[bill_name], USER_ID, amount, ts(paid_at), tx_id, "Auto-seeded payment history"),
        )

for desc, amount, cat, next_day in [
    ("Bayar kos", 1_500_000, "Kos", 2),
    ("Paket internet + pulsa", 185_000, "Internet & Pulsa", 7),
    ("Setoran dana darurat", 400_000, "Tabungan", 26),
]:
    next_run = current.replace(day=min(next_day, 28))
    if next_run < NOW:
        next_run = month_shift(NOW + timedelta(days=31), 0).replace(day=min(next_day, 28))
    cur.execute(
        "INSERT INTO recurring_transactions (user_id, amount, description, category_id, type, frequency, next_run_at, is_active, created_at) VALUES (?, ?, ?, ?, ?, 'monthly', ?, 1, ?)",
        (USER_ID, amount, desc, cat_ids[cat], "expense", ts(next_run), ts(NOW)),
    )

cur.execute(
    """
    INSERT INTO user_settings
    (user_id, hourly_rate, primary_goal_id, has_completed_onboarding, financial_persona, persona_updated_at, daily_report, budget_alert, transaction_update, bill_reminder, goal_progress, report_locale, updated_at)
    VALUES (?, ?, ?, 1, ?, ?, 1, 1, 1, 1, 1, 'id', ?)
    """,
    (USER_ID, 28_500, primary_goal, "Pekerja kantoran ngekos dengan gaji Rp5 juta/bulan; fokus stabilkan arus kas, disiplin makan harian, dan bangun dana darurat.", ts(NOW), ts(NOW)),
)

for months_back in range(3):
    m = month_shift(NOW, months_back)
    cur.execute(
        "INSERT INTO usage_tracking (user_id, month, year, transactions_count, ai_chats_count, ocr_scans_count, telegram_messages_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (USER_ID, m.month, m.year, 18, 4, 2, 0),
    )

conn.commit()
summary = {
    "categories": cur.execute("SELECT COUNT(*) FROM categories WHERE user_id=?", (USER_ID,)).fetchone()[0],
    "accounts": cur.execute("SELECT COUNT(*) FROM accounts WHERE user_id=?", (USER_ID,)).fetchone()[0],
    "transactions": cur.execute("SELECT COUNT(*) FROM transactions WHERE user_id=?", (USER_ID,)).fetchone()[0],
    "budgets": cur.execute("SELECT COUNT(*) FROM budgets WHERE user_id=?", (USER_ID,)).fetchone()[0],
    "goals": cur.execute("SELECT COUNT(*) FROM goals WHERE user_id=?", (USER_ID,)).fetchone()[0],
    "bills": cur.execute("SELECT COUNT(*) FROM bills WHERE user_id=?", (USER_ID,)).fetchone()[0],
    "bill_payments": cur.execute("SELECT COUNT(*) FROM bill_payments WHERE user_id=?", (USER_ID,)).fetchone()[0],
}
conn.close()
print(summary)
