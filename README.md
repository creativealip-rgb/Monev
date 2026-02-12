# Monev - Personal Finance Tracker

Aplikasi pencatatan keuangan pribadi dengan fitur AI Assistant untuk membantu mengelola keuanganmu.

## ✨ Fitur

- 📊 **Dashboard Keuangan** - Lihat ringkasan pemasukan, pengeluaran, dan budget
- 💰 **Catat Transaksi** - Input pemasukan dan pengeluaran dengan mudah
- 📈 **Analitik** - Visualisasi pengeluaran by kategori
- 🎯 **Goals Tabungan** - Tracking progress goals finansial
- 💬 **AI Assistant** - Chat untuk insight dan saran keuangan
- 🔔 **Budget Alerts** - Notifikasi saat mendekati limit budget

## 🚀 Tech Stack

- **Framework**: Next.js 16 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite + Drizzle ORM
- **UI**: Framer Motion untuk animasi
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── budgets/      # Budget management APIs
│   │   ├── categories/   # Category APIs
│   │   ├── dashboard/    # Dashboard stats API
│   │   ├── goals/        # Goals APIs
│   │   ├── stats/        # Monthly stats API
│   │   └── transactions/ # Transaction CRUD APIs
│   ├── analytics/        # Analytics page
│   ├── budgets/          # Budget & Goals page
│   ├── chat/             # AI Chat page
│   ├── fitur/            # Features showcase
│   ├── profile/          # User profile
│   ├── transactions/     # Transaction history
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── backend/
│   └── db/               # Database layer
│       ├── index.ts      # DB connection
│       ├── operations.ts # CRUD operations
│       ├── schema.ts     # Drizzle schema
│       └── seed.ts       # Seed data
├── frontend/
│   ├── components/       # UI components
│   └── lib/              # Utilities
└── shared/
    └── types/            # TypeScript types
```

## 🛠️ Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

Database akan otomatis dibuat dan di-seed dengan data sample saat pertama kali running.

## 📝 Database Schema

### Tables
- `categories` - Kategori transaksi
- `transactions` - Data transaksi pemasukan/pengeluaran
- `budgets` - Budget bulanan per kategori
- `goals` - Target tabungan
- `merchant_mappings` - Mapping merchant ke kategori (untuk auto-categorization)

## 🎯 Roadmap

### Phase 1: Foundation ✅
- [x] Basic transaction recording
- [x] Category management
- [x] Budget tracking
- [x] Goals management
- [x] Simple analytics

### Phase 2: Smart Features 🚧
- [ ] AI-powered categorization
- [ ] Screenshot OCR untuk auto-input
- [ ] Voice memo transcription
- [ ] Smart budget recommendations

### Phase 3: Advanced 📝
- [ ] Recurring transaction detection
- [ ] Investment tracking
- [ ] Multi-currency support
- [ ] Export reports

---

Built with ❤️ for personal finance management
