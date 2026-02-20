# 🚀 Monev — Deployment Guide

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
git clone https://github.com/creativealip-rgb/Monev.git
cd Monev
npm install
cp .env.local.example .env.local   # Edit with your credentials
npx drizzle-kit push               # Run migrations
npm run dev                        # Start dev server → http://localhost:3000
```

### Environment Variables
```env
# Required
AUTH_SECRET=                    # Random string for NextAuth
DATABASE_URL=file:./sqlite.db  # SQLite database path

# AI Features
OPENAI_API_KEY=sk-...          # OpenAI API key

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=            # Bot token from @BotFather
TELEGRAM_WEBHOOK_URL=          # Public URL for webhook

# Push Notifications (optional)
VAPID_PUBLIC_KEY=              # Generate: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
```

---

## Production Build

### Standard Build
```bash
npm run build     # Build Next.js production bundle
npm start         # Start production server
```

### Static Export (untuk Capacitor)
```bash
# next.config sudah dikonfigurasi untuk static export
npm run build     # Generates /out directory
```

---

## Docker

### Dockerfile
```bash
docker build -t monev .
docker run -p 3000:3000 \
  -v monev-data:/app/data \
  -e AUTH_SECRET=your-secret \
  -e DATABASE_URL=file:/app/data/sqlite.db \
  -e OPENAI_API_KEY=sk-... \
  monev
```

### Docker Compose
```bash
docker compose up -d
```

> **Volume**: SQLite database disimpan di volume `monev-data` agar persisten.

---

## Dokploy

1. Buat service baru → pilih **Git**
2. Repository: `https://github.com/creativealip-rgb/Monev.git`
3. Branch: `monev-deploy`
4. Build type: **Dockerfile**
5. Environment variables: set semua env vars
6. Volumes: `/app/data` → persistent volume untuk SQLite
7. Deploy!

---

## Android APK (Capacitor)

### Prerequisites
- Android Studio (with SDK 33+)
- Java 17+

### Build APK

```bash
# 1. Build Next.js static export
npm run build

# 2. Copy web assets ke Capacitor
npx cap copy android

# 3. Sync plugins
npx cap sync android

# 4. Open di Android Studio
npx cap open android

# 5. Di Android Studio:
#    Build → Build Bundle(s) / APK(s) → Build APK(s)
```

### Live Reload (Development)
```bash
# Start dev server dulu
npm run dev

# Update capacitor.config.ts server URL ke IP lokal:
# server: { url: 'http://192.168.x.x:3000', cleartext: true }

npx cap run android
```

### Signed APK (Release)
1. Generate keystore:
   ```bash
   keytool -genkey -v -keystore monev-release.keystore -alias monev -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Di Android Studio: Build → Generate Signed Bundle / APK
3. Pilih keystore yang sudah di-generate
4. Build type: **release**

---

## Database Migrations

### Push Schema Changes
```bash
npx drizzle-kit push          # Push schema ke database
```

### Generate Migration
```bash
npx drizzle-kit generate      # Generate SQL migration file
```

### View Studio
```bash
npx drizzle-kit studio        # Visual database browser
```

---

## Testing

```bash
npm test                # Run all tests once (vitest run)
npm run test:watch      # Watch mode (vitest)
```

---

## Monitoring

### Health Check
```
GET /api/ping → { "status": "ok", "timestamp": "..." }
```

### Cron Jobs
Set up cron scheduler (e.g. crontab, Dokploy cron, atau external scheduler):

| Cron | Endpoint | Deskripsi |
|------|----------|-----------|
| `0 21 * * *` | `/api/cron/daily-recap` | Daily spending recap (jam 9 malam) |
| `0 6 * * *` | `/api/cron/subscription-check` | Deteksi langganan baru (jam 6 pagi) |

```bash
# Contoh crontab
0 21 * * * curl -s https://your-domain.com/api/cron/daily-recap
0 6  * * * curl -s https://your-domain.com/api/cron/subscription-check
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `DATABASE_URL` error | Pastikan directory writable, cek permission |
| Auth redirect loop | Cek `AUTH_SECRET` sudah diset |
| AI chat error | Pastikan `OPENAI_API_KEY` valid dan ada credit |
| Push notification error | Generate VAPID keys: `npx web-push generate-vapid-keys` |
| Android build fail | Pastikan Java 17+ dan Android SDK 33+ |
| SQLite locked | Pastikan hanya 1 instance running |
