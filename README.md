# Monev — Agentic Finance 💰

Asisten keuangan pribadi berbasis AI. Catat transaksi, analisa pengeluaran, dan raih target keuanganmu dengan bantuan AI yang proaktif.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 💬 **AI Chat** | Tanya asisten AI tentang kondisi keuanganmu |
| 📊 **Analytics** | Grafik pengeluaran, perbandingan bulanan, heatmap spending |
| 🔔 **Smart Notifications** | Pengingat tagihan, daily recap, dan push notifications |
| 💱 **Multi-Currency** | Support IDR, USD, EUR, SGD, MYR |
| 🌐 **Multi-Language** | Indonesia & English |
| 🎯 **Goal Tracking** | Target tabungan dan investasi |
| 📱 **PWA + Android** | Install as app, offline support |
| 🤖 **Telegram Bot** | Catat transaksi via Telegram |

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

## 📄 License

MIT
