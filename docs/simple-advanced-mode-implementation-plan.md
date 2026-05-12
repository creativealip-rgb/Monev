# Implementation Plan: Mode Sederhana & Mode Lengkap

## Ringkasan

Monev perlu punya dua mode tampilan supaya user baru tidak overwhelmed, tapi fitur advanced yang sudah ada tetap bisa dipakai oleh power user.

- **Mode Sederhana**: fokus untuk catat uang harian, lihat sisa uang, cek budget dasar, dan transaksi terakhir.
- **Mode Lengkap**: tampilan sekarang/advanced untuk user yang butuh fitur penuh seperti saldo, savings, bills, debts, investments, analytics, reports, recurring, simulations, dan AI chat.

Prinsip utama: mode ini adalah preferensi tampilan, bukan pemisahan data. Semua data tetap sama, yang berubah hanya navigasi, dashboard, dan kompleksitas UI.

## Tujuan Produk

1. Mengurangi rasa ribet untuk user baru.
2. Membuat Monev lebih cocok untuk daily use.
3. Mempertahankan fitur advanced tanpa mengganggu user basic.
4. Membuat onboarding lebih cepat menghasilkan value.
5. Membuka jalur upsell natural dari simple ke advanced/pro.

## Positioning

Copy utama:

> Mulai sederhana. Naik ke lengkap kalau kamu butuh.

Alternatif copy:

> Catat uang harian tanpa ribet. Fitur lengkap tetap tersedia kapan pun.

## Definisi Mode

### Mode Sederhana

Untuk user yang hanya ingin:

- Catat pemasukan dan pengeluaran.
- Lihat sisa uang bulan ini.
- Pantau budget utama.
- Cek transaksi terakhir.
- Hubungkan Telegram.

Menu utama yang disarankan:

1. Beranda
2. Transaksi
3. Profil

Budget tetap muncul sebagai section di Beranda dengan copy yang lebih ringan seperti "Batas Bulanan". Menu Budget bisa ditambahkan lagi setelah simple mode terbukti tidak terasa ramai.

### Mode Lengkap

Untuk user yang ingin akses semua fitur:

- Dashboard
- Saldo/accounts
- Transactions
- Budgets
- Savings/goals
- Bills
- Debts
- Investments
- Analytics
- Reports
- Recurring
- Simulations
- Chat AI
- Fitur/upgrade
- Profile

Mode ini mempertahankan pengalaman advanced yang sudah ada, tapi idealnya tetap dikelompokkan agar lebih rapi.

## UX Behavior

### Default Mode

- User baru: diarahkan ke **Mode Sederhana** saat onboarding/initial setup.
- User lama: tetap di **Mode Lengkap** agar tidak kaget dengan perubahan navigasi.
- Secara teknis, field baru sebaiknya default ke `advanced`, lalu onboarding user baru menyimpan `simple`. Ini mencegah existing user otomatis berubah ke simple setelah migration.
- User bisa switch mode kapan saja dari Profile.

### Switching Mode

Lokasi toggle:

- Profile -> Preferensi Tampilan
- Onboarding step terakhir
- Optional banner di dashboard: "Monev terasa terlalu ramai? Coba Mode Sederhana."

Copy toggle:

```text
Pilih tampilan Monev

Sederhana
Fokus catat uang, cek sisa saldo, dan budget bulanan.

Lengkap
Akses semua fitur seperti investasi, utang, simulasi, laporan, dan AI advanced.
```

### Saat User Mengakses Fitur Advanced dari Mode Sederhana

Jika user membuka URL fitur advanced secara langsung, jangan block total. Tampilkan prompt:

```text
Fitur ini bagian dari Mode Lengkap.
Aktifkan Mode Lengkap untuk melihat fitur ini?
```

Tombol:

- Aktifkan Mode Lengkap
- Lihat halaman ini saja
- Tetap di Mode Sederhana

## Dashboard Mode Sederhana

Dashboard sederhana harus menjawab tiga pertanyaan:

1. Sisa uang bulan ini berapa?
2. Borosnya di mana?
3. Aman nggak sampai gajian?

### Struktur Beranda Sederhana

1. **Hero Card**
   - Sisa bulan ini
   - Estimasi aman sampai tanggal berapa
   - Status: Aman / Waspada / Bahaya

2. **Quick Add MVP**
   - Tombol besar: `+ Pengeluaran` dan `+ Pemasukan`.
   - Natural language seperti `makan ayam 25rb` masuk enhancement setelah dashboard simple stabil.
   - Jika natural language dibuat, tampilkan preview sebelum simpan saat confidence parser rendah.

3. **Ringkasan Bulan Ini**
   - Pemasukan
   - Pengeluaran
   - Sisa

4. **Batas Bulanan / Budget Utama**
   - Muncul hanya jika user sudah punya budget atau data cukup.
   - Gunakan copy ringan: "Batas Bulanan" alih-alih istilah teknis.
   - Contoh kategori: Makan, Transport, Kos/sewa, Hiburan.

5. **Transaksi Terakhir**
   - 5 transaksi terbaru
   - Link ke halaman Transaksi

6. **Insight Singkat**
   - Maksimal 1-2 insight agar tidak ramai
   - Contoh: "Budget makan sudah 82%. Coba tahan jajan kopi minggu ini."

## Navigasi

### Simple Menu Config

```ts
export const simpleMenu = [
    {
        key: "dashboard",
        label: "Beranda",
        href: "/dashboard",
        icon: "Home",
    },
    {
        key: "transactions",
        label: "Transaksi",
        href: "/transactions",
        icon: "ReceiptText",
    },
    {
        key: "profile",
        label: "Profil",
        href: "/profile",
        icon: "User",
    },
];
```

### Advanced Menu Config

```ts
export const advancedMenu = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { key: "saldo", label: "Saldo", href: "/saldo", icon: "Wallet" },
    { key: "transactions", label: "Transaksi", href: "/transactions", icon: "ReceiptText" },
    { key: "budgets", label: "Budget", href: "/budgets", icon: "PieChart" },
    { key: "savings", label: "Tabungan", href: "/savings", icon: "PiggyBank" },
    { key: "bills", label: "Tagihan", href: "/bills", icon: "CalendarClock" },
    { key: "debts", label: "Utang", href: "/debts", icon: "Handshake" },
    { key: "investments", label: "Investasi", href: "/investments", icon: "TrendingUp" },
    { key: "analytics", label: "Analitik", href: "/analytics", icon: "BarChart3" },
    { key: "reports", label: "Laporan", href: "/reports", icon: "FileText" },
    { key: "recurring", label: "Berulang", href: "/recurring", icon: "Repeat" },
    { key: "simulations", label: "Simulasi", href: "/simulations", icon: "Calculator" },
    { key: "chat", label: "AI Chat", href: "/chat", icon: "Bot" },
    { key: "profile", label: "Profil", href: "/profile", icon: "User" },
];
```

## Data Model

Tambahkan field ke `user_settings`. Rekomendasi teknis: default database `advanced`, lalu user baru diset ke `simple` saat onboarding selesai.

```ts
viewMode: text("view_mode", { enum: ["simple", "advanced"] }).notNull().default("advanced")
```

Jangan mulai dari `localStorage` untuk MVP production. Simpan langsung di database supaya:

- Konsisten antar device.
- Bisa dipakai onboarding.
- Bisa dianalisis untuk product metrics.

## API Plan

### GET Profile/Settings

Pastikan response settings mengembalikan:

```json
{
    "viewMode": "simple"
}
```

### Update View Mode

Endpoint bisa reuse profile/settings update yang ada, atau buat endpoint khusus:

```http
PATCH /api/profile/view-mode
```

Request:

```json
{
    "viewMode": "simple"
}
```

Response:

```json
{
    "success": true,
    "data": {
        "viewMode": "simple"
    }
}
```

Validasi:

- Hanya menerima `simple` atau `advanced`.
- User harus login.
- Simpan ke `user_settings`.

## Frontend Implementation

### 1. Buat View Mode Context/Hook

Buat hook:

```ts
export function useViewMode() {
    return {
        viewMode,
        isSimpleMode: viewMode === "simple",
        isAdvancedMode: viewMode === "advanced",
        setViewMode,
    };
}
```

Data berasal dari:

1. User settings dari API.
2. Default runtime `advanced` jika field belum ada, lalu onboarding user baru menyimpan `simple`.

`localStorage` hanya boleh dipakai sebagai cache sementara, bukan source of truth.

### 2. Filter Navigasi

Update komponen:

- `BottomNav`
- Sidebar/menu desktop jika ada
- Shortcut menu dashboard

Logic:

```ts
const menuItems = viewMode === "simple" ? simpleMenu : advancedMenu;
```

### 3. Toggle di Profile

Tambahkan card di Profile:

```text
Tampilan Aplikasi

Sederhana
Fokus catat dan pantau uang harian.

Lengkap
Semua fitur analisis dan perencanaan.
```

Ketika user memilih mode:

- Update optimistic UI.
- Save ke API.
- Tampilkan toast sukses.

### 4. Dashboard Variant

Opsi implementasi:

- `DashboardSimple`
- `DashboardAdvanced`

Di page dashboard:

```tsx
return viewMode === "simple" ? <DashboardSimple /> : <DashboardAdvanced />;
```

Untuk MVP, `DashboardSimple` bisa reuse data fetching yang sudah ada, tapi tampilannya dibuat lebih fokus.

### 5. Advanced Feature Prompt

Buat wrapper untuk page advanced:

```tsx
<AdvancedModeGate featureName="Investasi">
    <InvestmentsPage />
</AdvancedModeGate>
```

Jika `viewMode === "simple"`, tampilkan prompt aktivasi mode lengkap.

Jangan gunakan gate ini untuk fitur inti seperti transactions, budgets, dan profile.

## Page Classification

### Tetap Muncul di Mode Sederhana

- `/dashboard`
- `/transactions`
- `/profile`
- `/fitur/upgrade`

### Disembunyikan dari Menu Sederhana

- `/saldo`
- `/savings`
- `/bills`
- `/debts`
- `/investments`
- `/analytics`
- `/reports`
- `/recurring`
- `/simulations`
- `/chat`
- `/transactions/import`
- `/fitur/notification-guide`

Catatan: disembunyikan dari menu, bukan dihapus.

## Onboarding Update

Tambahkan step terakhir:

```text
Mau mulai dari tampilan mana?

Sederhana
Cocok kalau kamu cuma mau catat uang dan lihat sisa budget.

Lengkap
Cocok kalau kamu mau pantau utang, investasi, tagihan, laporan, dan simulasi.
```

Default selected: `Sederhana`.

Jika user memilih profil advanced seperti freelancer/power user, tetap boleh rekomendasikan `Lengkap`, tapi jangan paksa.

## Analytics Event

Track event berikut:

- `view_mode_selected`
- `view_mode_changed`
- `simple_dashboard_viewed`
- `advanced_feature_prompt_viewed`
- `advanced_feature_prompt_accepted`
- `advanced_feature_prompt_dismissed`

Tujuannya untuk tahu:

- Berapa banyak user bertahan di simple.
- Fitur advanced apa yang paling sering dicari dari simple mode.
- Apakah simple mode meningkatkan retention.

## MVP Scope

### Phase 1: View Mode Foundation

Deliverables:

- Tambah field `viewMode` di settings dengan default DB `advanced`.
- Tambah API update view mode.
- Tambah toggle di Profile.
- Centralized menu config.
- Filter `BottomNav` berdasarkan mode.
- Onboarding/initial setup user baru menyimpan `simple`.

Estimasi: 1-2 hari.

### Phase 2: Simple Dashboard

Deliverables:

- Buat `DashboardSimple`.
- Hero card: sisa bulan ini + status aman/waspada/bahaya.
- Quick add MVP berupa tombol `+ Pengeluaran` dan `+ Pemasukan`.
- Ringkasan pemasukan/pengeluaran/sisa.
- Batas Bulanan/Budget utama hanya jika data cukup.
- 5 transaksi terakhir.

Estimasi: 2-4 hari.

### Phase 3: Advanced Gate & Onboarding

Deliverables:

- Buat `AdvancedModeGate`.
- Tambah prompt switch mode di fitur advanced dengan opsi `Lihat halaman ini saja`.
- Tambah pilihan mode di onboarding jika belum cukup ditentukan otomatis.
- Track analytics event dasar.

Estimasi: 2-3 hari.

### Phase 4: Polish

Deliverables:

- Empty state sederhana.
- Copywriting final.
- Mobile spacing polish.
- QA semua route.
- Pastikan user lama tetap advanced.

Estimasi: 1-2 hari.

## QA Checklist

- User baru selesai onboarding masuk Mode Sederhana.
- User lama tetap Mode Lengkap setelah migration/deploy.
- Toggle mode di Profile tersimpan setelah reload.
- Bottom nav berubah sesuai mode.
- Dashboard simple tidak menampilkan terlalu banyak card dan punya empty state saat data belum cukup.
- Route advanced tetap bisa dibuka via URL.
- Prompt advanced mode muncul dengan benar.
- Switching ke advanced langsung membuka menu lengkap.
- Switching balik ke simple tidak menghapus data.
- Mobile layout nyaman di layar kecil.
- Tidak ada regression pada transaksi, budget, dan profile.

## Risiko dan Mitigasi

### Risiko: User bingung karena fitur hilang

Mitigasi:

- Pakai copy "disederhanakan", bukan "dibatasi".
- Tambahkan entry di Profile: "Tampilkan semua fitur".
- Prompt saat akses fitur advanced via URL.

### Risiko: Navigasi jadi inkonsisten

Mitigasi:

- Centralize menu config.
- Jangan hardcode menu di banyak komponen.

### Risiko: Dashboard simple tetap terlalu ramai

Mitigasi:

- Maksimal 5 section utama.
- Insight maksimal 1-2.
- Advanced charts hanya di Mode Lengkap.

### Risiko: User lama komplain berubah

Mitigasi:

- Default user existing ke advanced.
- Jika perlu tampilkan banner: "Mode Sederhana sudah tersedia" tanpa memaksa.

## Success Metrics

- Activation rate user baru naik.
- Time-to-first-transaction turun.
- Retention D1/D7 naik.
- Jumlah user yang switch dari simple ke advanced bisa terukur.
- Penggunaan fitur transaksi harian naik.
- Komplain "aplikasinya ribet" turun.

## Prioritas Implementasi

Urutan paling direkomendasikan:

1. View mode setting + toggle Profile.
2. Centralized menu config.
3. Filter BottomNav/menu dengan simple menu 3 item: Beranda, Transaksi, Profil.
4. Onboarding menyimpan `simple` untuk user baru.
5. Dashboard simple MVP tanpa natural language parser dulu.
6. Advanced mode prompt dengan opsi "Lihat halaman ini saja".
7. Analytics event.

## Verdict

Fitur Mode Sederhana dan Mode Lengkap wajib dibuat. Ini menyelesaikan masalah utama Monev: fitur sudah kuat, tapi user basic bisa merasa terlalu ramai.

Dengan mode ini, Monev bisa melayani dua segmen sekaligus:

- User awam: catat uang cepat dan lihat sisa budget.
- User advanced: analisis lengkap, planning, investment, reports, dan AI.

Produk jadi terasa lebih ringan di awal, tapi tetap powerful saat user sudah siap.
