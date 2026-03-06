# Implementation Plan: my-agent-finance

Berikut adalah daftar checklist perbaikan untuk project berserta status pengerjaannya:

## 1. Kestabilan & Type Safety (Prioritas Utama 🔥)

- [x] **Pembersihan TypeScript & ESLint**: Terakhir kali kita jalankan linter, ada sekitar 400+ warnings dan errors (sebagian besar terkait penggunaan tipe `any`, variabel yang tidak terpakai, dan ketidaksesuaian property). Membersihkan ini akan sangat mengurangi potensi bug gaib di masa depan.
- [x] **Sinkronisasi Tipe Data Drizzle**: Tipe data di `src/types/index.ts` kadang tidak sinkron dengan skema di database (Drizzle). Memastikan tipe data (seperti `Transaction`) ter-export langsung dari schema database akan membuat auto-complete dan validasi berjalan sempurna.
- [x] **Perbaikan Tipe NextAuth**: Saat ini, di banyak halaman, kita menggunakan `// @ts-ignore` untuk mengambil `session.user.tier`. Kita perlu memperbarui deklarasi modul `next-auth.d.ts` agar pemanggilan tier tersebut dianggap type-safe oleh TypeScript.

## 2. Performa & Pengalaman Pengguna (UX ✨)

- [ ] **Manajemen Data Menggunakan Tanstack Query (React Query) / SWR**: Saat ini kita banyak melakukan pemanggilan data manual dengan `useEffect` + `useState(loading)`. Beralih ke Tanstack Query akan langsung memberikan fitur: Caching (data langsung muncul tanpa loading ulang jika pindah halaman), Optimistic Updates (UI langsung berubah meski data masih dikirim ke server), dan otomatis refresh saat user pindah tab.
- [ ] **Loading Skeleton yang Lebih "Premium"**: Mengganti bentuk loading pulse kotak-kotak standar dengan skeleton yang benar-benar mirip dengan rangka UI aslinya (misal bentuk card atau struktur list transaksi).
- [ ] **Error Boundary Global**: Jika ada komponen yang gagal merender (misal karena data AI salah format), aplikasi tidak akan "blank putih" seluruhnya, melainkan hanya memunculkan pesan error elegan pada bagian yang rusak saja.

## 3. Arsitektur & Clean Code 🛠️

- [ ] **Memecah Komponen Raksasa**: Memisahkan logic dari UI. Beberapa halaman (seperti Dashboard atau komponen form input yang cerdas) sudah sangat panjang. Mengekstrak logika API dan state ke dalam Custom Hooks (misal: `useDashboardStats()`, `useAIParser()`) akan membuat kode jauh lebih mudah dibaca dan dipelihara.

## 4. Optimalisasi Integrasi AI 🤖

- [ ] **Fallback API & Handling Timeout**: Fitur cerdas (seperti Detective Agent atau Impulse Buying Judge) sangat bergantung pada OpenAI. Jika limit tercapai atau API timeout, user harus tetap bisa melakukan input manual tanpa mengalami kendala, dengan memunculkan pesan eror (toast) yang ramah.
- [x] **Rate Limiting Berlapis**: Mengamankan endpoint API (terutama yang mahal seperti AI OCR/Voice) dengan Rate Limiter yang ketat berdasarkan tier (`UserTier`) pengguna. *(Sudah diimplementasikan untuk API dan AI rate limiting).*
