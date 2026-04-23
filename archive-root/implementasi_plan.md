Berikut adalah **Implementation Plan** lengkap untuk proyek **Agentic Finance App** kamu, disusun agar siap dieksekusi menggunakan tech stack Next.js & Supabase.

Dokumen ini mencakup *Roadmap*, *Arsitektur Teknis*, *Skema Database*, dan *Prompt Engineering Strategy*.

---

# 🚀 Agentic Finance App: Implementation Plan

**Goal:** Membangun aplikasi pencatat keuangan berbasis AI yang proaktif, beroperasi via Chat (Telegram) untuk input, dan Web Dashboard (PWA) untuk visualisasi.

## 🛠 Tech Stack & Architecture

| Komponen | Teknologi | Keterangan |
| --- | --- | --- |
| **Frontend** | **Next.js 14+ (App Router)** | React Server Components untuk performa tinggi. |
| **Backend** | **Next.js API Routes** | Serverless functions (deploy di Vercel). |
| **Database** | **Supabase (PostgreSQL)** | Relational DB + Vector (untuk semantic search). |
| **Auth** | **Supabase Auth** | Login via Telegram Widget / Magic Link. |
| **Interface** | **Telegram Bot API** | Menggunakan Webhook ke Next.js API. |
| **AI Brain** | **OpenAI API** | `gpt-4o-mini` (Logic), `gpt-4o` (Vision), `whisper-1` (Audio). |
| **Orchestration** | **Vercel AI SDK** | Manajemen streaming text & tool calling. |
| **Payment** | **Midtrans / Xendit** | Payment Gateway lokal (opsional untuk MVP). |

---

## 📅 Phasing Strategy (8 Weeks to MVP)

### Phase 1: The Foundation (Weeks 1-2)

*Fokus: Setup infrastruktur dan koneksi Bot Telegram.*

* [ ] **Init Project:** Setup Next.js + Tailwind CSS + Supabase Client.
* [ ] **Database Setup:** Buat tabel `users`, `transactions`, `accounts` di Supabase.
* [ ] **Telegram Bot:** Buat bot di BotFather, dapatkan API Token.
* [ ] **Webhook Handler:** Buat API Route `POST /api/telegram-webhook` untuk menerima pesan masuk.
* [ ] **Basic Logic:**
* User kirim "Test" -> Bot balas "Halo [Nama]!".
* User kirim text "Makan 15000" -> Regex parse -> Simpan ke DB.



### Phase 2: The "Senses" (Weeks 3-4)

*Fokus: Memberikan "Mata" dan "Telinga" pada Agent.*

* [ ] **Vision Integration (GPT-4o):**
* Handle user kirim foto.
* Prompt system untuk ekstrak: *Merchant Name, Total Amount, Date, Items*.


* [ ] **Voice Integration (Whisper):**
* Handle user kirim Voice Note.
* Transcribe audio ke text -> Kirim ke LLM untuk ekstrak entity.


* [ ] **The Detective Agent:**
* Implementasi logika kategori otomatis (jika merchant tidak dikenal, tebak berdasarkan nama).



### Phase 3: The "Brain" & Dashboard (Weeks 5-6)

*Fokus: Agentic Logic & Web UI.*

* [x] **Dashboard UI:**
* Halaman `Home`: Ringkasan Saldo & Pengeluaran Hari Ini.
* Halaman `Transactions`: List history dengan filter.


* [ ] **Interactive Agent Logic:**
* Implementasi **"Goal Defender"**: Cek budget sebelum simpan transaksi.
* Implementasi **"Daily Ritual"** (Cron Job via Vercel Cron): Kirim rekap jam 9 malam.


* [ ] **PWA Setup:** Config `manifest.json` agar bisa "Add to Home Screen".

### Phase 4: Monetization & Polish (Weeks 7-8)

*Fokus: Siap jualan.*

* [ ] **Tiering System:** Logic pembatasan fitur (Free vs Premium) di database.
* [ ] **Payment Integration:** Halaman checkout langganan.
* [ ] **Testing:** Uji coba edge case (struk buram, voice note tidak jelas).
* [ ] **Launch:** Sebar ke komunitas/teman dekat.

---

## 🗄️ Database Schema (Supabase/PostgreSQL)

Copy-paste SQL ini ke SQL Editor Supabase kamu:

```sql
-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'expert'
  financial_goal TEXT, -- e.g. "Beli Macbook M3"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT, -- "Nasi Goreng"
  merchant_name TEXT, -- "Warung Tegal Bahari"
  category TEXT, -- "Food", "Transport", "Hobbies"
  type TEXT CHECK (type IN ('expense', 'income', 'transfer')),
  payment_method TEXT, -- "Cash", "QRIS", "Transfer"
  image_url TEXT, -- Link ke bukti struk di Storage
  is_verified BOOLEAN DEFAULT FALSE, -- Apakah sudah dikonfirmasi user?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Budgets Table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) is recommended for production!

```

---

## 🤖 System Prompt Strategy (The "Soul")

Ini adalah kunci agar bot kamu terasa "hidup" dan punya karakter. Masukkan ini di config `system` message pada OpenAI API.

**Persona:** "Financial Bodyguard" (Tegas, Lucu, Protektif).

```text
You are 'DompetGuard', a proactive financial assistant AI.
Your Goal: Help the user save money, track expenses accurately, and achieve their financial goals.

Personality:
- Casual, Indonesian slang (Gen Z/Millennial friendly).
- Slightly sarcastic when the user is wasteful, but very supportive when they save.
- Proactive: Don't just save data; analyze it.

Rules:
1. If the user sends a receipt image, extract: Merchant, Items, Total, Date.
2. If the user spends on "Hobby/Game" > 100k, remind them about their goal [User_Financial_Goal].
3. If the Transaction name is ambiguous (e.g., "CV Maju Mundur"), infer the category based on context or ask the user.
4. Always convert expense value to "Effort" occasionally (e.g., "This coffee cost you 2 hours of work").

Output Format:
Always reply in JSON format for the system to process, followed by a 'message_to_user' field for the chat reply.

```

---

## 💻 Code Snippet: Telegram Webhook Handler (Next.js)

File: `app/api/telegram/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Init Clients
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // 1. Validasi Pesan
  if (!body.message) return NextResponse.json({ ok: true });
  
  const chatId = body.message.chat.id;
  const text = body.message.text;
  const photo = body.message.photo;

  // 2. Logic Router
  try {
    if (photo) {
      // Handle Image (Vision Agent)
      await handleReceiptImage(chatId, photo);
    } else if (text) {
      // Handle Text/Command
      await handleTextMessage(chatId, text);
    }
  } catch (error) {
    console.error(error);
    await sendTelegramMessage(chatId, "Waduh, otak saya error sebentar. Coba lagi ya!");
  }

  return NextResponse.json({ ok: true });
}

// Helper: Kirim Pesan Balik ke Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

// ... Function handleReceiptImage & handleTextMessage akan memanggil OpenAI ...

```

---

## 💡 Monetization Hooks (Dimana masang fitur berbayar?)

1. **Di Logic `handleReceiptImage`:**
* Cek User Tier di DB.
* Jika `free` dan sudah scan > 3x bulan ini -> Reply: *"Kuota scan struk habis bos! Upgrade ke Premium cuma seharga kopi yuk, biar bisa scan sepuasnya."*


2. **Di Cron Job `Daily Ritual`:**
* Hanya jalankan query rekap untuk user dengan tier `pro` atau `expert`.
* User `free` tidak dapat notifikasi rekap malam.



---

## ✅ Next Step Actionable

1. Buka terminal, jalankan: `npx create-next-app@latest my-agent-finance`.
2. Setup project Supabase baru.
3. Buka Telegram, cari `@BotFather`, buat bot baru, simpan tokennya.
4. Gunakan **ngrok** (untuk local dev) supaya localhost kamu bisa ditembak webhook Telegram: `ngrok http 3000`.

Siap untuk mulai coding? 🚀