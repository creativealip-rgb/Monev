# 🔌 Monev — API Reference

Semua API endpoints yang tersedia di Monev.

> **Base URL:** `/api`  
> **Auth:** Kebanyakan endpoint memerlukan session NextAuth yang valid.  
> **Format:** JSON request/response.

---

## Authentication

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `*` | `/api/auth/[...nextauth]` | — | NextAuth handler (login, callback, session) |
| `POST` | `/api/auth/guest` | — | Buat akun guest tanpa registrasi |

---

## Transactions

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/transactions` | ✅ | Daftar transaksi user (support pagination, filter) |
| `POST` | `/api/transactions` | ✅ | Buat transaksi baru |
| `GET` | `/api/transactions/[id]` | ✅ | Detail transaksi by ID |
| `PUT` | `/api/transactions/[id]` | ✅ | Update transaksi |
| `DELETE` | `/api/transactions/[id]` | ✅ | Hapus transaksi |
| `GET` | `/api/transactions/export` | ✅ | Export CSV semua transaksi |
| `POST` | `/api/transactions/ocr` | ✅ | Upload foto struk → parse via AI |
| `POST` | `/api/transactions/voice` | ✅ | Upload audio → speech-to-text → parse |

### Query Parameters (`GET /api/transactions`)
```
?page=1&limit=20&category=food&type=expense&startDate=2026-01-01&endDate=2026-01-31&search=makan
```

---

## Categories

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/categories` | ✅ | Daftar semua kategori transaksi |

---

## Budgets

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/budgets` | ✅ | Daftar budget user |
| `POST` | `/api/budgets` | ✅ | Buat budget baru |
| `PUT` | `/api/budgets/[id]` | ✅ | Update budget |
| `DELETE` | `/api/budgets/[id]` | ✅ | Hapus budget |

---

## Bills

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/bills` | ✅ | Daftar tagihan user |
| `POST` | `/api/bills` | ✅ | Buat tagihan baru |
| `PUT` | `/api/bills/[id]` | ✅ | Update tagihan |
| `DELETE` | `/api/bills/[id]` | ✅ | Hapus tagihan |

---

## Goals (Savings)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/goals` | ✅ | Daftar goals/tabungan user |
| `POST` | `/api/goals` | ✅ | Buat goal baru |
| `PUT` | `/api/goals/[id]` | ✅ | Update goal (nama, target, progress) |
| `DELETE` | `/api/goals/[id]` | ✅ | Hapus goal |

---

## Investments

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/investments` | ✅ | Daftar aset investasi user |
| `POST` | `/api/investments` | ✅ | Tambah aset investasi |
| `PUT` | `/api/investments/[id]` | ✅ | Update aset (harga, qty) |
| `DELETE` | `/api/investments/[id]` | ✅ | Hapus aset |

---

## Analytics & Stats

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/analytics` | ✅ | Data analytics lengkap (kategori, tren, heatmap) |
| `GET` | `/api/stats` | ✅ | Quick stats (total saldo, income, expense bulan ini) |

### Response `/api/analytics`
```json
{
  "categoryBreakdown": [...],
  "monthlyTrend": [...],
  "monthlyComparison": { "current": {...}, "previous": {...} },
  "spendingPatterns": { "byDayOfWeek": [...], "byHour": [...] },
  "dailyStats": [...]
}
```

---

## AI

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/chat` | ✅ | Chat dengan AI assistant (streaming response) |
| `POST` | `/api/ai/categorize` | ✅ | Auto-categorize transaksi berdasar deskripsi |

### Request `/api/chat`
```json
{ "message": "Berapa total pengeluaran saya bulan ini?" }
```

---

## Push Notifications

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/push/vapid-key` | — | Dapatkan VAPID public key |
| `POST` | `/api/push/subscribe` | ✅ | Simpan push subscription |
| `POST` | `/api/push/unsubscribe` | ✅ | Hapus push subscription |

---

## Transfer

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/transfer` | ✅ | Transfer antar akun/wallet |

---

## Subscriptions

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/subscriptions` | ✅ | Deteksi langganan dari transaksi recurring |

---

## Coupons

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/coupons/validate` | ✅ | Validasi & redeem kode kupon tier |

---

## Cron Jobs

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/cron/daily-recap` | Cron | Kirim daily recap ke semua user |
| `GET` | `/api/cron/subscription-check` | Cron | Cek & deteksi langganan baru |

---

## Integrations

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/telegram-webhook` | Token | Webhook untuk Telegram bot |
| `POST` | `/api/notification-webhook` | — | Webhook untuk notifikasi eksternal |

---

## Health Check

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `GET` | `/api/ping` | — | Health check endpoint |

### Response
```json
{ "status": "ok", "timestamp": "2026-02-21T..." }
```
