# 🚀 Agentic Finance App: Feature Specification

## Konsep Utama
Aplikasi keuangan yang tidak hanya mencatat (pasif), tetapi bertindak sebagai Financial Assistant yang proaktif, protektif, dan memiliki "perasaan" (psikologis).

## Tech Stack Target
- **Frontend/Backend**: Next.js (TypeScript)
- **AI Orchestration**: LangGraph.js / Vercel AI SDK
- **LLM**: OpenAI GPT-4o (Reasoning & Vision)
- **Database**: Supabase (PostgreSQL + pgvector)
- **Interface Utama**: Mobile Web (PWA) & Telegram Bot (untuk input cepat)

---

## I. Core Ingestion (Cara Data Masuk)

**Tantangan**: Mengatasi friction user yang malas mencatat.

### 1. The "Screenshot" Agent (Vision)
**Trigger**: User upload screenshot bukti transfer/QRIS ke Bot Telegram/App.

**Logic**: 
- OCR membaca gambar
- Ekstrak Merchant, Nominal, Tanggal

**Agent Action**: Auto-input ke database tanpa user mengetik manual.

### 2. The "Notification" Listener (Android Only)
**Trigger**: Aplikasi mendeteksi notifikasi dari Gojek/BCA/Tokopedia.

**Logic**: Regex parsing teks notifikasi.

**Agent Action**: Auto-log transaksi di background.

### 3. The "Voice Memo" Catcher
**Trigger**: User kirim Voice Note: "Tadi beli bensin 20 ribu sama parkir 2 ribu."

**Logic**: 
- Speech-to-Text (Whisper API)
- Entity Extraction

**Agent Action**: Mencatat transaksi multi-item sekaligus.

---

## II. Smart Categorization & Context

**Tantangan**: Kategori "Uncategorized" yang menumpuk.

### 4. The "Detective" Agent
**Trigger**: Transaksi masuk dengan nama merchant ambigu (misal: "CV. MAKMUR JAYA").

**Logic**: Agent melakukan Google Search nama merchant.

**Observation**: Ditemukan sebagai "Toko Bahan Kue".

**Action**: Otomatis set kategori: "Groceries / Bahan Makanan".

### 5. The "Reimbursable Spy" (Freelancer Special)
**Trigger**: Transaksi ke vendor aset digital (Niagahoster, Namecheap, Envato).

**Logic**: Pola ini biasanya untuk pekerjaan, bukan pribadi.

**Action**:
> "Bos, ini beli domain di Namecheap buat klien siapa? Jawab namanya biar saya masukin folder 'Belum Ditagih'."

---

## III. Psychological & Defensive Budgeting

**Tantangan**: User boros karena tidak merasa 'sakit' saat mengeluarkan uang.

### 6. The "Goal Defender" (Konsekuensi Nyata)
**Trigger**: Pengeluaran impulsif (Top up game/Hobi) terdeteksi.

**Logic**: Menghitung ulang estimasi tercapainya Financial Goal user.

**Action**:
> "Gara-gara top up 500rb tadi, target beli MacBook Pro mundur 2 minggu (dari 1 Nov jadi 15 Nov). Yakin mau lanjut boros?"

### 7. The "Impulse Buying Judge" (Intervensi)
**Trigger**: Screenshot halaman Checkout e-commerce (sebelum bayar).

**Logic**: Cek history pembelian barang serupa.

**Action**:
> "Eits, bulan lalu kan baru beli Keyboard Mechanical. Masa beli lagi? Kalau ini di-checkout, budget ngopi seminggu hangus ya."

### 8. The "Time-Cost Translator"
**Trigger**: Pengeluaran gaya hidup mewah (Dinner mahal).

**Logic**: Konversi Rupiah ke "Jam Kerja Coding" (berdasarkan Rate Card user).

**Action**:
> "Makan malam ini seharga 4 jam debugging error React. Worth it rasanya?"

### 9. The "Freelance Reality Check"
**Trigger**: Uang masuk dalam jumlah besar (Invoice cair).

**Logic**: Membagi income besar tersebut ke "Gaji Bulanan" rata-rata.

**Action**:
> "Dapat 20 Juta! Tapi ingat, ini buat hidup 4 bulan. Di dashboard saya tampilin saldo kamu cuma 5 Juta ya, sisanya saya umpetin biar nggak khilaf."

---

## IV. Optimization & Maintenance

**Tantangan**: Kebocoran uang kecil (Latte factor & Subscription).

### 10. The "Subscription Hunter"
**Trigger**: Transaksi rutin tanggal sama setiap bulan.

**Logic**: 
- Deteksi pola berulang
- Cek frekuensi penggunaan layanan tersebut

**Action**:
> "Netflix kepotong 186rb lagi, padahal bulan ini kamu jarang nonton. Mau saya ingetin buat unsubscribe?"

### 11. The "Idle Cash Optimizer"
**Trigger**: Saldo mengendap di rekening operasional > rata-rata penggeluaran.

**Logic**: Menghitung potensi bunga jika dipindah ke instrumen investasi.

**Action**:
> "Ada 5 Juta nganggur di Gopay. Sayang nih. Kalau dipindah ke Reksadana Pasar Uang, lumayan buat beli kopi bulan depan."

### 12. The "Inflation-Adjusted Saving"
**Trigger**: Berita ekonomi (Inflasi/BBM naik).

**Logic**: Menghitung ulang daya beli target tabungan.

**Action**:
> "Inflasi naik 5%. Target 50 Juta kamu harus dinaikin jadi 52.5 Juta biar nilainya sama. Yuk naikin setoran bulanan dikit."

---

## V. Social Finance

**Tantangan**: Uang nyampur dengan uang teman.

### 13. The "Split Bill" Coordinator
**Trigger**: Transaksi F&B dengan nominal besar (misal > 500rb).

**Logic**: Anomali penggeluaran pribadi.

**Action**:
> "Habis 1 Juta di Haidilao? Ini traktir atau patungan? Kalau patungan, sebut nama temanmu, saya catat sebagai 'Piutang'."

### 14. The "Social Debt Collector"
**Trigger**: Tanggal janji bayar hutang teman terlewat.

**Action**: Menawarkan jasa copywriting.

> "Si Budi belum bayar utang 100rb. Mau saya buatin draft chat WA nagih yang sopan atau yang galak?"

---

## VI. Cash Management (The Black Hole)

**Tantangan**: Melacak uang tunai yang tidak ada jejak digitalnya.

### 15. The "Pocket Transfer" Agent
**Trigger**: Penarikan Tunai ATM terdeteksi.

**Action**: Tidak mencatat sebagai Expense, tapi Transfer dari Bank -> Dompet Tunai (Akun Virtual).

### 16. The "Burn Rate" Check (Stock Opname)
**Trigger**: 3-5 hari setelah tarik tunai.

**Logic**: Interogasi saldo sisa fisik.

**Action**:
> "Bos, 3 hari lalu tarik 500rb. Coba cek dompet, sisa berapa lembar? (Misal user jawab: 200rb). Oke, berarti 300rb terpakai. Saya catat rata sebagai 'Jajan & Transport' ya?"

---

## VII. Daily Ritual (The Feedback Loop)

**Waktu**: Setiap jam 21:00 WIB.

**Agent Action**:
1. Scan semua transaksi hari ini
2. Cek progress budget harian
3. Kirim laporan ringkas (Rekap) via Telegram/Notifikasi:

> "Lapor Bos! Hari ini habis Rp 150.000. Hemat 50rb dari jatah harian! Ada 1 transaksi 'Toko Abadi' (100rb) yang saya deteksi mainan, bener masuk kategori Hobi? Insight: Kalau besok hemat lagi, weekend bisa makan enak."

---

## Implementation Priority

### Phase 1: Foundation
- [ ] Basic transaction recording (text input)
- [ ] Telegram Bot integration
- [ ] Supabase database setup
- [ ] Simple dashboard

### Phase 2: Smart Input
- [ ] Screenshot Agent (Vision OCR)
- [ ] Voice Memo Catcher (Whisper API)
- [ ] Smart Categorization (Detective Agent)

### Phase 3: Psychological Features
- [ ] Goal Defender
- [ ] Impulse Buying Judge
- [ ] Time-Cost Translator
- [ ] Freelance Reality Check

### Phase 4: Advanced Optimization
- [ ] Subscription Hunter
- [ ] Idle Cash Optimizer
- [ ] Daily Recap (Rekap Malam)

### Phase 5: Social & Cash
- [ ] Split Bill Coordinator
- [ ] Cash Burn Rate Check
- [ ] Social Debt Collector

---

## Database Schema Overview

### Core Tables
- `users` - User profiles & settings
- `transactions` - All financial transactions
- `categories` - Transaction categories (with AI-suggested)
- `goals` - Financial goals (MacBook, Travel, etc.)
- `budgets` - Monthly budget allocations
- `subscriptions` - Recurring payments tracking
- `debts` - Social debts (lent/borrowed)
- `cash_accounts` - Virtual cash tracking
- `ai_conversations` - Chat history with AI Agent

### AI-Related Tables
- `merchant_mappings` - Merchant -> Category mappings (learned)
- `user_patterns` - User spending patterns
- `interventions` - Record of AI interventions
- `insights` - Generated insights & recommendations

---

## API Endpoints Needed

### Transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions
- `POST /api/transactions/ocr` - Process screenshot
- `POST /api/transactions/voice` - Process voice memo

### AI Features
- `POST /api/ai/categorize` - Auto-categorize transaction
- `POST /api/ai/intervene` - Check for intervention opportunity
- `POST /api/ai/recap` - Generate daily recap
- `POST /api/ai/chat` - Chat with AI Assistant

### Telegram Webhook
- `POST /api/telegram-webhook` - Handle Telegram messages

---

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI/LLM
OPENAI_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=

# Optional: Other Services
GOOGLE_SEARCH_API_KEY=
GOOGLE_CX_ID=
```

---

## Success Metrics

- **User Retention**: 70%+ users active after 30 days
- **Input Friction**: < 10 seconds to record transaction
- **Categorization Accuracy**: > 85% auto-categorized correctly
- **Goal Achievement**: Users reach 20% more goals with intervention
- **Time Saved**: 5+ hours/month vs manual tracking

---

*Last Updated: February 2026*
*Version: 1.0*
