# 📋 Monev — Feature Documentation

Dokumentasi lengkap semua fitur aplikasi Monev, mencakup fitur dasar hingga asisten bertenaga AI.

---

## 1. 🏠 Dashboard (Personalized Home)

Halaman utama yang proaktif dan adaptif.

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| Greeting | Sapaan dinamis berdasarkan waktu & mood. | ✅ Done |
| balance | Total saldo (Bank + Cash) dengan opsi sembunyi. | ✅ Done |
| **Daily Insight** | Kartu penasihat AI yang menganalisis budget & MoM anomaly. | ✅ Done |
| FAB | Tombol melayang untuk akses cepat ke semua input. | ✅ Done |
| Quick-Tap | Template 1-kali sentuh untuk transaksi rutin (Kopi, Makan, dll). | ✅ Done |

---

## 2. 🤳 Intelligent Ingestion (Input Cerdas)

Mengurangi *friction* saat mencatat pengeluaran.

### A. The "Screenshot" Agent (Vision)
- **Fungsi**: Ekstrak data dari struk belanja atau screenshot mutasi bank.
- **Teknologi**: GPT-4o Vision OCR.
- **Status**: ✅ Implemented.

### B. The "Voice Memo" Catcher
- **Fungsi**: Mencatat transaksi hanya dengan perintah suara (multi-item).
- **Teknologi**: OpenAI Whisper.
- **Status**: ✅ Implemented.

### C. The "Time-Cost Translator"
- **Fungsi**: Mengonversi nominal belanja menjadi "Jam Kerja" (berdasarkan hourly rate user).
- **Psikologi**: Memberi rasa 'sakit' sebelum belanja impulsif.
- **Status**: ✅ Implemented.

---

## 3. 🤖 AI Chat & Context Engine

Asisten yang bukan sekadar bot, tapi memahami kondisi keuanganmu.

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| **Detective Agent** | Mencari identitas merchant ambigu via Google Search. | ✅ Implemented |
| **Semantic Search** | Tanya jawab data finansial via NLP ("Berapa biaya servis motor?"). | ✅ Implemented |
| Context Prediction | Prediksi kategori otomatis berdasarkan waktu & pola kebiasaan. | ✅ Implemented |
| AI Chat | Diskusi strategis tentang mencapai goal finansial. | ✅ Done |
| **Prediction Caching** | Cache lokal untuk merchant yang pernah dikunjungi. | ✅ Done |

---

## 4. 📅 Bills & Subscriptions

Melacak pengeluaran rutin yang sering terlupakan.

- **Subscription Hunter**: Otomatis mendeteksi pola transaksi berulang (recurring).
- **Bill Reminders**: Pengingat tagihan jatuh tempo di dashboard & notifikasi.
- **Status**: ✅ Implemented.

---

## 5. 🤝 Social Finance & Assets

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| **Split Bill** | Alur otomatis untuk bagi tagihan setelah belanja besar. | ✅ Implemented |
| **Debt Collector** | Generator pesan penagih hutang (copywriting sopan/galak). | ✅ Implemented |
| **Goal Defender** | Intervensi AI jika pengeluaran menghambat target tabungan. | ✅ Implemented |
| **Cash Burn Rate** | Interogasi sisa uang tunai 3 hari setelah tarik ATM (Stock Opname). | ✅ Implemented |

---

## 6. 📊 Reports & Analysis

- **Automated Wealth PDF**: Laporan aset & kesehatan finansial bulanan dalam format PDF cantik.
- **50/30/20 Rule**: Analisis otomatis alokasi gaji harian/bulanan.
- **Status**: ✅ Implemented (Phase 6).

## 7. 🚀 Phase 8: Automation, Security & Engagement
Fase untuk memperkuat keamanan, mempermudah masukan data massal, dan meningkatkan keterikatan pengguna.

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| **Biometric Lock** | Keamanan sidik jari/wajah (FaceID) via Capacitor Native. | ✅ Implemented |
| **Bulk Importer** | Impor transaksi massal dari CSV/Excel mutasi bank. | ✅ Implemented |
| **Daily Streak** | Track konsistensi pencatatan harian dengan "Flame Counter". | ✅ Implemented |
| **Badges & Trophies** | Koleksi badge pencapaian (koleksi trophy di profil). | ✅ Implemented |
| **AI Persona** | Analisis psikologi & kepribadian keuangan otomatis oleh AI. | ✅ Implemented |

---

## 🛠️ Technical Excellence (Experience)

- **Offline-First (IndexedDB)**: Sinkronisasi data handal bahkan saat internet tidak stabil.
- **Capacitor Haptics**: Getaran taktil untuk aksi kirim sukses atau peringatan boros.
- **PWA / Mobile**: Installable sebagai aplikasi di Android atau Web PWA.
- **Panic Toggle (Quick Stealth)**: Proteksi instan untuk menyembunyikan data sensitif.
- **Global App Lock**: Proteksi aplikasi secara menyeluruh saat di-resume dari background.

---

## 8. 🔮 Upcoming Features (Roadmap)

Fitur masa depan untuk mengubah Monev menjadi *Ultimate Financial Strategist*.

| Fitur | Deskripsi | Status |
|-------|-----------|--------|
| **Interactive Financial Map** | Visualisasi aliran uang (Sankey/Treemap) dari Income -> Alokasi -> Pengeluaran. | 🏗️ Planning |
| **AI "What-If" Simulator** | Simulasi keputusan finansial (Kredit vs Cash, Investasi vs Konsumsi). | 🏗️ Planning |
| **Shared/Collab Wallet** | Pengelolaan anggaran bersama pasangan atau keluarga dengan sinkronisasi instan. | 🏗️ Planning |
| **Impulse Buy Judge** | AI yang menilai keranjang belanja online Bos berdasarkan kondisi *cashflow* nyata. | 🏗️ Planning |
| **Voice Command V2** | Kendali aplikasi penuh lewat suara (Navigasi, Set Budget, Filter Laporan). | 🏗️ Planning |

---

*Last Updated: 25 February 2026*
*Version: 1.9 (Strategist Roadmap)*
