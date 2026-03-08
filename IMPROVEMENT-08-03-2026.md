# Monev - Improvement Audit Report

**Tanggal**: 8 Maret 2026
**Auditor**: AI Code Auditor
**Scope**: Seluruh 17 halaman aplikasi Monev
**Total kode yang diaudit**: 12,000+ baris
**Total temuan**: 200+

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Section yang Harus Dihapus / Digabung](#2-section-yang-harus-dihapus--digabung)
3. [Critical Bugs](#3-critical-bugs)
4. [Fitur yang Hilang (Missing Features)](#4-fitur-yang-hilang-missing-features)
5. [Masalah Bahasa (Inkonsistensi EN/ID)](#5-masalah-bahasa-inkonsistensi-enid)
6. [Code Quality Issues](#6-code-quality-issues)
7. [UX Problems Per Halaman](#7-ux-problems-per-halaman)
8. [Performance Concerns](#8-performance-concerns)
9. [Dead Code & Unused Imports](#9-dead-code--unused-imports)
10. [Top 10 Prioritas Perbaikan](#10-top-10-prioritas-perbaikan)

---

## 1. Ringkasan Eksekutif

| Metrik | Jumlah |
|---|---|
| Halaman yang diaudit | 17 |
| Critical bugs | 17 |
| Missing features | 12 |
| Section redundan (hapus/gabung) | 20+ |
| Unused imports | 30+ |
| `@ts-ignore` suppressions | 8+ |
| Mega-file (>800 baris) | 4 file |
| Halaman dengan inkonsistensi bahasa | 6+ |
| `window.confirm()` di mobile app | 5+ halaman |

### Skor Kesehatan Per Halaman

| Halaman | Baris | Bugs | Redundansi | Missing Feature | Skor |
|---|---|---|---|---|---|
| Dashboard | 800 | 5 | Tinggi (streak 3x, alert 4x) | - | D |
| Transactions | 1,377 | 3 | Sedang | ~~Infinite scroll broken~~ FIXED | D |
| Budgets | 1,646 | 4 | Tinggi (3 chart duplikat) | Navigasi bulan | D |
| Savings | 665 | 1 | Rendah | Filter/sort | B |
| Bills | 816 | 2 | Sedang (banner duplikat) | Edit bill, calendar click | C |
| Saldo | 656 | 2 | Sedang (2x add button) | Edit/delete akun | D |
| Analytics | 372 | 1 | Rendah | Date picker close | B |
| Investments | 643 | 1 | Tinggi (3 chart duplikat) | Sort/filter, notes input | C |
| Debts | 1,021 | 1 | Rendah | Edit hutang | C |
| Recurring | 495 | 0 | Rendah | Edit recurring | C |
| Chat | 620 | 3 | Sedang (2 quick actions) | Quota indicator | C |
| Simulations | 592 | 1 | Rendah | Error feedback | B |
| Profile | 1,696 | 2 | Tinggi (bahasa 3x, backup 2x) | - | D |
| Landing | 367 | 0 | Sedang (5 CTA) | SEO metadata | C |
| Login | 451 | 2 | Sedang (shared components) | - | C |
| Register | 610 | 2 | Sedang (shared components) | Terms link broken | C |
| Onboarding | 158 | 0 | Rendah | - | A |

---

## 2. Section yang Harus Dihapus / Digabung

### 2.1 Dashboard (`dashboard/page.tsx`)

#### HAPUS: Feature Grid "Fitur Andalan" (9 icon grid)

**Lokasi**: `page.tsx` lines 362-405

**Alasan**: Grid 3x3 ini hanya berisi shortcut ke halaman lain (Budget, Savings, Analytics, dll). BottomNav di bawah sudah menyediakan navigasi yang sama. Section ini menghabiskan ~300px ruang scroll tanpa memberikan value baru. User harus scroll melewati ini untuk sampai ke transaksi terbaru yang jauh lebih penting.

**Dampak hapus**: Halaman lebih ringkas, transaksi terbaru lebih cepat terlihat.

#### GABUNG: 4 Widget Peringatan Pengeluaran → 1 "Smart Alert"

**Widget yang overlap**:
1. Spending Alert Banner (lines 251-295) -- "Pengeluaran sudah 80% dari income"
2. Spending Anomalies Alert (lines 314-338) -- "Kategori X naik Y%"
3. QuickStatsSummary "Tips Hari Ini" card -- "Hati-hati pengeluaran hari ini!"
4. DailyInsight (lines 353-360) -- AI insight yang sering juga soal pengeluaran

**Alasan**: User bisa melihat 4 peringatan tentang pengeluaran dalam satu scroll. Ini membuat semua peringatan kehilangan urgensi (alert fatigue). Gabungkan menjadi 1 card "Smart Alert" yang menampilkan peringatan paling penting saja.

**Rekomendasi**: Buat komponen `<SmartAlert>` yang memilih 1 alert paling relevan berdasarkan prioritas: anomali > budget warning > daily tip.

#### HAPUS: Streak Badge di Header (sudah ada di QuickStatsSummary)

**Lokasi**: Header lines 206-213

**Alasan**: Streak ditampilkan 3 kali:
1. Header badge "🔥 X Hari"
2. QuickStatsSummary card "Streak Hari Ini"
3. (Juga di Profile page gamification bar)

Cukup tampilkan di QuickStatsSummary saja.

---

### 2.2 Budgets (`budgets/page.tsx`)

#### HAPUS: Bar Chart (BudgetChart)

**Lokasi**: `page.tsx` lines 430-436

**Alasan**: Data budget ditampilkan 3 kali:
1. **Pie Chart** -- alokasi per kategori (persentase)
2. **Bar Chart** -- budget vs actual per kategori
3. **Budget Cards** -- progress bar + angka per kategori

Bar chart dan budget cards menunjukkan informasi yang hampir identik (budget vs spent). Hapus bar chart, pertahankan pie chart (untuk overview cepat) dan budget cards (untuk detail per kategori).

**Dampak**: Budget cards langsung terlihat tanpa perlu scroll melewati 2 chart.

#### HAPUS: Pie Chart Legend

**Lokasi**: `BudgetPieChart.tsx` lines 100-133

**Alasan**: Legend menampilkan setiap kategori dengan nama, jumlah, dan persentase -- informasi yang 100% sama dengan budget card list di bawahnya. Cukup tampilkan pie chart donut saja (tanpa legend), karena budget cards sudah jadi "legend" yang lebih informatif.

#### FIX: Label "Anggaran Tahunan" → "Anggaran Bulanan"

**Lokasi**: `page.tsx` line 425

**Alasan**: Section header mengatakan "Anggaran Tahunan" tapi data yang ditampilkan adalah budget bulan ini (diambil dengan parameter `month` dan `year` untuk bulan berjalan). Menyesatkan.

---

### 2.3 Bills (`bills/page.tsx`)

#### GABUNG: Bill Reminder Summary Banner → Summary Card

**Lokasi**: Banner lines 350-395, Summary Card lines 324-348

**Alasan**: Summary Card sudah menampilkan "X belum dibayar" dan total unpaid. Banner di bawahnya mengulangi "Total tagihan bulan ini" dan "Belum dibayar count". Satu-satunya info unik di banner adalah "Terlambat count" -- tambahkan ini ke Summary Card, lalu hapus banner.

#### FIX: Toast Spam on Page Load

**Lokasi**: `useEffect` lines 94-133

**Alasan**: Setiap bill overdue/urgent memicu toast tersendiri. User dengan 5 overdue + 3 urgent = 8 toast berturut-turut saat buka halaman. Ganti dengan 1 banner/alert: "Kamu punya 5 tagihan terlambat dan 3 segera jatuh tempo".

---

### 2.4 Investments (`investments/page.tsx`)

#### HAPUS: Stacked Bar Chart

**Lokasi**: `page.tsx` lines 355-390

**Alasan**: Allocation data ditampilkan 3 kali:
1. **Pie/Donut Chart** -- persentase visual
2. **Horizontal Stacked Bar** -- persentase visual (format berbeda)
3. **Legend Grid** -- teks dengan persentase

Pie chart + legend sudah cukup. Hapus stacked bar.

---

### 2.5 Chat (`chat/page.tsx`)

#### GABUNG: Quick Actions Card (permanen) + Quick Replies (per message)

**Lokasi**: Quick Actions lines 355-379, Quick Replies lines 500-511

**Alasan**: Quick Actions card selalu terlihat di atas chat, tidak pernah collapse. Quick Replies muncul setelah setiap AI message. Keduanya berfungsi sebagai "shortcut pertanyaan cepat". Rekomendasi:
- Hapus Quick Actions card yang permanen
- Buat Quick Replies lebih prominent (pindah ke bawah input area)
- Atau: Collapse Quick Actions setelah user mengirim pesan pertama

---

### 2.6 Profile (`profile/page.tsx`)

#### HAPUS: Duplicate Language Selector

**Lokasi**: 
1. Main page `<LanguageSelector />` (line 618)
2. Account Modal language `<select>` (lines 836-848)

**Alasan**: Bahasa bisa diubah di 2 tempat berbeda dengan mekanisme berbeda (satu pakai `useI18n` context, satu tulis langsung ke `localStorage`). Bisa conflict. Hapus yang di Account Modal, pertahankan yang di main page.

#### HAPUS: Duplicate CSV Backup Button

**Lokasi**:
1. Account Modal (lines 852-874)
2. Export Modal / "Data & Backup" menu (lines 1582-1634)

**Alasan**: Export/backup sudah punya menu sendiri. Tidak perlu ada di Account Modal yang fungsinya edit profil.

#### HAPUS: Duplicate Telegram Bot Button

**Lokasi**: Integrations Modal lines 988-998 dan 1001-1014

**Alasan**: Dua tombol berurutan, keduanya link ke `https://t.me/MonevappBot`. Jelas leftover dari iterasi. Hapus salah satu.

---

### 2.7 Landing Page (`page.tsx`)

#### HAPUS: Trust Section

**Lokasi**: Lines 227-237

**Alasan**: Menampilkan 4 label teks (FREELANCERS, FOUNDERS, SAVERS, INVESTORS) tanpa angka, logo, atau bukti apapun. Terlihat seperti section "social proof logos" tapi isinya kosong. Bukan trust signal yang nyata. Lebih baik dihapus daripada mengurangi kredibilitas.

#### KURANGI: 5 CTA → 3 CTA

**Lokasi**: Navbar, Hero, How it Works, Footer, StickyCTA

**Rekomendasi**: Hapus CTA di How it Works section (sudah ada StickyCTA yang floating). Pertahankan: Navbar, Hero, Footer, StickyCTA (4 sudah cukup).

---

### 2.8 Onboarding (`onboarding/`)

#### HAPUS: Dead Components

| File | Baris | Alasan |
|---|---|---|
| `components/CTAScreen.tsx` | 216 | Tidak pernah diimport di manapun |
| `components/OnboardingCard.tsx` | 26 | Tidak pernah diimport di manapun |

Total 242 baris dead code.

---

## 3. Critical Bugs

### ~~3.1 Dashboard: Field Mismatch `createdAt` vs `created_at`~~ FIXED

**File**: `dashboard/page.tsx` line 108 + `useDashboardData.ts`

**Problem**: Hook maps transaction date sebagai `created_at`, tapi page.tsx mengakses `t.createdAt`. `new Date(undefined)` = Invalid Date.

**Dampak**: 
- Today stats selalu `{ income: 0, expense: 0, count: 0 }`
- Filter "Hari Ini" selalu menampilkan 0 transaksi
- QuickStatsSummary widget broken

**Fix**: ~~Seragamkan field name ke `createdAt` di hook mapping.~~ DONE - Interface Transaction dan mapping di `useDashboardData.ts` diubah dari `created_at`/`is_verified` ke `createdAt`/`isVerified`.

---

### ~~3.2 Dashboard: Feature Lock Check Tidak Berfungsi~~ FIXED

**File**: `dashboard/page.tsx` lines 382-383

**Problem**:
```typescript
feature.label === "Analitik"    // compare against hardcoded Indonesian
```
Tapi `mainFeatures` mendefinisikan label sebagai i18n key: `"features.analytics"`. String tidak pernah match, lock icon tidak pernah muncul.

**Dampak**: User tier gratis bisa akses fitur premium tanpa pembatasan visual.

**Fix**: ~~Compare terhadap i18n key, bukan translated string.~~ DONE - Diubah ke `feature.label === "features.analytics"` dan `feature.label === "features.investments"`.

---

### ~~3.3 Dashboard: Markdown Syntax di JSX~~ FIXED

**File**: `dashboard/page.tsx` lines 328-329

**Problem**:
```jsx
Bos, pengeluaran di kategori **{anomalies[0].categoryName}** naik **{anomalies[0].spikePercentage}%**
```
`**text**` di JSX render sebagai literal asterisk, bukan bold.

**Fix**: ~~Gunakan `<strong>` tag.~~ DONE - Diganti dengan `<strong>` tag.

---

### ~~3.4 Dashboard: todayStats Dihitung dari Max 5 Transaksi~~ FIXED

**File**: `useDashboardData.ts` line 236, `dashboard/page.tsx` line 107

**Problem**: Hook return `.slice(0, 5)` transaksi. Page menghitung today income/expense dari 5 transaksi ini. Jika user punya 20 transaksi hari ini, stats salah.

**Fix**: ~~Hitung todayStats di server-side (API `/api/stats`), atau hook return semua transaksi tanpa slice.~~ DONE - Hook sekarang return `allTransactions` (tanpa slice) dan `transactions` (sliced untuk display). `todayStats` dihitung dari `allTransactions`.

---

### ~~3.5 Transactions: Infinite Scroll Broken~~ FIXED

**File**: `transactions/page.tsx` line 86

**Problem**: `const { ref: loadMoreRef, inView } = useInView()` -- `loadMoreRef` tidak pernah di-attach ke element DOM manapun. `inView` tidak pernah menjadi `true`. Effect di lines 169-173 adalah dead code.

**Dampak**: User hanya bisa melihat halaman pertama transaksi. Tidak ada "load more".

**Fix**: ~~Tambahkan `<div ref={loadMoreRef} />` di akhir transaction list.~~ DONE - Sentinel element `<div ref={loadMoreRef} />` ditambahkan setelah transaction list, plus loading spinner dan pesan "Semua transaksi sudah ditampilkan".

---

### ~~3.6 Transactions: Search Tanpa Debounce~~ FIXED

**File**: `transactions/page.tsx` line 624

**Problem**: `setSearchQuery` dipanggil langsung setiap keystroke. Jika search query dikirim ke API, setiap karakter = 1 API call.

**Fix**: ~~Wrap dengan debounce (300-500ms).~~ DONE - Dibuat hook `useDebouncedValue` (300ms) dan `debouncedSearchQuery` dikirim ke `useTransactionsData` bukan raw `searchQuery`.

---

### 3.7 Budgets: Rollover Toggle Tidak Persist

**File**: `budgets/page.tsx` line 138, lines 265-271

**Problem**: `rolloverEnabled` hanya React state (`useState<Record<number, boolean>>({})`). Toggle mengubah local state saja. Refresh halaman = semua rollover reset. Server tidak pernah tahu.

**Dampak**: User kira rollover aktif. Sebenarnya ephemeral.

**Fix**: Panggil API untuk update rollover setting saat toggle berubah.

---

### ~~3.8 Budgets: Wrong Error Toast Key~~ FIXED

**File**: `budgets/page.tsx` lines 238-239

**Problem**: Delete error menampilkan `t("budgets.errorAdd")` -- key untuk error "tambah", bukan "hapus".

**Fix**: ~~Gunakan key yang benar, mis. `t("budgets.errorDelete")`.~~ DONE - Diganti ke `t("budgets.errorDelete")` dengan fallback "Gagal menghapus anggaran".

---

### ~~3.9 Budgets: AnimatePresence Exit Broken~~ FIXED

**File**: `BudgetForms.tsx` (4 form modals)

**Problem**: Setiap form menggunakan `if (!isOpen) return null` sebelum `<AnimatePresence>`. Modal langsung unmount tanpa exit animation.

**Fix**: ~~Pindahkan pattern ke `<AnimatePresence>{isOpen && ...}</AnimatePresence>`~~ DONE - Semua 4 form (AddBudgetForm, AddGoalForm, EditBudgetForm, EditGoalForm) diperbaiki dengan pattern `{isOpen && (<>...</>)}` di dalam `<AnimatePresence>`.

---

### 3.10 Bills: Calendar Click Tidak Berfungsi

**File**: `bills/page.tsx` lines 560-584

**Problem**: Klik day di calendar tidak melakukan apa-apa. User expect tap day = lihat tagihan hari itu.

**Fix**: Filter bill list berdasarkan hari yang diklik, atau tampilkan tooltip.

---

### 3.11 Saldo: MoreVertical Button Broken

**File**: `saldo/page.tsx` lines 308-310, 414-416

**Problem**: 
```typescript
<button onClick={() => haptics.tap()}>
    <MoreVertical size={16} />
</button>
```
Hanya trigger haptic. Tidak ada menu, edit, atau delete.

**Dampak**: User klik expecting context menu, tidak terjadi apa-apa. Broken affordance.

**Fix**: Implementasi dropdown menu dengan opsi Edit dan Delete, atau hapus icon MoreVertical.

---

### ~~3.12 Saldo: Tidak Ada Stealth Mode~~ FIXED

**File**: `saldo/page.tsx`

**Problem**: Halaman ini tidak import `useSecurity` dan tidak mask value apapun. Saldo selalu terlihat bahkan saat user mengaktifkan stealth mode di halaman lain.

**Fix**: ~~Import `useSecurity`, replace amounts dengan `"••••••••"` saat stealth aktif.~~ DONE - Import `useSecurity` ditambahkan, 5 lokasi amount display di-mask dengan `isStealthMode ? "••••••••" : formatCurrency(...)`.

---

### ~~3.13 Chat: Hardcoded "Halo Alip!"~~ FIXED

**File**: `chat/page.tsx` line 131

**Problem**: Welcome message selalu mengatakan "Halo Alip!" terlepas siapa yang login.

**Fix**: ~~Gunakan `session?.user?.name || "Pengguna"`.~~ DONE - Diganti ke template literal dengan `session?.user?.name || "Pengguna"`.

---

### 3.14 Chat: Dua Tombol Mic Berbeda Fungsi

**File**: `chat/page.tsx` lines 555-561 (mic #1) dan lines 576-587 (mic #2)

**Problem**: Dua icon mic di area input yang sama:
- Mic #1 (di luar input): Buka SmartInput modal (voice → transaksi)
- Mic #2 (di dalam input): Toggle speech-to-text dictation

User melihat 2 mic icon berdekatan tanpa cara membedakan fungsi.

**Fix**: Bedakan visual (mis: mic #1 jadi icon Waveform), atau gabungkan ke satu button dengan mode selector.

---

### ~~3.15 Profile: Notification Save Palsu~~ FIXED

**File**: `profile/page.tsx` lines 82-87, 1421-1425

**Problem**: Toggle notifikasi hanya mengubah local state. Tombol "Simpan" hanya menampilkan toast "Preferensi notifikasi disimpan!" tanpa API call. Data tidak pernah persist ke server. Refresh = reset ke default.

**Fix**: ~~Panggil `PUT /api/user/settings` atau `PUT /api/profile/notifications` saat simpan.~~ DONE - Tombol simpan sekarang POST ke `/api/user/settings` dengan `notifToggles` data, dengan error handling.

---

### ~~3.16 Login & Register: `useFormStatus` Misused~~ FIXED

**File**: `login/page.tsx` line 49, `register/page.tsx` line 98

**Problem**: `useFormStatus` hanya bekerja dengan React Server Actions via `<form action={...}>`. Kedua form menggunakan `onSubmit={handleSubmit}` (client-side handler). `pending` dari `useFormStatus()` selalu `false`.

**Fix**: ~~Hapus `useFormStatus`, gunakan local `isPending` state saja (yang sudah ada).~~ DONE - Import dan penggunaan `useFormStatus` dihapus dari kedua file. `loading` langsung menggunakan prop `isPending`.

---

### ~~3.17 Register: Terms Link Bukan Clickable~~ FIXED

**File**: `register/page.tsx` lines 542-548

**Problem**: "Syarat & Ketentuan" dan "Kebijakan Privasi" adalah `<span>` tag, bukan `<a>` atau `<Link>`. Terlihat seperti link (biru, bold, hover underline) tapi tidak bisa diklik.

**Dampak**: Legal compliance issue -- user tidak bisa membaca terms sebelum agree.

**Fix**: ~~Ganti `<span>` dengan `<Link>` ke halaman terms/privacy yang sebenarnya.~~ DONE - `<span>` diganti dengan `<a href="/terms">` dan `<a href="/privacy">` dengan `target="_blank" rel="noopener noreferrer"`.

---

## 4. Fitur yang Hilang (Missing Features)

### Prioritas Tinggi

| # | Halaman | Missing Feature | Deskripsi |
|---|---|---|---|
| 1 | **Saldo** | Edit & delete akun | Setelah dibuat, akun tidak bisa diedit atau dihapus. MoreVertical button tidak berfungsi. |
| 2 | **Debts** | Edit hutang | User tidak bisa ubah nama debitur, jumlah, deskripsi, atau due date setelah dibuat. |
| 3 | **Recurring** | Edit transaksi berulang | User hanya bisa toggle on/off dan delete. Tidak bisa ubah jumlah, deskripsi, frekuensi, atau kategori. |
| 4 | **Bills** | Edit tagihan | Tidak ada cara edit nama, jumlah, due date, atau field lain setelah tagihan dibuat. |
| 5 | **Budgets** | Navigasi bulan | Hanya bisa lihat budget bulan ini. Tidak ada cara melihat budget bulan lalu atau merencanakan bulan depan. |
| 6 | **Transactions** | ~~Infinite scroll / pagination~~ FIXED | ~~`loadMoreRef` tidak ter-attach. User hanya lihat halaman pertama.~~ |

### Prioritas Sedang

| # | Halaman | Missing Feature | Deskripsi |
|---|---|---|---|
| 7 | **Savings** | Filter/sort goals | Tidak bisa filter aktif vs selesai, atau sort by percentage/deadline. |
| 8 | **Investments** | Sort & filter aset | Tidak bisa sort by value, profit, atau type. |
| 9 | **Investments** | Input notes, dividends, realized profit | State ada (`formNotes`, `formDividends`, `formRealizedProfit`), tapi tidak ada field UI-nya. |
| 10 | **Chat** | Quota indicator | User tidak tahu sisa pesan AI hari ini sampai hit limit dan dapat toast error. |
| 11 | **Simulations** | Error feedback | Jika simulasi gagal, hanya `console.error`. User tidak lihat apa-apa. |
| 12 | **Analytics** | Click outside date picker to close | Date picker tetap terbuka sampai klik "Terapkan" atau toggle icon. |

---

## 5. Masalah Bahasa (Inkonsistensi EN/ID)

Standar project (AGENTS.md): **Seluruh UI text dalam Bahasa Indonesia**.

### Landing Page -- Campuran Berat

| Lokasi | Text | Seharusnya |
|---|---|---|
| Hero heading | "Master Your Money with AI Logic" | "Kuasai Keuanganmu dengan AI Cerdas" |
| Trust labels | "FREELANCERS, FOUNDERS, SAVERS, INVESTORS" | "PEKERJA LEPAS, PENDIRI, PENABUNG, INVESTOR" |
| How it Works | "Smart Setup", "Master Your Money" | "Pengaturan Cerdas", "Kuasai Keuanganmu" |
| Motivational quote | English | Terjemahkan ke Indonesia |
| Copyright | "All rights reserved" | "Hak cipta dilindungi" |

### Login Page -- Hampir Seluruh English

| Lokasi | Text | Seharusnya |
|---|---|---|
| Heading | "Welcome Back" | "Selamat Datang Kembali" |
| Subtitle | "Sign in to continue to Monev" | "Masuk untuk melanjutkan ke Monev" |
| Labels | "Email Address", "Password" | "Alamat Email", "Kata Sandi" |
| Checkbox | "Remember me" | "Ingat saya" |
| Link | "Forgot password?" | "Lupa kata sandi?" |
| Button | "Login", "Logging in..." | "Masuk", "Sedang masuk..." |
| Footer | "Don't have an account? Register here" | "Belum punya akun? Daftar di sini" |
| Error | "Email is required" | "Email wajib diisi" |

### Register Page

| Lokasi | Text | Seharusnya |
|---|---|---|
| Placeholder | "John Doe" | "Budi Santoso" |

### Dashboard

| Lokasi | Text | Seharusnya |
|---|---|---|
| BalanceDetailModal | "Total Net Worth" | "Total Kekayaan Bersih" |
| BalanceDetailModal | "Liquid assets" | "Aset likuid" |
| BalanceDetailModal | "Future plans" | "Rencana masa depan" |
| BalanceDetailModal | "Growth assets" | "Aset bertumbuh" |

### Simulations

| Lokasi | Text | Seharusnya |
|---|---|---|
| Result card | "Risk: high" | "Risiko: tinggi" |
| Result card | "Financial Goals" | "Target Keuangan" |
| Result card | "AI Advisor Advice" | "Saran AI Advisor" |

### Bills

| Lokasi | Text | Seharusnya |
|---|---|---|
| Calendar legend | "Upcoming" | "Mendatang" |

### Transactions

| Lokasi | Text | Seharusnya |
|---|---|---|
| Filter button | "Clear all" | "Hapus semua filter" |

---

## 6. Code Quality Issues

### 6.1 Pattern: `@ts-ignore` untuk Session Tier (8+ halaman)

**Problem**:
```typescript
// @ts-ignore
const userTier = (session?.user?.tier as UserTier) || "miskin";
```

**Ditemukan di**: dashboard, budgets, savings, bills, analytics, investments, chat, profile

**Fix (sekali untuk semua)**: Buat file `src/types/next-auth.d.ts`:
```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            tier: "miskin" | "kaya" | "sultan";
        } & DefaultSession["user"];
    }
}
```

---

### 6.2 Pattern: Duplicate Import dari Module yang Sama (6+ halaman)

**Problem**:
```typescript
import { cn } from "@/frontend/lib/utils";
import { formatCurrency } from "@/frontend/lib/utils";
```

**Ditemukan di**: budgets, BudgetPieChart, BudgetForms, bills, debts, recurring

**Fix**: Gabung menjadi satu:
```typescript
import { cn, formatCurrency } from "@/frontend/lib/utils";
```

---

### 6.3 Pattern: `window.confirm()` di Mobile App (5+ halaman)

**Problem**: Native browser `confirm()` dialog terlihat jelek di mobile, blocking, dan tidak berfungsi baik di Capacitor (APK).

**Ditemukan di**: budgets (delete), savings (delete), bills (delete), debts (implicit), chat (clear history)

**Fix**: Ganti semua dengan `<ConfirmDialog>` component yang sudah ada di project.

---

### 6.4 Mega-File Anti-Pattern

| File | Baris | Komponen di Dalamnya | Rekomendasi Split |
|---|---|---|---|
| `profile/page.tsx` | 1,696 | 1 page + 8 inline modals | Extract setiap modal ke file terpisah di `profile/components/` |
| `debts/page.tsx` | 1,021 | DebtCard, AddDebtSheet, PartialPaymentSheet, DebtsPage | Extract 3 sub-components ke `debts/components/` |
| `transactions/page.tsx` | 988 | Page + undo logic + bulk actions + PDF export | Extract ke hooks: `useUndoDelete`, `useBulkActions`, `useTransactionExport` |
| `bills/page.tsx` | 816 | Page + inline add form + calendar grid | Extract `AddBillForm` dan `CalendarGrid` ke `bills/components/` |
| `BudgetForms.tsx` | 749 | AddBudgetForm, EditBudgetForm, AddGoalForm, EditGoalForm | Goal forms tidak related ke budgets. Split ke `GoalForms.tsx` |

---

### 6.5 Pattern: `useState<any>` dan `as any`

| File | Line | Problem |
|---|---|---|
| `profile/page.tsx` | 68-73 | `user`, `settings`, `goals`, `streak`, `achievements`, `categories` semua `any` |
| `simulations/page.tsx` | 107 | `useState<any>(null)` untuk simulation result |
| `analytics/page.tsx` | 101, 182, 297 | `cat: any`, `(data as any)`, `acc: any, g: any` |
| `chat/page.tsx` | 232 | `catch (error: any)` |
| `investments/page.tsx` | 523 | `setFormType(e.target.value as any)` |
| `dashboard/page.tsx` | 48 | `icon: any` di TIER_STYLES |

**Fix**: Definisikan proper interfaces/types untuk semua data.

---

### 6.6 Pattern: Form State dengan 7-14 Individual `useState`

| File | Jumlah useState untuk form |
|---|---|
| `investments/page.tsx` | 12 individual useState |
| `bills/page.tsx` | 7 individual useState |

**Fix**: Gunakan `useReducer` atau single `useState` dengan object:
```typescript
const [form, setForm] = useState({ name: "", amount: "", type: "stock", ... });
```

---

## 7. UX Problems Per Halaman

### Dashboard

| # | Problem | Severity |
|---|---|---|
| 1 | Notification bell button tidak berfungsi (no onClick, tapi ada red dot indicator) | High |
| 2 | Information overload di atas fold (~18 interactive elements) | Medium |
| 3 | HeroBalanceCard menampilkan net worth tapi label-nya "Saldo" (menyesatkan) | Medium |
| 4 | Cascading animations delay 0.5-0.7 detik (terasa lambat saat repeat visit) | Low |
| 5 | Double refresh saat AddTransactionSheet success (event + direct call) | Low |

### Transactions

| # | Problem | Severity |
|---|---|---|
| 1 | Header toolbar: 5 unlabeled icon buttons berjejer (Sort, Bulk, Export, Import, Filter) | High |
| 2 | Undo delete sebenarnya re-create (ID baru, timestamp baru, link hilang) | Medium |
| 3 | Duplicate detection terlalu agresif (2 kopi di hari sama = duplikat) | Medium |
| 4 | PDF export pakai `window.open` + `window.print()` (popup blocker, bukan real PDF) | Medium |
| 5 | Bulk delete fire N parallel API calls (50 selected = 50 requests) | Medium |
| 6 | Animation key includes filter state -- setiap karakter search = remount list | Low |

### Budgets

| # | Problem | Severity |
|---|---|---|
| 1 | Tidak ada navigasi bulan (hanya bulan ini) | High |
| 2 | `incomeEstimate` di projected warning computed tapi tidak digunakan | Medium |
| 3 | Template income input tanpa formatting/validation, fallback diam-diam ke 5 juta | Medium |
| 4 | `EditBudgetForm` tidak sync dengan prop changes (stale data jika budget berubah) | Medium |
| 5 | Spending velocity mixing hardcoded Indonesian dan format string | Low |

### Savings

| # | Problem | Severity |
|---|---|---|
| 1 | Dead ternary: progress bar color selalu `bg-emerald-400` terlepas persentase | Medium |
| 2 | Confetti otomatis untuk semua goal 100% (3 completed = 3 confetti sekaligus) | Low |
| 3 | `confirm()` untuk delete | Medium |
| 4 | Milestone text 8px -- borderline unreadable di mobile | Low |

### Bills

| # | Problem | Severity |
|---|---|---|
| 1 | Calendar view click day = nothing | High |
| 2 | Icon picker tampilkan text labels, bukan icon sebenarnya | Medium |
| 3 | Add form tanpa validation (amount bisa 0 atau negatif) | Medium |
| 4 | Tidak bisa edit bill yang sudah dibuat | High |
| 5 | Header layout: toggle sebelum back button (unconventional) | Low |

### Saldo

| # | Problem | Severity |
|---|---|---|
| 1 | MoreVertical button = broken affordance (tidak ada menu) | High |
| 2 | Tidak ada back button ke dashboard (inkonsisten dengan halaman lain) | Medium |
| 3 | `-pt-4` class invalid (negative padding bukan valid Tailwind) | Low |
| 4 | Net worth card tidak ada loading skeleton | Low |
| 5 | 3-step add modal tanpa step indicator | Medium |
| 6 | Grouped view default semua collapsed (harus tap tiap grup) | Low |

### Analytics

| # | Problem | Severity |
|---|---|---|
| 1 | Header overload (7 interactive elements: back, title, download, streak, month nav, date toggle) | Medium |
| 2 | Date picker tidak tutup saat klik di luar | Medium |
| 3 | Locked tab hanya tampil toast error (bukan preview + upgrade CTA) | Medium |
| 4 | `z-30` bukan standard Tailwind utility | Low |
| 5 | Download button tidak tunjukkan lock icon sebelum diklik | Low |

### Investments

| # | Problem | Severity |
|---|---|---|
| 1 | Form submit silently return jika field kosong (no visual feedback) | Medium |
| 2 | Notes, dividends, realized profit: state ada tapi UI input tidak ada | Medium |
| 3 | Stealth mode bocor -- persentase ROI selalu terlihat | Medium |
| 4 | Modal close on backdrop tanpa unsaved-changes warning | Low |

### Debts

| # | Problem | Severity |
|---|---|---|
| 1 | Partial payment tracking via `[ORIG:123456]` di description string (fragile hack) | High |
| 2 | `formatCurrency().replace("Rp", "")` brittle string manipulation | Medium |
| 3 | Tidak bisa edit hutang | High |
| 4 | Stealth mode tidak di-support | Medium |
| 5 | Tab "Lunas" tidak tampilkan count (tapi "Aktif" tampilkan) | Low |

### Recurring

| # | Problem | Severity |
|---|---|---|
| 1 | Summary hanya hitung monthly items (daily/weekly diabaikan) | High |
| 2 | Tidak bisa edit transaksi berulang | High |
| 3 | Toggle aktif/nonaktif tanpa konfirmasi | Medium |
| 4 | `.replace("Rp", "Rp ")` fragile string manipulation | Low |
| 5 | 5 unused imports | Low |

### Chat

| # | Problem | Severity |
|---|---|---|
| 1 | Dua tombol mic berbeda fungsi (bingung) | High |
| 2 | Back button ke `/` bukan `/dashboard` (inkonsisten) | Medium |
| 3 | Image upload tanpa size/type validation (bisa 50MB) | Medium |
| 4 | `scrollToBottom` paksa setiap message baru (even saat user scroll up baca riwayat) | Medium |
| 5 | Base64 image di localStorage (bisa exceed 5MB limit) | Medium |
| 6 | `onKeyPress` deprecated (harusnya `onKeyDown`) | Low |

### Simulations

| # | Problem | Severity |
|---|---|---|
| 1 | Tidak ada error feedback ke user saat simulasi gagal | High |
| 2 | Template "Naik gaji 20%" set amount = 0, tapi submit disabled saat amount kosong | Medium |
| 3 | Tidak ada konfirmasi sebelum clear all history | Medium |
| 4 | Amount input terima desimal dan negatif (tidak sesuai IDR) | Low |
| 5 | Result card dan expanded history card = duplicate render logic | Low |

### Profile

| # | Problem | Severity |
|---|---|---|
| 1 | 1,696 baris dalam 1 file -- tidak maintainable | High |
| 2 | Notification save palsu (toast tapi tidak persist) | High |
| 3 | Modal title salah untuk categories, collection, notifications (fallback ke "Konfigurasi Keuangan") | Medium |
| 4 | Security modal terlalu panjang (PIN + Biometric + Lock + Sessions + Delete Account) | Medium |
| 5 | `handleDeleteCategory` pakai `window.confirm()` | Medium |
| 6 | Image `URL.createObjectURL` tidak pernah di-revoke (memory leak) | Low |
| 7 | Hardcoded version "v1.0.0" | Low |

### Login

| # | Problem | Severity |
|---|---|---|
| 1 | "Remember me" checkbox non-functional (state tidak pernah dibaca) | Medium |
| 2 | Guest login error silently redirect ke dashboard | Medium |
| 3 | Double navigation on success (`push` + `refresh`) | Low |

### Register

| # | Problem | Severity |
|---|---|---|
| 1 | Terms & Privacy link bukan clickable (`<span>` bukan `<a>`) | High |
| 2 | Success screen tanpa transition animation (jarring) | Low |
| 3 | `isDisposableEmail` bundled ke client (inflate bundle size) | Medium |

### Onboarding

| # | Problem | Severity |
|---|---|---|
| 1 | Screen 0 tidak tampilkan progress (user tidak tahu berapa langkah) | Medium |
| 2 | Tidak bisa skip setelah screen 0 | Medium |
| 3 | `?reset=true` URL parameter bisa force re-show onboarding | Low |

---

## 8. Performance Concerns

| # | Halaman | Issue | Impact |
|---|---|---|---|
| 1 | **Dashboard** | 6 parallel API calls on mount (stats, transactions, anomalies, bills, profile, categories) | High on slow connections |
| 2 | **Dashboard** | `whileHover={{ scale }}` on mobile (irrelevant, waste computation) | Low |
| 3 | **Transactions** | Animation key includes filter -- setiap keystroke remount seluruh list | Medium |
| 4 | **Transactions** | Bulk delete = N parallel HTTP requests | Medium |
| 5 | **Budgets** | `new Date()` dipanggil 3-6x per render + 3x per budget card | Low |
| 6 | **Budgets** | `totalBudget`/`totalSpent` recalculated setiap render tanpa `useMemo` | Low |
| 7 | **Chat** | AnimatePresence wrapping 50+ messages (expensive tracking) | Medium |
| 8 | **Chat** | Base64 image di state + localStorage setiap message change | High |
| 9 | **Analytics** | `key={activeTab}` remount entire tab content on switch | Medium |
| 10 | **Landing** | `"use client"` pada halaman yang bisa jadi Server Component (SEO loss) | Medium |
| 11 | **Savings** | `whileHover` on mobile goal cards (irrelevant) | Low |
| 12 | **Budgets** | Staggered animation delay 0.1s per card * N cards | Low |

---

## 9. Dead Code & Unused Imports

### Unused Imports Per File

| File | Unused Imports |
|---|---|
| `dashboard/page.tsx` | `useHeroTheme` |
| `dashboard/DailyInsight.tsx` | `AnimatePresence` |
| `transactions/page.tsx` | `OfflineManager`, `useHaptics`, `id` (date-fns duplicate), `ChevronDown`, `Trash2`, `ArrowUpDown` |
| `budgets/page.tsx` | `useMemo`, `X`, `TierLimitBanner` |
| `budgets/BudgetForms.tsx` | `Wallet`, `TrendingUp`, `PiggyBank`, `Target`, `Calendar`, `DollarSign` |
| `bills/page.tsx` | `TierLimitBanner`, `canCreateBill` |
| `investments/page.tsx` | `useMemo`, `Edit3` |
| `debts/page.tsx` | `Edit3`, `ChevronRight` |
| `recurring/page.tsx` | `FileText`, `DollarSign`, `Tag`, `Clock`, `Sparkles` |
| `chat/page.tsx` | `Loader2`, `ErrorEmpty`, `TierLimitBanner` |
| `simulations/page.tsx` | `Send`, `AlertTriangle` |
| `profile/page.tsx` | `ChevronRight`, `Copy`, `AlertCircle`, `Info`, `FileJson`, `FileSpreadsheet`, `Upload` |

**Total: 30+ unused imports** yang memperbesar bundle size.

### Dead Variables

| File | Variable | Alasan |
|---|---|---|
| `bills/page.tsx` | `tierConfig` (line 45) | Computed tapi tidak pernah digunakan |
| `bills/page.tsx` | `dateStr` (line 552) | Computed di calendar loop tapi tidak digunakan |
| `transactions/page.tsx` | `mounted` (line 92) | Destructured tapi tidak pernah dipakai |
| `savings/page.tsx` | `Category` interface (lines 24-29) | Defined tapi tidak pernah dipakai |
| `budgets/page.tsx` | `BUDGET_TEMPLATES.description` | Field didefinisikan tapi tidak pernah dirender |

### Dead Components/Files

| File | Baris | Alasan |
|---|---|---|
| `onboarding/components/CTAScreen.tsx` | 216 | Tidak pernah diimport |
| `onboarding/components/OnboardingCard.tsx` | 26 | Tidak pernah diimport |
| `analytics/components/AnalyticsTabs.tsx` | ~100 | Page buat tab bar sendiri secara inline |
| `analytics/components/MonthComparison.tsx` | ~100 | Tidak pernah diimport |
| `analytics/components/SpendingHeatmap.tsx` | ~100 | Tidak pernah diimport |
| `analytics/components/CalendarHeatmap.tsx` | ~100 | Tidak pernah diimport |

---

## 10. Top 10 Prioritas Perbaikan

| # | Task | Impact | Effort | Halaman |
|---|---|---|---|---|
| 1 | ~~**Fix `createdAt` vs `created_at` field mismatch**~~ FIXED | Critical -- dashboard today stats & filter broken | Rendah | Dashboard |
| 2 | ~~**Fix infinite scroll (attach loadMoreRef ke DOM)**~~ FIXED | User tidak bisa load transaksi lebih | Rendah | Transactions |
| 3 | **Tambah edit functionality ke saldo, debts, recurring, bills** | 4 halaman tanpa edit = user frustration | Tinggi | 4 halaman |
| 4 | **Konsistenkan bahasa ke Indonesia (login, landing, dashboard, simulations)** | Branding consistency, user trust | Rendah | 6 halaman |
| 5 | **Hapus redundant sections (streak 3x, spending alert 4x, chart duplikat 2 halaman)** | Cleaner UI, less information overload | Sedang | Dashboard, Budgets, Investments |
| 6 | **Split mega-files (profile 1696, debts 1021, transactions 988)** | Maintainability, developer experience | Sedang | 4 file |
| 7 | **Ganti semua `window.confirm()` dengan ConfirmDialog** | UX consistency, mobile-friendly | Rendah | 5 halaman |
| 8 | **Fix MoreVertical di saldo + tambah menu edit/delete** | Broken affordance yang user pasti encounter | Sedang | Saldo |
| 9 | ~~**Fix notification save di profile (persist ke server)**~~ FIXED | Feature yang terlihat berfungsi tapi sebenarnya palsu | Rendah | Profile |
| 10 | **Augment next-auth Session type + hapus semua @ts-ignore** | Type safety, hapus 8+ suppressions, prevent future bugs | Rendah | Global |

### Estimasi Total Effort

| Kategori | Jumlah Tasks | Estimasi |
|---|---|---|
| Quick wins (rendah effort) | 6 tasks (#1, #2, #4, #7, #9, #10) | 1-2 hari |
| Medium effort | 3 tasks (#5, #6, #8) | 2-3 hari |
| High effort | 1 task (#3 -- edit di 4 halaman) | 3-5 hari |
| **Total** | **10 tasks** | **~7-10 hari kerja** |

---

## Catatan Akhir

Audit ini dilakukan secara menyeluruh terhadap 17 halaman dan 12,000+ baris kode. Temuan diurutkan berdasarkan severity dan impact terhadap user experience. Sebagian besar quick wins (fix bugs, konsistenkan bahasa, hapus dead code) bisa diselesaikan dalam 1-2 hari tanpa mengubah arsitektur. Fitur edit untuk 4 halaman (saldo, debts, recurring, bills) adalah pekerjaan terbesar yang membutuhkan API route baru dan UI modal.

**Prioritas utama**: Fix critical bugs (#1, #2) terlebih dahulu karena berdampak langsung pada fungsi dasar aplikasi yang rusak saat ini.
