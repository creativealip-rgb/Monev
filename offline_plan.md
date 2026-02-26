# Monev Offline Mode Implementation Plan

This document outlines the high-level strategy and technical steps required to transform the Monev application into a fully offline-capable Progressive Web App (PWA) for its core features.

## 1. Goal
Memungkinkan user (Bos Alip) untuk mencatat pengeluaran/pemasukan, melihat saldo, dan melihat riwayat transaksi terbaru meskipun **tanpa koneksi internet**. Saat internet kembali menyala, data yang dicatat secara offline akan otomatis sinkron (sync) ke server utama (Supabase/SQLite).

## 2. Core Offline Features
Fitur-fitur dasar yang akan bisa diakses saat *Airplane Mode* atau internet mati:
1. **View Dashboard**: Tampil saldo, pemasukan, pengeluaran bulan ini (Data di-*cache* dari koneksi terakhir).
2. **View Transactions**: Melihat riwayat transaksi terakhir.
3. **Add Transaction (Input)**: Mencatat pengeluaran/pemasukan baru secara manual tanpa error.
4. **Pending Sync Indicator**: Menampilkan icon/label bahwa "Ada X transaksi yang belum tersinkron".

Fitur yang **tetap butuh online**:
1. AI Chat & Receipt Scanning (Butuh OpenAI API).
2. Real-time Currency Live Updates.
3. AI Insights & Simulations.

---

## 3. Technical Strategy

### A. Progressive Web App (PWA) Foundation
Aplikasi ini sudah menggunakan Next.js. Kita akan memastikan integrasi PWA berjalan maksimal:
- **`next-pwa`**: Memastikan plugin `next-pwa` dikonfigurasi untuk men-_cache_ halaman-halaman statis dan rute-rute penting (Dashboard, Form).
- **Service Worker (`sw.js`)**: Bertugas mencegat HTTP Requests. Jika offline, Service Worker akan menyajikan data HTML/CSS/JS dari _cache_ browser.

### B. Local Storage & IndexedDB (Penyimpanan Data Offline)
Karena `localStorage` terbatas (hanya 5MB dan hanya teks), kita akan menggunakan **IndexedDB** melalui library `idb` atau `dexie` untuk menyimpan data transaksi secara lokal.

**Struktur Data Lokal (IndexedDB):**
1. `cached_dashboard`: Menyimpan stat terakhir (Saldo, dll) untuk ditampilkan cepat.
2. `cached_transactions`: Menyimpan list transaksi terakhir.
3. `sync_queue`: **(PENTING)** Tabel khusus untuk menampung transaksi baru yang dibuat saat offline.

### C. Mutasi Offline (Background Sync)
Saat user menekan "Simpan" pada transaksi baru dalam keadaan offline:
1. UI tidak melempar pesan Error "Gagal koneksi".
2. Aplikasi mendeteksi `navigator.onLine === false`.
3. Data form disimpan ke dalam tabel lokal `sync_queue`.
4. Saldo di Dashboard di-_update_ secara lokal (Optimistic UI) agar user merasa transaksi berhasil.
5. Muncul notifikasi: "Tersimpan offline. Akan disinkronkan saat terhubung internet."

### D. Re-Sync Logic (Rekonsiliasi)
Saat sistem mendeteksi koneksi internet kembali (`window.addEventListener('online', syncData)`):
1. Aplikasi membaca isi dari `sync_queue`.
2. Melakukan POST request secara berurutan atau _bulk_ ke `/api/transactions/bulk`.
3. Jika POST berhasil (200 OK), hapus data tersebut dari `sync_queue`.
4. Refresh tampilan agar data 100% akurat dengan server.

---

## 4. Step-by-Step Execution Plan

### Step 1: Install Dependencies
- Tambahkan library `dexie` (atau `idb-keyval`) untuk manajemen IndexedDB yang mudah di frontend.
> `npm install dexie dexie-react-hooks`

### Step 2: Setup Local Database (IndexedDB)
- Buat file `src/frontend/lib/local-db.ts`.
- Definisikan skema Dexie untuk `sync_queue` (menunggu sinkronisasi) dan `cache` (data bacaan).

### Step 3: Implement Offline Detection Hook
- Buat custom hook `useNetworkStatus()` untuk mendeteksi `isOnline`.
- (Opsional) Buat komponen UI kecil di navbar yang menunjukkan indikator "Offline Mode".

### Step 4: Refactor `TransactionForm.tsx`
- Modifikasi logic onSubmit.
- `if (isOnline)` -> `fetch("/api/transactions")` (Seperti biasa).
- `if (!isOnline)` -> Simpan data form ke `dexie.sync_queue` + trigger global state update untuk optimis UI.

### Step 5: Background Sync Engine
- Di `ClientLayout.tsx` (atau root layout), pasang `useEffect` yang mendengarkan `window.addEventListener('online', ...)`.
- Saat koneksi kembali, panggil fungsi `flushSyncQueue()`.
- Buat endpoint API `/api/transactions/bulk` di backend untuk menerima sinkronisasi masal dengan cepat.

### Step 6: Refactor Dashboard & History APIs (Caching)
- Gunakan *SWR* atau `React Query` jika ada, atau modifikasi custom fetchers.
- Saat sedang online, selain melempar data ke UI, simpan hasil JSON ke IndexedDB `cache`.
- Saat halaman di-load dan offline, ambil data dari `cache`.

---

## 5. Integrasi dengan Capacitor (Aplikasi Mobile Native)
Karena _project_ ini di-build menjadi APK/iOS menggunakan **Capacitor**, strategi PWA standar sedikit berbeda saat berjalan di _mobile device_.

Lebih tepatnya, kita mendapatkan keuntungan lebih, yaitu:
1. **Tidak Butuh Service Worker untuk Load UI:**
UI Aplikasi (Next.js Static Export) sudah di-_bundle_ ke dalam APK. Jadi, load awal aplikasi dijamin **selalu bisa tanpa internet**. Plugin `next-pwa` hanya berguna untuk versi *web browser* saja.
2. **Koneksi Jaringan yang Lebih Akurat:**
Daripada mengandalkan `navigator.onLine` yang kadang tidak reliabel di _webview_, kita akan (dan harus) menggunakan plugin `@capacitor/network`.
```javascript
import { Network } from '@capacitor/network';
// Deteksi online/offline
const status = await Network.getStatus();
// Listener khusus platform native
Network.addListener('networkStatusChange', status => {
  if (status.connected) flushSyncQueue();
});
```
3. **Penyimpanan Lokal:**
Meskipun Capacitor punya plugin *Native Preferences* atau *Native SQLite*, menggunakan **IndexedDB / idb** di WebView Capacitor tetap merupakan solusi yang ***paling mudah dan disarankan*** untuk data JSON dalam jumlah menengah. IndexedDB sudah tersimpan permanen di memori aplikasi (tidak akan terhapus kecuali user melakukan *Clear Data* di pengaturan Android).

---

## 6. Potential Challenges
1. **Authentication Check:** Memastikan Session NextAuth/Supabase tetap valid selama offline. (JWT cookie harus cukup bertahan lama dan tidak redirect ke halaman Login saat fetch API session gagal karena offline).
2. **ID Conflict:** Transaksi offline belum punya `id` asli dari database server. Kita harus memberikan `uuid` palsu di IndexedDB, yang nantinya diubah menjadi `id` asli auto-increment saat masuk ke server.

**Approval Required:** 
Apakah rencana ini sudah sesuai dengan ekspektasi Capacitor build-nya, Bos? Jika setuju, kita bisa mulai tahap eksekusi dari Step 1.
