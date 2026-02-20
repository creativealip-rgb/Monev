# 📋 Monev — Feature Documentation

Dokumentasi lengkap semua fitur aplikasi Monev.

---

## 1. 🏠 Dashboard

Halaman utama dengan ringkasan keuangan.

| Elemen | Deskripsi |
|--------|-----------|
| Greeting | Sapaan dinamis berdasar waktu (Selamat pagi/siang/sore/malam) |
| Saldo | Total saldo terkini, bisa disembunyikan (hide balance) |
| Pemasukan/Pengeluaran | Ringkasan bulan ini |
| Daily Insight | Rata-rata pengeluaran harian |
| Transaksi Terbaru | 5 transaksi terakhir |
| Quick Stats | Statistik cepat (total tabungan, tagihan aktif, dll) |

---

## 2. 💬 AI Chat (Asisten Keuangan)

Chat interaktif dengan AI yang memahami data keuanganmu.

**Kemampuan AI:**
- Menjawab pertanyaan tentang saldo, pemasukan, dan pengeluaran
- Menganalisis pola pengeluaranmu
- Memberikan saran keuangan yang dipersonalisasi
- Memahami konteks: transaksi, budget, tagihan, tabungan, dan investasi

**Teknologi:** OpenAI GPT dengan system prompt yang di-inject data keuangan real-time user.

---

## 3. 📊 Analytics (Statistik)

Visualisasi data keuangan dengan beberapa tab:

### Tab Ringkasan
- Pie chart distribusi pengeluaran per kategori
- Top 5 spending categories
- Income vs expense ratio

### Tab Tren
- Line chart pengeluaran 6 bulan terakhir
- **Month-over-Month Comparison** — perbandingan pengeluaran bulan ini vs bulan lalu
- **Spending Heatmap** — pola pengeluaran per hari dalam minggu & jam

### Tab Harian
- Calendar heatmap aktivitas transaksi
- Detail pengeluaran per hari

---

## 4. 📝 Transactions (Riwayat Transaksi)

Daftar lengkap semua transaksi.

| Fitur | Deskripsi |
|-------|-----------|
| Filter | Filter by kategori, tipe (income/expense), rentang tanggal |
| Search | Cari transaksi by deskripsi atau merchant |
| Edit/Delete | CRUD lengkap per transaksi |
| Transfer | Transfer antar akun / wallet |
| CSV Export | Download semua transaksi sebagai CSV |
| Infinite Scroll | Load more otomatis saat scroll |

### Input Transaksi
- **Manual** — Form input standar (jumlah, kategori, deskripsi, tanggal)
- **Smart Input** — Input natural language (contoh: "makan 50rb" → otomatis parse)
- **OCR** — Scan struk/receipt untuk auto-extract data transaksi
- **Voice** — Input via suara (speech-to-text)
- **AI Categorize** — Kategorisasi otomatis berdasar deskripsi transaksi

---

## 5. 🎯 Budgets (Anggaran)

Kelola anggaran bulanan per kategori.

| Fitur | Deskripsi |
|-------|-----------|
| Create Budget | Set budget per kategori + jumlah + periode |
| Progress Bar | Visual progress spending vs budget |
| Alert | Peringatan saat mendekati/melebihi budget |
| Edit/Delete | CRUD lengkap |
| Icon + Color | Kustomisasi visual per budget |

---

## 6. 📅 Bills (Tagihan Berulang)

Tracking tagihan bulanan/mingguan/tahunan.

| Fitur | Deskripsi |
|-------|-----------|
| Bill List | Daftar tagihan aktif dengan status bayar |
| Due Date | Tanggal jatuh tempo |
| Frequency | Monthly, weekly, atau yearly |
| Mark as Paid | Tandai sudah dibayar |
| Subscription Detection | Deteksi langganan otomatis dari transaksi recurring |
| Reminder Widget | Widget pengingat tagihan yang akan jatuh tempo |

---

## 7. 💰 Savings (Tabungan/Goals)

Target tabungan dan tracking progress.

| Fitur | Deskripsi |
|-------|-----------|
| Create Goal | Set nama, target, deadline, icon, warna |
| Progress Tracking | Visual bar persentase tabungan |
| Add Savings | Tambah tabungan ke goal tertentu |
| Primary Goal | Set primary goal di dashboard |

---

## 8. 📈 Investments (Investasi)

Portfolio tracking untuk berbagai jenis investasi.

| Fitur | Deskripsi |
|-------|-----------|
| Asset Types | Stock, crypto, mutual fund, gold, bond, other |
| Portfolio Summary | Total value, total gain/loss |
| Allocation Chart | Donut chart alokasi aset |
| CRUD | Tambah/edit/hapus aset investasi |
| Platform | Track platform investasi (Bibit, Ajaib, dll) |

---

## 9. 👤 Profile & Settings

Pengaturan akun dan preferensi.

| Fitur | Deskripsi |
|-------|-----------|
| Edit Profil | Nama, email |
| Currency Setting | Pilih mata uang (IDR, USD, EUR, SGD, MYR) |
| Language Setting | Bahasa Indonesia / English |
| Theme | Light/dark mode + theme selector |
| Security PIN | Set/ubah PIN keamanan |
| App Lock | Aktifkan kunci aplikasi |
| Hide Balance | Sembunyikan saldo di dashboard |
| Notifications | On/off notifikasi |
| Download APK | Download APK Android |

---

## 10. 🔐 Authentication

| Fitur | Deskripsi |
|-------|-----------|
| Email Login | Login via email + password |
| Guest Mode | Akses tanpa akun (data lokal) |
| Onboarding | Wizard setup awal (mata uang, saldo awal, preferensi) |
| Security PIN | Kunci aplikasi dengan PIN |
| Forgot Password | Reset password |

---

## 11. 🤖 Telegram Bot Integration

Catat transaksi langsung dari Telegram.

| Fitur | Deskripsi |
|-------|-----------|
| Webhook | `/api/telegram-webhook` menerima pesan Telegram |
| Natural Language | Parse input seperti "makan siang 35rb" |
| Quick Reply | Konfirmasi transaksi via inline keyboard |

---

## 12. 🔔 Notifications

| Fitur | Deskripsi |
|-------|-----------|
| Push Notifications | Web Push via Service Worker |
| Daily Recap | Ringkasan harian via cron job |
| Bill Reminders | Pengingat tagihan jatuh tempo |
| Subscription Check | Deteksi langganan otomatis via cron |
| Native Notifications | Notifikasi native via Capacitor |

---

## 13. 🌐 Internationalization (i18n)

| Fitur | Deskripsi |
|-------|-----------|
| Languages | Indonesia (id) & English (en) |
| Provider | React Context `I18nProvider` |
| Storage | `localStorage` key `monev_language` |
| Coverage | Bottom nav, common labels |

---

## 14. 💱 Multi-Currency

| Fitur | Deskripsi |
|-------|-----------|
| Currencies | IDR, USD, EUR, SGD, MYR |
| Provider | React Context `CurrencyProvider` |
| Formatting | `formatCurrency()` utility |
| Storage | `localStorage` key `monev_currency` |

---

## 15. 🔧 Fitur Lainnya

| Fitur | Deskripsi |
|-------|-----------|
| Semua Fitur Page | Hub navigasi ke semua fitur |
| Upgrade Tier | Kupon sistem untuk unlock fitur premium |
| Error Boundary | Global error handler dengan UI friendly |
| Rate Limiting | API rate limiter (60 req/menit default) |
| Offline Support | Service Worker dengan cache fallback |
| PWA Install | Install sebagai Progressive Web App |
