# Monev — Agentic Finance 💰

Asisten keuangan pribadi berbasis AI. Catat transaksi, analisa pengeluaran, dan raih target keuanganmu dengan bantuan AI yang proaktif.

## ✨ Features

| Feature | Starter | Pro | Sultan |
|---------|---------|-----|--------|
| 💬 **AI Chat** | 5/hari | 100/hari | Unlimited |
| 📊 **Analytics** | Basic | Full & Trends | Predictive |
| 📅 **Budgeting** | 3 categories | 20 categories | Unlimited |
| 🎯 **Goals** | 1 goal | 10 goals | Unlimited |
| 📈 **Investment Tracking** | ❌ | Manual | Real-time Sync |
| 💬 **Telegram Bot** | ❌ | Command-based | AI Conversational |
| 📤 **Export Formats** | CSV | CSV + Excel | CSV + Excel + PDF |
| 👀 **Ad-Free Experience** | ❌ | ✅ | ✅ |
| ☑️ **Unlimited Transactions** | 100/month | ✅ | ✅ |

## 📋 Tier System

| Tier | Price | Features |
|------|-------|----------|
| **Starter** | Rp 0/month | Essential features to get started with finance tracking |
| **Pro** | Rp 29.000/month | Advanced analytics and productivity tools |
| **Sultan** | Rp 49.000/month | Complete financial AI assistant with premium features |


## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Variables

Create `.env.local` with the following:

```env
# Auth
AUTH_SECRET=your-secret-key

# Database
DATABASE_URL=file:./sqlite.db

# AI (OpenAI)
OPENAI_API_KEY=sk-...

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram-webhook

# Push Notifications (optional — generate with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Cron internal (recommended for VPS)
CRON_SECRET=your-cron-secret
```

## ⏱️ VPS Cron

Recurring transactions dijalankan lewat endpoint internal `/api/cron/execute-recurring`.
Di VPS, pasang cron harian dengan script berikut:

```bash
crontab -e
```

```cron
0 0 * * * cd /path/to/Monev && MONEV_BASE_URL=https://domain-kamu.com CRON_SECRET=your-cron-secret ./scripts/run-recurring-cron.sh >> /var/log/monev-recurring-cron.log 2>&1
```

Untuk test manual di VPS:

```bash
cd /path/to/Monev
MONEV_BASE_URL=https://domain-kamu.com CRON_SECRET=your-cron-secret ./scripts/run-recurring-cron.sh
```

## 📁 Project Structure

```
src/
├── app/
│   ├── (protected)/    # Auth-required pages
│   │   ├── analytics/  # Charts, heatmaps, trends
│   │   ├── bills/      # Bill tracking & reminders
│   │   ├── budgets/    # Budget management
│   │   ├── chat/       # AI finance assistant
│   │   ├── dashboard/  # Main dashboard
│   │   ├── investments/# Portfolio tracking
│   │   ├── profile/    # Settings & preferences
│   │   ├── savings/    # Savings goals
│   │   └── transactions/ # Transaction history
│   ├── api/            # API routes (28 endpoints)
│   └── onboarding/     # First-time setup wizard
├── backend/
│   └── db/             # Drizzle schema & operations
├── components/         # Shared components
├── frontend/
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities, i18n, currency
└── lib/                # Server-side utilities
```

## 🧪 Testing

```bash
npm test               # Run all tests once
npm run test:watch     # Watch mode
```

## 🐳 Docker

```bash
docker build -t monev .
docker run -p 3000:3000 monev
```

Or with Docker Compose:

```bash
docker compose up -d
```

## 📱 Android APK

Download the latest APK from `/monev-app.apk` in the running app (Profile > Download Aplikasi Android).

## 🛠 Tech Stack

- **Framework:** Next.js 16 + React 19
- **Database:** SQLite via Drizzle ORM
- **Auth:** NextAuth v5
- **AI:** OpenAI SDK
- **UI:** Tailwind CSS 4 + Framer Motion + Lucide Icons
- **Testing:** Vitest
- **Mobile:** Capacitor (Android)

## 📖 Documentation

| Document | Isi |
|----------|-----|
| [FEATURES.md](docs/FEATURES.md) | Katalog semua fitur (15 area) |
| [API.md](docs/API.md) | API reference (31 endpoints) |
| [DATABASE.md](docs/DATABASE.md) | Schema database (13 tabel + ER diagram) |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, folder structure, design patterns |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Guide deploy (dev, Docker, Dokploy, Android APK) |

## 📄 License

MIT
