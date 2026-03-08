# Monev - Dokumentasi Lengkap Project

> **Monev** adalah aplikasi keuangan pribadi berbasis web (PWA) dan mobile (Android APK) yang dibangun dengan Next.js 16, React 19, TypeScript, dan SQLite. Seluruh UI menggunakan Bahasa Indonesia dengan mata uang IDR. Dilengkapi fitur AI untuk insight keuangan, kategorisasi otomatis, dan asisten chat.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur & Struktur Folder](#3-arsitektur--struktur-folder)
4. [Instalasi & Setup](#4-instalasi--setup)
5. [Environment Variables](#5-environment-variables)
6. [Perintah CLI](#6-perintah-cli)
7. [Database Schema](#7-database-schema)
8. [Autentikasi](#8-autentikasi)
9. [API Endpoints](#9-api-endpoints)
10. [Halaman & Routing](#10-halaman--routing)
11. [Komponen Frontend](#11-komponen-frontend)
12. [Custom Hooks](#12-custom-hooks)
13. [Utilitas & Library](#13-utilitas--library)
14. [Sistem Tier & Gamifikasi](#14-sistem-tier--gamifikasi)
15. [Fitur AI](#15-fitur-ai)
16. [Keamanan](#16-keamanan)
17. [Styling & Theming](#17-styling--theming)
18. [Deployment](#18-deployment)
19. [Testing](#19-testing)
20. [Konvensi Kode](#20-konvensi-kode)

---

## 1. Gambaran Umum

**Monev** (Monitoring Keuangan) adalah SaaS keuangan pribadi yang membantu pengguna:

- Mencatat pemasukan & pengeluaran dengan kategorisasi otomatis (AI)
- Mengelola anggaran bulanan dengan rollover
- Menyimpan target tabungan (goals) dengan auto-transfer
- Melacak tagihan & langganan berulang
- Memantau portofolio investasi (saham, crypto, reksadana, emas, obligasi)
- Mencatat hutang/piutang
- Mengelola transaksi berulang (recurring)
- Menganalisis keuangan dengan grafik, heatmap, sankey chart
- Berinteraksi dengan AI assistant untuk saran keuangan
- Mengekspor laporan ke CSV dan PDF
- Transfer antar akun/rekening

### Platform Target

| Platform | Teknologi | Output |
|---|---|---|
| Web (PWA) | Next.js + Service Worker | Progressive Web App |
| Android | Capacitor | APK (static export) |
| Docker | Standalone build | Container image |

### Sistem Tier

| Tier | Nama | Deskripsi |
|---|---|---|
| `miskin` | Gratis | Fitur dasar, limit ketat |
| `kaya` | Pro | Limit lebih besar, export CSV |
| `sultan` | Premium | Unlimited, Telegram bot, PDF export |

---

## 2. Tech Stack

### Core Framework

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 16.1.6 | Full-stack React framework (App Router) |
| React | 19.2.3 | UI library |
| TypeScript | ^5 | Type safety (strict mode) |
| Tailwind CSS | ^4.2.1 | Utility-first CSS |

### Database & ORM

| Teknologi | Versi | Fungsi |
|---|---|---|
| SQLite | - | Database engine (file-based) |
| better-sqlite3 | ^12.6.2 | Node.js SQLite driver |
| Drizzle ORM | ^0.45.1 | Type-safe ORM |
| Drizzle Kit | ^0.31.9 | Migration & studio tools |
| drizzle-zod | ^0.8.3 | Schema validation dari Drizzle |

### Autentikasi

| Teknologi | Versi | Fungsi |
|---|---|---|
| next-auth | ^5.0.0-beta.30 | Auth framework (JWT session) |
| bcryptjs | ^3.0.3 | Password hashing |

### AI

| Teknologi | Versi | Fungsi |
|---|---|---|
| openai | ^6.21.0 | OpenAI GPT API client |
| ai (Vercel AI SDK) | ^6.0.79 | Streaming AI responses |

### UI & Animasi

| Teknologi | Versi | Fungsi |
|---|---|---|
| framer-motion | ^12.34.0 | Animasi & transisi halaman |
| lucide-react | ^0.563.0 | Icon library |
| recharts | ^3.8.0 | Grafik & chart |
| clsx | ^2.1.1 | Conditional CSS classes |
| tailwind-merge | ^3.4.0 | Merge Tailwind classes |
| lottie-react | ^2.4.1 | Animasi Lottie |
| react-markdown | ^10.1.0 | Render markdown (AI chat) |

### Utilitas

| Teknologi | Versi | Fungsi |
|---|---|---|
| date-fns | ^4.1.0 | Manipulasi tanggal (locale ID) |
| zod | (via drizzle-zod) | Validasi input |
| jspdf | ^4.2.0 | Generate PDF |
| jspdf-autotable | ^5.0.7 | Tabel dalam PDF |
| resend | ^6.9.2 | Email transaksional |
| sharp | ^0.34.5 | Optimisasi gambar |
| idb | ^8.0.3 | IndexedDB wrapper (offline) |

### Mobile (Capacitor)

| Teknologi | Versi | Fungsi |
|---|---|---|
| @capacitor/core | ^8.1.0 | Core runtime |
| @capacitor/android | ^8.1.0 | Android platform |
| @capacitor/haptics | ^8.0.0 | Haptic feedback |
| @capacitor/keyboard | ^8.0.0 | Keyboard control |
| @capacitor/network | ^8.0.1 | Network status |
| @capacitor/status-bar | ^8.0.1 | Status bar control |
| @capacitor/splash-screen | ^8.0.1 | Splash screen |
| capacitor-native-biometric | ^4.2.2 | Biometric auth |

### State Management

| Teknologi | Versi | Fungsi |
|---|---|---|
| @tanstack/react-query | ^5.90.21 | Server state, caching, invalidation |
| React Context | (built-in) | Theme, i18n, currency, auth |

### Dev Tools

| Teknologi | Versi | Fungsi |
|---|---|---|
| ESLint | ^9 | Linting (flat config) |
| Vitest | ^4.0.18 | Unit testing |
| Playwright | ^1.58.2 | E2E testing |
| tsx | ^4.21.0 | TS script runner |
| rimraf | ^6.1.3 | Cross-platform rm -rf |
| cross-env | ^10.1.0 | Cross-platform env vars |

---

## 3. Arsitektur & Struktur Folder

```
monev/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (protected)/              # Route yang butuh autentikasi
│   │   │   ├── dashboard/            # Dashboard utama
│   │   │   ├── transactions/         # Daftar & import transaksi
│   │   │   ├── budgets/              # Manajemen anggaran
│   │   │   ├── savings/              # Target tabungan (goals)
│   │   │   ├── bills/                # Tagihan & langganan
│   │   │   ├── saldo/                # Manajemen akun/rekening
│   │   │   ├── analytics/            # Analitik keuangan
│   │   │   ├── chat/                 # AI chat assistant
│   │   │   ├── investments/          # Portofolio investasi
│   │   │   ├── debts/                # Hutang/piutang
│   │   │   ├── recurring/            # Transaksi berulang
│   │   │   ├── simulations/          # Simulasi keuangan
│   │   │   ├── profile/              # Profil & pengaturan
│   │   │   ├── fitur/                # Daftar fitur & upgrade tier
│   │   │   └── layout.tsx            # Layout protected (auth guard)
│   │   ├── admin/                    # Panel admin
│   │   │   ├── users/                # Manajemen user
│   │   │   ├── analytics/            # Analytics admin
│   │   │   ├── coupons/              # Manajemen kupon
│   │   │   ├── notifications/        # Broadcast notifikasi
│   │   │   └── settings/             # Pengaturan admin
│   │   ├── api/                      # API route handlers (82 file)
│   │   ├── login/                    # Halaman login
│   │   ├── register/                 # Halaman register
│   │   ├── forgot-password/          # Halaman lupa password
│   │   ├── onboarding/               # Alur onboarding
│   │   ├── components/               # Komponen landing page
│   │   ├── globals.css               # Global styles + Tailwind config
│   │   ├── layout.tsx                # Root layout (Server Component)
│   │   ├── ClientLayout.tsx          # Client layout (providers, nav, dll)
│   │   └── page.tsx                  # Landing page
│   │
│   ├── frontend/
│   │   ├── components/               # ~40 komponen React ("use client")
│   │   ├── hooks/                    # 8 custom hooks
│   │   └── lib/                      # 9 file utilitas frontend
│   │
│   ├── backend/
│   │   ├── db/                       # Database layer
│   │   │   ├── index.ts              # Koneksi singleton (WAL mode)
│   │   │   ├── schema.ts             # 21 tabel + types + Zod schemas
│   │   │   ├── operations.ts         # Operasi DB utama (~2090 baris)
│   │   │   ├── account-operations.ts # Operasi akun/rekening
│   │   │   ├── budget-operations.ts  # Operasi budget (rollover, template)
│   │   │   └── goal-operations.ts    # Operasi goal (template, auto-transfer)
│   │   └── actions/                  # Server actions (4 file)
│   │
│   ├── lib/                          # Shared server utilities (29 file)
│   │   ├── ai.ts                     # OpenAI integration
│   │   ├── tier-gate.ts              # Sistem tier & limit
│   │   ├── rate-limit.ts             # Rate limiting
│   │   ├── encryption.ts             # Enkripsi PIN
│   │   ├── mailer.ts                 # Email via Resend
│   │   ├── telegram.ts               # Telegram bot
│   │   ├── pdf-export.ts             # Export PDF
│   │   ├── health-score.ts           # Skor kesehatan keuangan
│   │   └── ...                       # 20+ utilitas lainnya
│   │
│   ├── components/                   # Cross-cutting providers (9 file)
│   │   ├── Providers.tsx             # Root providers
│   │   ├── SecurityProvider.tsx      # PIN lock, biometric, auto-lock
│   │   ├── QueryProvider.tsx         # React Query provider
│   │   └── ...
│   │
│   ├── types/index.ts                # Shared TypeScript types
│   ├── auth.ts                       # next-auth konfigurasi
│   └── auth.config.ts                # Auth middleware (route protection)
│
├── tests/                            # E2E tests (Playwright)
├── scripts/                          # Utility scripts
├── drizzle/                          # Generated migrations
├── android/                          # Capacitor Android project
├── public/                           # Static assets
├── Dockerfile                        # Multi-stage Docker build
├── docker-compose.yml                # Docker Compose config
├── capacitor.config.ts               # Capacitor config
├── drizzle.config.ts                 # Drizzle config (dev)
├── drizzle.config.prod.ts            # Drizzle config (prod)
├── playwright.config.ts              # Playwright config
├── vitest.config.ts                  # Vitest config
├── tailwind.config.ts                # Tailwind config
├── next.config.ts                    # Next.js config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies & scripts
```

### Alur Data (Architecture Flow)

```
Browser/App
    │
    ▼
┌──────────────────────────────────┐
│  Next.js App Router              │
│  ├── Middleware (auth.config.ts) │  ← Route protection
│  ├── Server Components          │  ← SSR
│  └── Client Components          │  ← CSR + React Query
│       └── Custom Hooks           │  ← Data fetching & caching
│            └── apiFetch()        │  ← Centralized API client
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  API Route Handlers              │
│  ├── auth() session check        │  ← Autentikasi
│  ├── Tier gate check             │  ← Limit per tier
│  ├── Rate limiting               │  ← Throttle
│  └── DB Operations               │  ← Drizzle ORM queries
└──────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────┐
│  SQLite (better-sqlite3)         │
│  ├── WAL mode (concurrent read)  │
│  ├── Dev: ./sqlite.db            │
│  └── Prod: /app/data/sqlite.db   │
└──────────────────────────────────┘
```

---

## 4. Instalasi & Setup

### Prasyarat

- Node.js 22+ (disarankan)
- npm 9+
- Git

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repo-url> monev
cd monev

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local sesuai kebutuhan (lihat bagian Environment Variables)

# 4. Push database schema
npx drizzle-kit push

# 5. (Opsional) Seed data kupon
npm run db:seed:coupons

# 6. Jalankan development server
npm run dev
```

Server berjalan di `http://localhost:3000`.

### Troubleshooting

```bash
# Jika port 3000 sudah terpakai atau node process macet:
npm run dev:clean      # Kill semua node process + restart

# Jika cache bermasalah:
npm run dev:reset      # Kill + clean .next cache + restart

# Jika better-sqlite3 gagal build:
npm rebuild better-sqlite3
```

---

## 5. Environment Variables

Buat file `.env.local` di root project:

```env
# === WAJIB ===

# Secret untuk JWT session (generate random string 32+ karakter)
AUTH_SECRET=your-secret-key-here

# Path database SQLite (default: ./sqlite.db)
DATABASE_URL=./sqlite.db

# === OPSIONAL (fitur tertentu) ===

# OpenAI API key (untuk fitur AI: chat, kategorisasi, insight)
OPENAI_API_KEY=sk-...

# Google OAuth (untuk login dengan Google)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Resend API key (untuk email verifikasi & reset password)
RESEND_API_KEY=re_...

# Telegram bot (untuk tier sultan)
TELEGRAM_BOT_TOKEN=...

# Web Push Notifications (VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# === BUILD FLAGS ===

# Set true saat build APK (static export)
IS_APK=false

# Set true saat build Docker (standalone output)
IS_DOCKER=false

# Override API URL (untuk APK yang connect ke server)
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

---

## 6. Perintah CLI

### Development

```bash
npm run dev              # Start dev server (Webpack, 4GB heap)
npm run dev:clean        # Kill node processes + restart dev
npm run dev:reset        # Kill + clean caches + restart dev
```

### Production Build

```bash
npm run build            # Build untuk production (Webpack)
npm run start            # Start production server
npm run build:apk        # Build APK (static export + Capacitor)
```

### Linting

```bash
npm run lint                            # Lint seluruh project
npx eslint src/path/to/file.tsx         # Lint satu file
npx eslint --fix src/path/to/file.tsx   # Auto-fix satu file
```

### Testing

```bash
# Unit tests (Vitest)
npm run test                                     # Jalankan semua test sekali
npm run test:watch                               # Watch mode
npx vitest run src/lib/validations.test.ts       # Jalankan satu file
npx vitest run -t "test name"                    # Jalankan satu test by name

# E2E tests (Playwright) - butuh dev server berjalan
npx playwright test                              # Semua E2E test
npx playwright test tests/login.spec.ts          # Satu spec file
npx playwright test --project=chromium           # Browser tertentu
```

### Database

```bash
npx drizzle-kit push                                      # Push schema ke sqlite.db
npx drizzle-kit generate                                  # Generate migration files
npx drizzle-kit migrate                                   # Jalankan migration (lokal)
npx drizzle-kit migrate --config=drizzle.config.prod.ts   # Jalankan migration (prod)
npx drizzle-kit studio                                    # Buka Drizzle Studio GUI
```

### Scripts Utilitas

```bash
npm run db:seed:coupons          # Seed data kupon
npx tsx scripts/create-admin.ts  # Buat user admin
npx tsx scripts/sync-db.ts       # Sinkronisasi database
npx tsx scripts/repair-db.js     # Perbaiki database rusak
npx tsx scripts/verify-isolation.ts  # Verifikasi isolasi data multi-tenant
```

---

## 7. Database Schema

Database menggunakan SQLite dengan Drizzle ORM. Terdapat **21 tabel** yang didefinisikan di `src/backend/db/schema.ts`.

### Diagram Relasi (Simplified ERD)

```
users ──┬── transactions ──── categories
        │         │
        ├── accounts (source & target)
        │
        ├── budgets ────────── categories
        │
        ├── goals
        │
        ├── bills ──────────── categories
        │    └── bill_payments ── transactions
        │
        ├── debts
        │
        ├── investments
        │
        ├── recurring_transactions ── categories
        │
        ├── user_settings ──── goals (primary_goal)
        │
        ├── sessions
        │
        ├── chat_history
        │
        ├── streaks
        │
        ├── achievements
        │
        ├── merchant_mappings ── categories
        │
        ├── ai_insights_cache
        │
        ├── scheduled_messages
        │
        └── coupon_claims ──── coupons

admin_activity_log ── users (admin)
verification_tokens
password_reset_tokens
```

### Detail Tabel

#### `users` - Data pengguna

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `telegram_id` | INTEGER | Unique, nullable |
| `email` | TEXT | Unique, nullable |
| `email_verified` | TIMESTAMP | Nullable |
| `password` | TEXT | bcrypt hash, nullable (Google OAuth) |
| `name` | TEXT | Nama tampilan |
| `image` | TEXT | URL avatar |
| `username` | TEXT | Username unik |
| `tier` | TEXT | `miskin` / `kaya` / `sultan` (default: miskin) |
| `tier_expires_at` | TIMESTAMP | Nullable (null = permanent) |
| `is_admin` | BOOLEAN | Default: false |
| `is_active` | BOOLEAN | Default: true |
| `deletion_requested_at` | TIMESTAMP | Soft delete |
| `created_at` | TIMESTAMP | Auto |

#### `accounts` - Rekening/akun keuangan

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `name` | TEXT | Nama akun (mis: "BCA", "GoPay") |
| `type` | TEXT | `bank` / `emoney` / `cash` / `credit_card` / `investment_wallet` |
| `balance` | REAL | Saldo saat ini |
| `color` | TEXT | Warna tampilan (hex) |
| `icon` | TEXT | Nama icon Lucide |
| `is_active` | BOOLEAN | Default: true |

#### `transactions` - Transaksi keuangan

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `amount` | REAL | Jumlah (IDR) |
| `description` | TEXT | Keterangan transaksi |
| `merchant_name` | TEXT | Nama merchant (opsional) |
| `category_id` | INTEGER FK | -> categories.id |
| `type` | TEXT | `expense` / `income` / `transfer` / `withdraw` |
| `payment_method` | TEXT | Default: "cash" |
| `destination_type` | TEXT | `goal` / `investment` / `bill` (nullable) |
| `destination_id` | INTEGER | ID tujuan (nullable) |
| `source_type` | TEXT | `goal` / `investment` (nullable) |
| `source_id` | INTEGER | ID sumber (nullable) |
| `fee` | REAL | Biaya transfer (default: 0) |
| `account_id` | INTEGER FK | -> accounts.id |
| `target_account_id` | INTEGER FK | -> accounts.id (transfer) |
| `date` | TIMESTAMP | Tanggal transaksi |
| `is_verified` | BOOLEAN | Default: false |
| `is_recurring` | BOOLEAN | Default: false |
| `split_group_id` | TEXT | ID grup split bill |

**Index**: `user_id`, `date`, `type`, `category_id`, composite `(user_id, date)`

#### `categories` - Kategori transaksi

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | Nullable (null = kategori global) |
| `name` | TEXT | Nama kategori |
| `color` | TEXT | Warna (hex, default: #3b82f6) |
| `icon` | TEXT | Icon Lucide (default: "Wallet") |
| `type` | TEXT | `expense` / `income` |

#### `budgets` - Anggaran bulanan

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `category_id` | INTEGER FK | -> categories.id |
| `amount` | REAL | Batas anggaran |
| `spent` | REAL | Jumlah terpakai (default: 0) |
| `month` | INTEGER | Bulan (1-12) |
| `year` | INTEGER | Tahun |
| `enable_rollover` | BOOLEAN | Sisa bulan lalu diteruskan |

**Index**: `user_id`, `(month, year)`, `(user_id, month, year)`

#### `goals` - Target tabungan

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `name` | TEXT | Nama target |
| `target_amount` | REAL | Jumlah target |
| `current_amount` | REAL | Jumlah terkumpul (default: 0) |
| `deadline` | TIMESTAMP | Batas waktu (nullable) |
| `icon` | TEXT | Icon Lucide |
| `color` | TEXT | Warna (hex) |

#### `bills` - Tagihan & langganan

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `name` | TEXT | Nama tagihan |
| `amount` | REAL | Jumlah tagihan |
| `category_id` | INTEGER FK | -> categories.id |
| `due_date` | INTEGER | Tanggal jatuh tempo (1-31) |
| `frequency` | TEXT | `monthly` / `weekly` / `yearly` |
| `is_paid` | BOOLEAN | Status bayar bulan ini |
| `last_paid_at` | TIMESTAMP | Terakhir dibayar |
| `is_subscription` | BOOLEAN | Apakah langganan |
| `is_active` | BOOLEAN | Aktif/nonaktif |
| `notes` | TEXT | Catatan (nullable) |

#### `bill_payments` - Riwayat pembayaran tagihan

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `bill_id` | INTEGER FK | -> bills.id |
| `user_id` | INTEGER FK | -> users.id |
| `amount` | REAL | Jumlah pembayaran |
| `paid_at` | TIMESTAMP | Tanggal bayar |
| `transaction_id` | INTEGER FK | -> transactions.id |
| `notes` | TEXT | Catatan (nullable) |

#### `debts` - Hutang/piutang

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `debtor_name` | TEXT | Nama penghutang/pemberi hutang |
| `amount` | REAL | Jumlah hutang |
| `description` | TEXT | Keterangan (nullable) |
| `due_date` | TIMESTAMP | Jatuh tempo (nullable) |
| `status` | TEXT | `unpaid` / `paid` |

#### `investments` - Portofolio investasi

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `name` | TEXT | Nama instrumen |
| `type` | TEXT | `stock` / `crypto` / `mutual_fund` / `gold` / `bond` / `other` |
| `quantity` | REAL | Jumlah unit |
| `avg_buy_price` | REAL | Harga beli rata-rata |
| `current_price` | REAL | Harga saat ini |
| `platform` | TEXT | Platform (nullable) |
| `total_dividends` | REAL | Total dividen (default: 0) |
| `realized_profit` | REAL | Profit terealisasi (default: 0) |

#### `recurring_transactions` - Transaksi berulang

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `amount` | REAL | Jumlah |
| `description` | TEXT | Keterangan |
| `category_id` | INTEGER FK | -> categories.id |
| `type` | TEXT | `expense` / `income` |
| `frequency` | TEXT | `daily` / `weekly` / `monthly` |
| `next_run_at` | TIMESTAMP | Jadwal eksekusi berikutnya |
| `is_active` | BOOLEAN | Aktif/nonaktif |

#### `user_settings` - Pengaturan pengguna

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | Unique -> users.id |
| `hourly_rate` | REAL | Tarif per jam (default: 50000 IDR) |
| `primary_goal_id` | INTEGER FK | -> goals.id |
| `security_pin` | TEXT | PIN kunci aplikasi (encrypted) |
| `decoy_pin` | TEXT | PIN samaran (encrypted) |
| `is_app_lock_enabled` | BOOLEAN | Kunci aplikasi aktif |
| `is_biometric_enabled` | BOOLEAN | Biometrik aktif |
| `hide_balance` | BOOLEAN | Sembunyikan saldo |
| `has_completed_onboarding` | BOOLEAN | Status onboarding |
| `financial_persona` | TEXT | Persona AI-generated |
| `daily_report` | BOOLEAN | Notif laporan harian |
| `budget_alert` | BOOLEAN | Notif peringatan budget |
| `quiet_hours_enabled` | BOOLEAN | Mode senyap |
| `quiet_hours_start` | TEXT | Mulai jam senyap (default: 22:00) |
| `quiet_hours_end` | TEXT | Akhir jam senyap (default: 08:00) |
| `auto_lock_timeout` | INTEGER | Timeout auto-lock (ms, default: 300000) |

#### `chat_history` - Riwayat chat AI

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `role` | TEXT | `user` / `assistant` |
| `content` | TEXT | Isi pesan |
| `created_at` | TIMESTAMP | Waktu pesan |

#### `streaks` - Streak pencatatan

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | Unique -> users.id |
| `current_streak` | INTEGER | Streak saat ini (hari) |
| `longest_streak` | INTEGER | Streak terpanjang |
| `last_transaction_date` | TIMESTAMP | Tanggal transaksi terakhir |

#### `achievements` - Pencapaian (gamifikasi)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | INTEGER PK | Auto-increment |
| `user_id` | INTEGER FK | -> users.id |
| `type` | TEXT | Tipe pencapaian |
| `name` | TEXT | Nama pencapaian |
| `description` | TEXT | Deskripsi (nullable) |
| `icon` | TEXT | Icon (nullable) |
| `unlocked_at` | TIMESTAMP | Waktu unlock |

#### Tabel Lainnya

| Tabel | Fungsi |
|---|---|
| `sessions` | Session tracking (device info, IP, last active) |
| `merchant_mappings` | Auto-kategorisasi merchant -> kategori |
| `ai_insights_cache` | Cache insight AI per bulan |
| `scheduled_messages` | Pesan terjadwal |
| `coupons` | Kupon upgrade tier |
| `coupon_claims` | Riwayat klaim kupon |
| `admin_activity_log` | Log aktivitas admin |
| `verification_tokens` | Token verifikasi email |
| `password_reset_tokens` | Token reset password |

---

## 8. Autentikasi

Autentikasi menggunakan **next-auth v5 (beta)** dengan strategi **JWT session** (30 hari).

### Provider

1. **Credentials** - Login email + password
   - Validasi via Zod (email valid + password min 6 karakter)
   - Password di-hash dengan bcryptjs
   - Lookup user dari database

2. **Google OAuth** - Login dengan akun Google
   - `allowDangerousEmailAccountLinking: true` (link otomatis jika email sama)
   - Buat user baru otomatis jika belum ada
   - Generate username dari email prefix (handle duplikat)

### Alur Autentikasi

```
Login Page ─── Credentials ──┐
                              ├── next-auth ── JWT Token ── Session
Google OAuth ─────────────────┘

Setiap request:
1. Middleware (auth.config.ts) check route
2. Public routes: langsung lewat
3. Protected routes: cek JWT valid
4. API routes: auth() -> session?.user?.id
```

### Route Protection (Middleware)

| Route | Akses |
|---|---|
| `/`, `/login`, `/register`, `/forgot-password` | Public |
| `/api/auth/*` | Public |
| `/manifest.json`, `/sw.js`, static assets | Public |
| `/dashboard`, `/transactions`, dll | Protected (redirect ke `/login`) |
| `/admin/*` | Protected + admin check |

### Redirect Logic

- User sudah login mengakses `/`, `/login`, atau `/register` -> redirect ke `/dashboard`
- User belum login mengakses route protected -> redirect ke `/login`

### Konfigurasi

File: `src/auth.ts` dan `src/auth.config.ts`

```typescript
// Contoh pengecekan auth di API route
import { auth } from "@/auth";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id);
    // ... lanjutkan query
}
```

---

## 9. API Endpoints

Semua API route berada di `src/app/api/`. Format response standar:

```json
{
    "success": true,
    "data": { ... }
}

// atau error:
{
    "success": false,
    "error": "Pesan error dalam Bahasa Indonesia"
}
```

### Autentikasi API

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/auth/register` | Registrasi user baru |
| POST | `/api/auth/guest` | Login sebagai guest |
| POST | `/api/auth/forgot-password` | Request reset password |
| POST | `/api/auth/reset-password` | Eksekusi reset password |
| POST | `/api/auth/verify-email` | Verifikasi email |

### Transaksi

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/transactions` | Daftar transaksi (dengan filter & pagination) |
| POST | `/api/transactions` | Buat transaksi baru |
| GET | `/api/transactions/[id]` | Detail transaksi |
| PUT | `/api/transactions/[id]` | Edit transaksi |
| DELETE | `/api/transactions/[id]` | Hapus transaksi |
| POST | `/api/transactions/bulk` | Operasi bulk (delete, dll) |
| POST | `/api/transactions/voice` | Input transaksi via suara (AI) |
| POST | `/api/transactions/ocr` | Scan struk (OCR) |
| GET | `/api/transactions/export` | Export transaksi |
| GET | `/api/transactions/export/csv` | Export ke CSV |

### Kategori

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/categories` | Daftar kategori |
| POST | `/api/categories` | Buat kategori baru |

### Anggaran (Budget)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/budgets` | Daftar anggaran bulan ini |
| POST | `/api/budgets` | Buat anggaran baru |
| PUT | `/api/budgets/[id]` | Edit anggaran |
| DELETE | `/api/budgets/[id]` | Hapus anggaran |
| GET | `/api/budgets/stats` | Statistik anggaran |
| GET | `/api/budgets/template` | Template anggaran tunggal |
| GET | `/api/budgets/templates` | Koleksi template |
| POST | `/api/budgets/rollover` | Rollover manual |

### Target Tabungan (Goals)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/goals` | Daftar target tabungan |
| POST | `/api/goals` | Buat target baru |
| PUT | `/api/goals/[id]` | Edit target |
| DELETE | `/api/goals/[id]` | Hapus target |
| GET | `/api/goals/insights` | Insight AI untuk goals |
| GET | `/api/goals/templates` | Template goal |
| POST | `/api/goals/auto-transfer` | Auto-transfer ke goal |

### Tagihan (Bills)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/bills` | Daftar tagihan |
| POST | `/api/bills` | Tambah tagihan |
| PUT | `/api/bills/[id]` | Edit tagihan |
| DELETE | `/api/bills/[id]` | Hapus tagihan |
| GET | `/api/bills/[id]/history` | Riwayat pembayaran |

### Akun/Rekening

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/accounts` | Daftar akun |
| POST | `/api/accounts` | Tambah akun baru |
| POST | `/api/transfer` | Transfer antar akun |

### Investasi

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/investments` | Daftar investasi |
| POST | `/api/investments` | Tambah investasi |
| PUT | `/api/investments/[id]` | Edit investasi |
| DELETE | `/api/investments/[id]` | Hapus investasi |

### Hutang/Piutang

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/debts` | Daftar hutang |
| POST | `/api/debts` | Tambah hutang |
| PUT | `/api/debts/[id]` | Edit hutang |
| DELETE | `/api/debts/[id]` | Hapus hutang |
| POST | `/api/debts/settle` | Bayar/selesaikan hutang |

### Transaksi Berulang

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/recurring` | Daftar transaksi berulang |
| POST | `/api/recurring` | Tambah recurring |
| PUT | `/api/recurring/[id]` | Edit recurring |
| DELETE | `/api/recurring/[id]` | Hapus recurring |

### AI

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/ai/insight` | Generate insight keuangan |
| POST | `/api/ai/categorize` | Auto-kategorisasi transaksi |
| POST | `/api/ai/simulate` | Simulasi keuangan |
| POST | `/api/ai/analyze-anomalies` | Deteksi anomali pengeluaran |
| POST | `/api/chat` | Chat AI (streaming) |
| GET | `/api/chat/history` | Riwayat chat |

### Analytics

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/analytics` | Data analitik |
| GET | `/api/analytics/sankey` | Data Sankey flow chart |
| GET | `/api/analytics/report` | Generate laporan |
| GET | `/api/analytics/map` | Data peta keuangan |
| GET | `/api/stats` | Statistik dashboard |

### Profil & Pengaturan

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/PUT | `/api/profile` | Profil pengguna |
| POST | `/api/profile/verify-pin` | Verifikasi PIN keamanan |
| POST | `/api/profile/delete` | Request hapus akun |
| GET/DELETE | `/api/profile/sessions` | Manajemen session |
| GET | `/api/profile/export` | Export data pengguna |
| GET/PUT | `/api/profile/notifications` | Preferensi notifikasi |
| GET/PUT | `/api/user/settings` | Pengaturan user |
| GET | `/api/export` | Export data umum |

### Push Notifications

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/push/subscribe` | Subscribe push notification |
| POST | `/api/push/unsubscribe` | Unsubscribe push |
| GET | `/api/push/vapid-key` | Get VAPID public key |
| GET | `/api/config/notifications` | Konfigurasi notifikasi |

### Gamifikasi

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/achievements` | Daftar achievement |
| GET | `/api/streaks` | Data streak |

### Langganan & Kupon

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/POST | `/api/subscriptions` | Manajemen langganan tier |
| POST | `/api/coupons/validate` | Validasi kode kupon |

### Admin

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET/PUT/DELETE | `/api/admin/users` | Manajemen user |
| GET | `/api/admin/analytics` | Analytics admin |
| GET/POST/DELETE | `/api/admin/coupons` | Manajemen kupon |
| POST | `/api/admin/notifications` | Broadcast notifikasi |
| GET | `/api/admin/activity` | Log aktivitas |

### Cron Jobs

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/cron/auto-transfer` | Auto-transfer ke goals |
| POST | `/api/cron/budget-rollover` | Rollover budget bulanan |
| POST | `/api/cron/cleanup-deleted-accounts` | Hapus akun yang direquest delete |
| POST | `/api/cron/subscription-check` | Cek langganan expired |
| POST | `/api/cron/daily-recap` | Kirim rekap harian |

### Webhooks & Lainnya

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/telegram-webhook` | Webhook Telegram bot |
| POST | `/api/notification-webhook` | Webhook notifikasi |
| POST | `/api/onboarding` | Selesaikan onboarding |
| POST | `/api/dashboard/scan` | Scan notifikasi -> transaksi |
| GET | `/api/dashboard/tip` | Tips keuangan harian |
| GET | `/api/ping` | Health check |

---

## 10. Halaman & Routing

### Halaman Publik

| Route | File | Deskripsi |
|---|---|---|
| `/` | `app/page.tsx` | Landing page |
| `/login` | `app/login/page.tsx` | Halaman login |
| `/register` | `app/register/page.tsx` | Halaman registrasi |
| `/forgot-password` | `app/forgot-password/page.tsx` | Lupa password |
| `/onboarding` | `app/onboarding/page.tsx` | Alur onboarding (5 step) |

### Halaman Protected (butuh login)

| Route | File | Deskripsi |
|---|---|---|
| `/dashboard` | `(protected)/dashboard/page.tsx` | Dashboard utama - saldo, transaksi terbaru, ringkasan budget |
| `/transactions` | `(protected)/transactions/page.tsx` | Daftar transaksi dengan filter, sort, bulk actions |
| `/transactions/import` | `(protected)/transactions/import/page.tsx` | Import transaksi dari CSV |
| `/budgets` | `(protected)/budgets/page.tsx` | Kelola anggaran bulanan per kategori |
| `/savings` | `(protected)/savings/page.tsx` | Target tabungan / goals |
| `/bills` | `(protected)/bills/page.tsx` | Tagihan & langganan berulang |
| `/saldo` | `(protected)/saldo/page.tsx` | Daftar rekening/akun & saldo |
| `/analytics` | `(protected)/analytics/page.tsx` | Analitik lengkap (overview, tren, insight, heatmap) |
| `/chat` | `(protected)/chat/page.tsx` | AI chat assistant |
| `/investments` | `(protected)/investments/page.tsx` | Portofolio investasi |
| `/debts` | `(protected)/debts/page.tsx` | Hutang/piutang |
| `/recurring` | `(protected)/recurring/page.tsx` | Transaksi berulang |
| `/simulations` | `(protected)/simulations/page.tsx` | Simulasi keuangan (AI) |
| `/profile` | `(protected)/profile/page.tsx` | Profil & pengaturan |
| `/fitur` | `(protected)/fitur/page.tsx` | Daftar fitur aplikasi |
| `/fitur/upgrade` | `(protected)/fitur/upgrade/page.tsx` | Upgrade tier |
| `/fitur/notification-guide` | `(protected)/fitur/notification-guide/page.tsx` | Panduan setup notifikasi |

### Halaman Admin

| Route | File | Deskripsi |
|---|---|---|
| `/admin` | `admin/page.tsx` | Dashboard admin |
| `/admin/users` | `admin/users/page.tsx` | Manajemen user |
| `/admin/analytics` | `admin/analytics/page.tsx` | Analytics admin |
| `/admin/coupons` | `admin/coupons/page.tsx` | Manajemen kupon |
| `/admin/notifications` | `admin/notifications/page.tsx` | Broadcast notifikasi |
| `/admin/settings` | `admin/settings/page.tsx` | Pengaturan admin |

### Layout Hierarchy

```
RootLayout (Server Component)
├── lang="id", font Plus Jakarta Sans
├── PWA metadata & service worker
└── Providers (SessionProvider + I18nProvider + QueryProvider)
    │
    ├── Public Pages (/, /login, /register, dll)
    │
    └── Protected Layout (Client Component)
        ├── Cek onboarding status
        └── SecurityProvider (PIN lock, biometric)
            └── ClientLayout
                ├── ThemeProvider (light/dark)
                ├── CurrencyProvider (IDR/USD/dll)
                ├── ToastProvider
                ├── NetworkStatus monitoring
                ├── NativeNotificationService
                ├── BottomNav + FAB
                └── Page content (with PageTransition animation)
```

---

## 11. Komponen Frontend

Semua komponen di `src/frontend/components/` menggunakan `"use client"`.

### Komponen Transaksi

| Komponen | File | Deskripsi |
|---|---|---|
| `AddTransactionSheet` | `AddTransactionSheet.tsx` | Bottom sheet dengan template cepat & form manual |
| `TransactionForm` | `TransactionForm.tsx` | Form lengkap input transaksi (jumlah, kategori, akun, dll) |
| `EditTransactionForm` | `EditTransactionForm.tsx` | Form edit transaksi yang sudah ada |
| `TransactionItem` | `TransactionItem.tsx` | Baris transaksi (icon, deskripsi, jumlah, tanggal) |
| `TransactionQuickFilters` | `TransactionQuickFilters.tsx` | Chip filter cepat (semua, pemasukan, pengeluaran) |
| `CSVImportWizard` | `CSVImportWizard.tsx` | Wizard import CSV multi-langkah |

### Komponen AI

| Komponen | File | Deskripsi |
|---|---|---|
| `SmartInput` | `SmartInput.tsx` | Input pintar (teks/suara -> AI parse ke transaksi) |
| `VoiceVisualizer` | `VoiceVisualizer.tsx` | Visualisasi gelombang suara saat recording |
| `QuickReplies` | `QuickReplies.tsx` | Tombol quick reply di AI chat |
| `DailyInsight` | `DailyInsight.tsx` | Kartu insight harian dari AI |

### Komponen Budget & Forms

| Komponen | File | Deskripsi |
|---|---|---|
| `BudgetForms` | `BudgetForms.tsx` | Form buat/edit anggaran |
| `DetailModals` | `DetailModals.tsx` | Modal detail (transaksi, budget, dll) |
| `DetailModalsVerified` | `DetailModalsVerified.tsx` | Modal detail dengan verifikasi |
| `SplitBillFlow` | `SplitBillFlow.tsx` | Alur split bill multi-step |

### Komponen Navigasi & Layout

| Komponen | File | Deskripsi |
|---|---|---|
| `BottomNav` | `BottomNav.tsx` | Navigasi bawah dengan FAB (+) di tengah |
| `PageTransition` | `PageTransition.tsx` | Animasi transisi antar halaman (Framer Motion) |
| `Portal` | `Portal.tsx` | React Portal wrapper untuk modal/overlay |
| `PullToRefresh` | `PullToRefresh.tsx` | Gesture tarik ke bawah untuk refresh |
| `InfiniteScrollList` | `InfiniteScrollList.tsx` | List dengan infinite scroll |

### Komponen Data Visualization

| Komponen | File | Deskripsi |
|---|---|---|
| `SankeyFlowChart` | `SankeyFlowChart.tsx` | Sankey chart aliran uang |
| `HealthScoreWidget` | `HealthScoreWidget.tsx` | Widget skor kesehatan keuangan |
| `QuickStatsSummary` | `QuickStatsSummary.tsx` | Ringkasan statistik cepat |
| `StatsCard` | `StatsCard.tsx` | Kartu statistik |
| `HeroBalanceCard` | `HeroBalanceCard.tsx` | Kartu saldo hero di dashboard |

### Komponen UI Umum

| Komponen | File | Deskripsi |
|---|---|---|
| `Toast` | `Toast.tsx` | Sistem notifikasi toast + ToastProvider |
| `ConfirmDialog` | `ConfirmDialog.tsx` | Dialog konfirmasi (hapus, dll) |
| `TransferModal` | `TransferModal.tsx` | Modal transfer antar akun |
| `EmptyState` | `EmptyState.tsx` | Ilustrasi state kosong |
| `LoadingStates` | `LoadingStates.tsx` | Komponen loading state |
| `LoadingSkeleton` | `LoadingSkeleton.tsx` | Placeholder skeleton loading |
| `ImagePreview` | `ImagePreview.tsx` | Preview gambar |
| `OfflineBadge` | `OfflineBadge.tsx` | Badge indikator offline |

### Komponen Settings & Misc

| Komponen | File | Deskripsi |
|---|---|---|
| `ThemeToggle` | `ThemeToggle.tsx` | Toggle light/dark mode |
| `ThemeSelector` | `ThemeSelector.tsx` | Selector tema extended |
| `LanguageSelector` | `LanguageSelector.tsx` | Dropdown pilih bahasa |
| `SecurityGuard` | `SecurityGuard.tsx` | Wrapper keamanan (blur konten jika locked) |
| `TierGateOverlay` | `TierGateOverlay.tsx` | Overlay pembatas fitur per tier |
| `BillReminderWidget` | `BillReminderWidget.tsx` | Widget pengingat tagihan |
| `FeatureItem` | `FeatureItem.tsx` | Item dalam daftar fitur |

### Komponen Halaman Analytics

| Komponen | File | Deskripsi |
|---|---|---|
| `AnalyticsTabs` | `analytics/components/AnalyticsTabs.tsx` | Tab navigasi analytics |
| `OverviewTab` | `analytics/components/OverviewTab.tsx` | Tab overview |
| `TrendsTab` | `analytics/components/TrendsTab.tsx` | Tab tren |
| `InsightsTab` | `analytics/components/InsightsTab.tsx` | Tab insight AI |
| `FinancialMap` | `analytics/components/FinancialMap.tsx` | Peta keuangan |
| `NetWorthCard` | `analytics/components/NetWorthCard.tsx` | Kartu net worth |
| `MonthComparison` | `analytics/components/MonthComparison.tsx` | Perbandingan bulan |
| `SpendingHeatmap` | `analytics/components/SpendingHeatmap.tsx` | Heatmap pengeluaran |
| `CalendarHeatmap` | `analytics/components/CalendarHeatmap.tsx` | Heatmap kalender |

---

## 12. Custom Hooks

Semua hooks di `src/frontend/hooks/`.

### `useDashboardData`

Hook utama untuk data dashboard. Menggunakan React Query.

```typescript
const {
    stats,        // { totalBalance, monthlyIncome, monthlyExpense, transactionCount }
    transactions, // TransactionWithCategory[]
    budgets,      // BudgetSummary[]
    isLoading,
    error,
    refreshAll,
} = useDashboardData();
```

- Query keys: `["stats"]`, `["recent-transactions"]`, `["budgets"]`
- Mendengarkan event `"transactionAdded"` untuk invalidasi cache
- Invalidasi `["accounts"]` saat transaksi baru

### `useAccountsData`

Data akun/rekening dengan saldo.

```typescript
const {
    accounts,     // Account[]
    totalBalance, // number
    isLoading,
    error,
    refreshAccounts,
} = useAccountsData();
```

- Query key: `["accounts"]`
- Mendengarkan event `"transactionAdded"` untuk refresh saldo

### `useTransactionsData`

Daftar transaksi dengan filter dan pagination.

```typescript
const {
    transactions, // TransactionWithCategory[]
    isLoading,
    error,
    filters,      // { type, category, dateFrom, dateTo, search }
    setFilters,
    loadMore,
    hasMore,
} = useTransactionsData();
```

### `useSavingsData`

Data target tabungan (goals).

```typescript
const {
    goals,        // GoalWithProgress[]
    isLoading,
    error,
    refresh,
} = useSavingsData();
```

### `useAIParser`

Parsing teks/suara ke data transaksi menggunakan AI.

```typescript
const {
    parse,        // (text: string) => Promise<ParsedTransaction>
    isLoading,
    error,
} = useAIParser();
```

### `useWebPush`

Manajemen subscription push notification.

```typescript
const {
    isSupported,  // boolean
    isSubscribed, // boolean
    subscribe,    // () => Promise<void>
    unsubscribe,  // () => Promise<void>
} = useWebPush();
```

### `useNetworkStatus`

Deteksi status online/offline.

```typescript
const { isOnline } = useNetworkStatus();
```

### `useHaptics`

Haptic feedback via Capacitor (hanya di native app).

```typescript
const { impact, notification, selection } = useHaptics();
// impact("light" | "medium" | "heavy")
// notification("success" | "warning" | "error")
// selection()
```

---

## 13. Utilitas & Library

### Frontend Utilities (`src/frontend/lib/`)

#### `utils.ts` - Fungsi inti

```typescript
// Merge Tailwind classes tanpa konflik
cn("p-4 text-red-500", condition && "bg-blue-500")

// Format mata uang
formatCurrency(1500000)          // "Rp 1.500.000"
formatCurrency(100, "USD")       // "$100"
// Didukung: IDR, USD, EUR, SGD, MYR (dengan konversi statis)
```

#### `api-client.ts` - HTTP client

```typescript
// Centralized fetch wrapper
const data = await apiFetch("/api/transactions", {
    method: "POST",
    body: { amount: 50000, description: "Makan siang" },
});
// Fitur: timeout, APK base URL injection, error handling
```

#### `offline-manager.ts` - Manajemen offline

Menyimpan transaksi ke IndexedDB saat offline dan sync saat online kembali.

#### Context Providers

| File | Provider | Hook |
|---|---|---|
| `theme-context.tsx` | `ThemeProvider` | `useTheme()` |
| `i18n-context.tsx` | `I18nProvider` | `useI18n()` / `t()` |
| `currency-context.tsx` | `CurrencyProvider` | `useCurrency()` |
| `hero-theme.tsx` | `HeroThemeProvider` | `useHeroTheme()` |

### Server Utilities (`src/lib/`)

#### AI & Machine Learning

| File | Fungsi |
|---|---|
| `ai.ts` | Integrasi OpenAI GPT (chat, parsing, kategorisasi) |
| `financial-advising.ts` | Kalkulasi saran keuangan (runway, idle cash) |
| `context-engine.ts` | Engine konteks AI untuk personalisasi |
| `subscription-detector.ts` | Deteksi langganan otomatis dari pola transaksi |
| `health-score.ts` | Kalkulasi skor kesehatan keuangan |

#### Keamanan

| File | Fungsi |
|---|---|
| `encryption.ts` | Enkripsi (derive key dari seed untuk PIN) |
| `security.ts` | Utilitas keamanan umum |
| `biometric.ts` | Autentikasi biometrik (Capacitor native) |
| `rate-limit.ts` | Rate limiting |
| `api-rate-limit.ts` | Rate limit khusus API |
| `password-validation.ts` | Validasi kekuatan password |
| `disposable-emails.ts` | Blocklist domain email disposable |

#### Export & Laporan

| File | Fungsi |
|---|---|
| `pdf-export.ts` | Generate PDF (jsPDF + autotable) |
| `report-generator.ts` | Generator laporan keuangan |
| `importers/csv-parser.ts` | Parser CSV untuk import transaksi |

#### Komunikasi

| File | Fungsi |
|---|---|
| `mailer.ts` | Kirim email via Resend |
| `telegram.ts` | Integrasi Telegram bot |

#### Lainnya

| File | Fungsi |
|---|---|
| `tier-gate.ts` | Sistem tier & limit fitur |
| `validations.ts` | Validasi input |
| `cache-manager.ts` | Caching server-side |
| `image-optimize.ts` | Optimisasi gambar (Sharp) |
| `logger.ts` | Structured logging |
| `error-messages.ts` | Konstanta pesan error (Bahasa Indonesia) |
| `transaction-pipeline.ts` | Pipeline pemrosesan transaksi |

### Database Operations (`src/backend/db/`)

#### `operations.ts` (~2090 baris) - Operasi utama

Fungsi-fungsi utama:

```typescript
// Kategori
getCategories(userId)
createCategory(data)

// Transaksi
createTransaction(data)          // + update saldo akun otomatis
getTransactions(userId, filters)
updateTransaction(id, data)
deleteTransaction(id)

// Budget
getBudgets(userId, month, year)
createBudget(data)
updateBudget(id, data)
deleteBudget(id)

// Goals
getGoals(userId)
createGoal(data)
updateGoal(id, data)
deleteGoal(id)

// User Settings
getUserSettings(userId)
updateUserSettings(userId, data)

// Debts, Bills, Investments, Chat History, dll.
```

#### `account-operations.ts` - Operasi akun

```typescript
getAccounts(userId)
getAccountById(id, userId)
createAccount(data)
updateAccount(id, data)
updateAccountBalance(id, amount, operation)
```

#### `budget-operations.ts` - Operasi budget lanjutan

```typescript
processBudgetRollover(userId, month, year)
recalculateBudgetSpent(budgetId)
createBudgetFromTemplate(userId, templateId)
```

#### `goal-operations.ts` - Operasi goal lanjutan

```typescript
applyGoalTemplate(userId, template)  // "emergency-fund", "home-downpayment", "vacation"
autoTransferToGoal(userId, goalId, amount)
```

### Server Actions (`src/backend/actions/`)

| File | Fungsi |
|---|---|
| `auth-actions.ts` | Login, register, password management |
| `profile-actions.ts` | Update profil |
| `onboarding-actions.ts` | Complete onboarding |
| `fitur-actions.ts` | Fitur & tier actions |

---

## 14. Sistem Tier & Gamifikasi

### Tier System

Didefinisikan di `src/lib/tier-gate.ts`. 3 level tier:

#### Tier `miskin` (Gratis)

| Fitur | Limit |
|---|---|
| Transaksi | 50/bulan |
| Budget | 2 |
| Goals | 1 |
| Tagihan | 3 |
| Investasi | 0 (tidak bisa) |
| AI Chat | 3 pesan/hari |
| Export | Tidak tersedia |
| Kategori custom | 3 |

#### Tier `kaya` (Pro)

| Fitur | Limit |
|---|---|
| Transaksi | Unlimited |
| Budget | 10 |
| Goals | 10 |
| Tagihan | 20 |
| Investasi | 5 |
| AI Chat | Unlimited |
| Export | CSV/Excel |
| Kategori custom | Unlimited |

#### Tier `sultan` (Premium)

| Fitur | Limit |
|---|---|
| Transaksi | Unlimited (cap 1000) |
| Budget | Unlimited |
| Goals | Unlimited |
| Tagihan | Unlimited |
| Investasi | Unlimited |
| AI Chat | Unlimited + prioritas |
| Export | CSV/Excel/PDF |
| Telegram bot | Ya |
| Support | 24/7 |

### Upgrade Tier

- Via halaman `/fitur/upgrade`
- Gunakan kode kupon (`/api/coupons/validate`)
- Admin bisa generate kupon via `/admin/coupons`
- Tier bisa memiliki `tier_expires_at` (expiry)

### Gamifikasi

#### Streaks

- Streak bertambah setiap hari user mencatat transaksi
- Ditampilkan di dashboard
- Track `current_streak` dan `longest_streak`

#### Achievements

- Unlock otomatis berdasarkan aktivitas
- Contoh: "Pencatat Pertama" (transaksi pertama), "Budget Master" (semua budget terpenuhi)
- Disimpan di tabel `achievements` dengan `type`, `name`, `description`, `icon`

---

## 15. Fitur AI

### AI Chat Assistant

- Endpoint: `POST /api/chat` (streaming via Vercel AI SDK)
- Model: OpenAI GPT
- Context: Data keuangan user (transaksi, budget, goals, dll)
- Riwayat: Disimpan di tabel `chat_history`
- UI: Halaman `/chat` dengan bubble chat, quick replies, markdown rendering

### Auto-Kategorisasi

- Endpoint: `POST /api/ai/categorize`
- Input: Deskripsi transaksi
- Output: Kategori yang paling cocok
- Juga menggunakan `merchant_mappings` untuk cache hasil

### Insight Keuangan

- Endpoint: `POST /api/ai/insight`
- Analisis otomatis keuangan bulanan
- Cache di `ai_insights_cache` (per bulan)
- Ditampilkan di Analytics -> Insights tab

### Simulasi Keuangan

- Endpoint: `POST /api/ai/simulate`
- Halaman `/simulations`
- Simulasi skenario keuangan (pensiun, rumah, dll)

### Deteksi Anomali

- Endpoint: `POST /api/ai/analyze-anomalies`
- Deteksi pengeluaran tidak biasa
- Bandingkan dengan pola historis

### Voice-to-Transaction

- Endpoint: `POST /api/transactions/voice`
- Input suara -> transkripsi -> AI parse ke data transaksi
- Komponen: `SmartInput`, `VoiceVisualizer`

### OCR Struk

- Endpoint: `POST /api/transactions/ocr`
- Foto struk -> parse detail transaksi

### Financial Persona

- Disimpan di `user_settings.financial_persona`
- AI-generated personality/style keuangan user
- Digunakan untuk personalisasi saran

---

## 16. Keamanan

### Autentikasi & Otorisasi

- JWT session (30 hari) via next-auth
- Middleware route protection
- Setiap API route wajib cek `auth()` session
- Admin check terpisah untuk `/admin` routes

### App Lock

- **PIN Lock**: 4-6 digit PIN (encrypted dengan `deriveKeyFromSeed`)
- **Biometric**: Sidik jari / face unlock via Capacitor native biometric
- **Auto-lock**: Otomatis kunci setelah timeout (default: 5 menit)
- **Decoy PIN**: PIN samaran yang menampilkan data palsu
- **Stealth Mode**: Sembunyikan saldo dari tampilan

Diimplementasikan di `src/components/SecurityProvider.tsx`.

### Keamanan API

- Rate limiting per endpoint
- Input validation via Zod
- User ID isolation (setiap query filter `user_id`)
- Whitelist field untuk PUT request (mencegah userId override)
- Try-catch wrapper di semua API route
- Password hashing (bcryptjs)
- Email verification token
- Disposable email blocking

### Keamanan Build

- `x-powered-by` header disabled
- `console.log` removed di production build
- Non-root user di Docker
- Environment variables tidak di-expose ke client (kecuali `NEXT_PUBLIC_*`)

---

## 17. Styling & Theming

### Tailwind CSS v4

Konfigurasi di `tailwind.config.ts` dan `src/app/globals.css`.

### Design Tokens (CSS Variables)

```css
/* Light Mode */
--primary: sky-500 (#0ea5e9)
--secondary: cyan-500
--background: soft blue (#eff6ff)
--foreground: slate-900
--success: green
--warning: amber
--destructive: red

/* Dark Mode */
--primary: sky-400 (brighter)
--background: slate-900
```

### Dark Mode

- Strategy: `class` (toggle class pada `<html>`)
- Gunakan `dark:` variants di Tailwind
- Toggle via `ThemeToggle` component
- Context: `useTheme()` hook

### Custom CSS Classes

| Class | Deskripsi |
|---|---|
| `.glass` | Glass morphism (backdrop-blur + transparency) |
| `.glass-card` | Glass card dengan dark mode support |
| `.card-clean` | Clean card style (rounded-3xl, shadow) |
| `.btn-primary` | Tombol gradient sky blue |
| `.btn-secondary` | Tombol bordered putih |
| `.btn-ghost` | Tombol ghost (text only) |
| `.input-modern` | Input field modern dengan glass effect |
| `.icon-box` | Container icon centered |
| `.gradient-primary` | Gradient sky blue |
| `.gradient-success` | Gradient hijau |
| `.gradient-danger` | Gradient merah |
| `.shimmer` | Efek shimmer loading |
| `.float` | Animasi floating (6s) |
| `.no-scrollbar` | Hide scrollbar |

### Utility Function

```typescript
import { cn } from "@/frontend/lib/utils";

// Merge conditional classes tanpa konflik
<div className={cn(
    "p-4 rounded-xl",
    isActive && "bg-primary/10",
    variant === "danger" && "bg-destructive/10"
)} />
```

### Animasi

- **Framer Motion**: Page transitions, modal animations, list animations
- **CSS Animations**: shimmer, float, pulse-glow, accordion
- **Lottie**: Animasi Lottie untuk onboarding

---

## 18. Deployment

### Docker (Rekomendasi untuk Production)

#### Dockerfile

Multi-stage build:
1. **deps**: Install dependencies
2. **builder**: Build Next.js (standalone output)
3. **runner**: Runtime image (node:22-alpine, non-root)

```bash
# Build image
docker build -t monev .

# Run container
docker run -p 3000:3000 \
  -v monev-data:/app/data \
  -e AUTH_SECRET=your-secret \
  -e OPENAI_API_KEY=sk-... \
  monev
```

#### Docker Compose

```bash
docker-compose up -d
```

Konfigurasi:
- Port: 3000
- Volume: `monev-data` -> `/app/data` (persistent SQLite)
- Traefik labels untuk reverse proxy + HTTPS
- Domain: `monevapp.web.id`

#### Migration di Production

```bash
# Di dalam container
npx drizzle-kit migrate --config=drizzle.config.prod.ts
```

### Android APK (Capacitor)

```bash
# 1. Build static export
IS_APK=true npm run build

# 2. Sync ke Capacitor
npx cap sync android

# 3. Build APK (atau gunakan script)
npm run build:apk
```

Konfigurasi di `capacitor.config.ts`:
- App ID: `com.creativealip.monev`
- Web Dir: `out` (static export)
- Membutuhkan `NEXT_PUBLIC_API_URL` untuk connect ke server

### PWA

Otomatis melalui:
- `@ducanh2912/next-pwa` plugin
- `manifest.json` di public
- Service worker (`sw.js`)
- iOS: `apple-mobile-web-app-capable: yes`

---

## 19. Testing

### Unit Tests (Vitest)

Konfigurasi di `vitest.config.ts`:
- Environment: `node`
- Globals enabled
- Path alias: `@` -> `./src`

```bash
npm run test           # Jalankan sekali
npm run test:watch     # Watch mode
```

File test yang ada:
- `src/lib/validations.test.ts` - Validasi input
- `src/lib/rate-limit.test.ts` - Rate limiting
- `src/backend/db/schema.test.ts` - Schema database
- `src/frontend/lib/utils.test.ts` - Utility functions

### E2E Tests (Playwright)

Konfigurasi di `playwright.config.ts`:
- Timeout: 120 detik
- Base URL: `http://localhost:3000`
- Browser: Chromium (utama)
- Screenshot on failure
- Traces on first retry

```bash
# Pastikan dev server berjalan dulu
npm run dev

# Jalankan E2E tests
npx playwright test
```

File test E2E:
- `tests/auth.setup.ts` - Setup autentikasi
- `tests/login.spec.ts` - Alur login
- `tests/dashboard.spec.ts` - Dashboard
- `tests/transactions.spec.ts` - Transaksi
- `tests/budgets.spec.ts` - Budget
- `tests/bills.spec.ts` - Tagihan
- `tests/debts.spec.ts` - Hutang
- `tests/savings.spec.ts` - Tabungan
- `tests/saldo.spec.ts` - Akun/saldo

---

## 20. Konvensi Kode

### Formatting

- **Indent**: 4 spasi (bukan tab)
- **Semicolons**: Selalu wajib
- **Quotes**: Double quotes (`"`) untuk import dan JSX attributes
- **Trailing commas**: Ya, di multi-line objects/arrays
- **Max line length**: ~100 karakter (soft limit)
- **Tidak menggunakan Prettier** - ikuti pola yang ada

### Penamaan

| Kategori | Konvensi | Contoh |
|---|---|---|
| File komponen | PascalCase.tsx | `TransactionItem.tsx` |
| File non-komponen | kebab-case.ts | `api-client.ts` |
| Komponen | PascalCase + `export function` | `export function TransactionItem()` |
| Fungsi/variabel | camelCase | `formatCurrency`, `handleSubmit` |
| Interface props | PascalCase + `Props` | `interface TransactionFormProps` |
| Tipe data | PascalCase | `type TransactionWithCategory` |
| Konstanta | UPPER_SNAKE_CASE | `CATEGORY_STYLES` |
| Nama tabel DB | camelCase | `userSettings` |
| Nama kolom DB | snake_case | `user_id`, `created_at` |

### Urutan Import

```typescript
"use client";                              // 1. Directive

import { useState } from "react";          // 2. React/Next.js built-ins
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";    // 3. Library eksternal
import { format } from "date-fns";

import { cn } from "@/frontend/lib/utils"; // 4. Internal @/ imports
import type { Transaction } from "@/types";

import { helper } from "./helper";         // 5. Relative imports (hindari)
```

### Pola Komponen

```typescript
"use client";

import { useState } from "react";
import { cn } from "@/frontend/lib/utils";

interface MyComponentProps {
    label: string;
    variant?: "primary" | "secondary";
    onAction?: () => void;
}

export function MyComponent({ label, variant = "primary", onAction }: MyComponentProps) {
    const [active, setActive] = useState(false);
    return (
        <div className={cn("p-4 rounded-xl", active && "bg-primary/10")}>
            {label}
        </div>
    );
}
```

Aturan:
- Gunakan `export function` (bukan arrow function, bukan `React.FC`)
- Props via `interface` dengan destructuring
- Default value inline: `variant = "primary"`
- `"use client"` hanya jika menggunakan hooks atau browser API

### Pola API Route

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const db = getDb();
        // ... query
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json(
            { success: false, error: "Terjadi kesalahan internal" },
            { status: 500 }
        );
    }
}
```

Aturan:
- Selalu cek `auth()` di awal; return 401 jika tidak ada
- Response envelope: `{ success: boolean, data?: ..., error?: string }`
- Wrap dengan try/catch; `console.error`; return 500
- Pesan error menggunakan Bahasa Indonesia

### TypeScript

- **Strict mode** aktif
- `interface` untuk props komponen; `type` untuk union & data shape
- Hindari `any` - gunakan `unknown` + type guard
- Path alias: `@/*` -> `./src/*`
- Tipe dari Drizzle: `typeof table.$inferSelect`

### Error Handling

- **API routes**: try/catch + `console.error` + JSON response (400/401/500)
- **Komponen**: try/catch + `console.error` + state error (`useState<string | null>`)
- Nested try/catch untuk operasi non-kritis (misal: kirim email)
- Pesan error user-facing dalam **Bahasa Indonesia**

---

## Lampiran

### Lokasi File Penting

| File | Lokasi | Deskripsi |
|---|---|---|
| Root Layout | `src/app/layout.tsx` | Entry point, metadata, providers |
| Client Layout | `src/app/ClientLayout.tsx` | Navigation, security, theme |
| Auth Config | `src/auth.ts` + `src/auth.config.ts` | Autentikasi & middleware |
| DB Schema | `src/backend/db/schema.ts` | Definisi semua tabel |
| DB Connection | `src/backend/db/index.ts` | Singleton connection (WAL) |
| DB Operations | `src/backend/db/operations.ts` | Semua operasi database |
| Tier System | `src/lib/tier-gate.ts` | Limit per tier |
| API Client | `src/frontend/lib/api-client.ts` | HTTP client wrapper |
| Shared Types | `src/types/index.ts` | TypeScript types |
| Global CSS | `src/app/globals.css` | Styles + design tokens |
| Tailwind Config | `tailwind.config.ts` | Tailwind configuration |
| Next.js Config | `next.config.ts` | Build & runtime config |

### Domain Produksi

- Web: `https://monevapp.web.id`
- Database: `/app/data/sqlite.db` (dalam Docker volume)

### Kontak & Repository

- App ID (Android): `com.creativealip.monev`
- Dikembangkan oleh: CreativeAlip
