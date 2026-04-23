# Changelog Analytics dan Riwayat

Tanggal pembaruan: 23 April 2026

Dokumen ini merangkum perubahan yang sudah diterapkan pada halaman `Analytics` dan `Riwayat`, termasuk perubahan UI, alur interaksi, API, query database, typing, performa, dan stabilisasi bug.

## Ruang lingkup

Perubahan utama ada di area berikut:

- `src/app/(protected)/analytics/*`
- `src/app/(protected)/transactions/*`
- `src/app/api/analytics/*`
- `src/app/api/transactions/route.ts`
- `src/backend/db/operations/analytics-operations.ts`
- `src/backend/db/operations/transaction-operations.ts`
- `src/frontend/components/SankeyFlowChart.tsx`
- `src/frontend/components/TransactionItem.tsx`
- `src/frontend/hooks/useTransactionsData.ts`
- `src/frontend/lib/normalize-date.ts`
- `src/lib/pdf-export.ts`
- file i18n analytics

## Perubahan halaman Analytics

### 1. Struktur tab analytics dirapikan

File:

- `src/app/(protected)/analytics/page.tsx`

Perubahan:

- Import tab analytics diubah menjadi static import, bukan `dynamic()` untuk tab utama.
- Akibatnya, tab `Ringkasan`, `Peta`, `Tren`, dan `Wawasan` tidak lagi menunggu lazy chunk setiap pertama dibuka.
- State tab sekarang juga bisa dibaca dari query param `tab`, sehingga analytics bisa diarahkan langsung ke tab tertentu.

Tujuan:

- Mengurangi delay saat pindah tab.
- Membuat navigasi antar-tab lebih stabil.

### 2. Label tab `Peta` diperbaiki

File:

- `src/lib/i18n/locales/id.ts`
- `src/lib/i18n/locales/en.ts`
- `src/frontend/lib/i18n-context.tsx`

Perubahan:

- Menambahkan key translasi `analytics.map`.

Tujuan:

- Menghilangkan tampilan key mentah `analytics.map` di UI.

### 3. Empty state dan konteks periode diperjelas

File:

- `src/app/(protected)/analytics/components/OverviewTab.tsx`
- `src/app/(protected)/analytics/components/TrendsTab.tsx`
- `src/app/(protected)/analytics/components/InsightsTab.tsx`
- `src/app/(protected)/analytics/page.tsx`

Perubahan:

- Tiap tab sekarang menerima `periodLabel`.
- Kartu yang sebelumnya kosong diam-diam sekarang punya empty state eksplisit.
- Label periode aktif sekarang dibawa ke tab, insight, chart, dan export.

Tujuan:

- User tahu data yang sedang dilihat berasal dari periode apa.
- Komponen tidak terlihat rusak saat data kosong.

### 4. AI Insight tidak lagi memblokir seluruh analytics

File:

- `src/app/api/analytics/route.ts`
- `src/app/(protected)/analytics/components/InsightsTab.tsx`
- `src/app/api/ai/insight/route.ts`

Perubahan:

- Route `/api/analytics` tidak lagi generate insight AI secara live sebelum response utama dikirim.
- `InsightsTab` fetch insight terpisah saat dibutuhkan.
- Ditambahkan tombol `Refresh` untuk force regenerate insight.
- Route AI insight dinormalisasi agar cache lama yang berisi JSON string tidak tampil mentah di UI.

Tujuan:

- `Ringkasan` dan `Tren` tampil cepat.
- `Wawasan` tetap bisa bekerja tanpa menahan tab lain.
- Menghilangkan bug insight tampil seperti string JSON.

### 5. Bug data kategori analytics diperbaiki

File:

- `src/app/api/analytics/route.ts`

Perubahan:

- `categoryStats` sekarang memakai `totalAmount`, bukan field salah (`totalExpense`).

Tujuan:

- Menghilangkan `RpNaN`.
- Memastikan chart kategori pengeluaran terisi benar.

### 6. Tipe response analytics diperketat

File:

- `src/app/(protected)/analytics/components/types.ts`
- `src/app/api/analytics/route.ts`
- `src/app/(protected)/analytics/components/EnhancedCharts.tsx`
- `src/app/(protected)/analytics/components/OverviewTab.tsx`
- `src/app/(protected)/analytics/components/InsightsTab.tsx`
- `src/backend/db/operations/analytics-operations.ts`

Perubahan:

- Menambahkan dan merapikan type seperti:
  - `AnalyticsData`
  - `AnalyticsSummary`
  - `MonthlyStat`
  - `HealthScoreData`
  - `BudgetAlert`
  - `ChartCategoryStat`
  - `IncomeStat`
  - `RecommendationData`
  - `AnalyticsDrilldownFilter`
- Banyak `any` di area analytics dihapus.
- Warning hook dan cast liar dirapikan.

Tujuan:

- Mengurangi bug shape data.
- Membuat analytics lebih tahan regresi.

### 7. Konten tab `Ringkasan` dirombak agar tidak duplikatif

File:

- `src/app/(protected)/analytics/components/OverviewTab.tsx`

Perubahan:

- Konten yang duplikatif dengan tab `Tren` dihapus dari ringkasan.
- Ringkasan difokuskan ke:
  - health score
  - pemasukan dan pengeluaran
  - rekomendasi cepat
  - breakdown kategori
  - sumber pemasukan
  - budget alert
  - alokasi dana

Tujuan:

- Membuat pembagian per tab lebih jelas.

### 8. Tab `Tren` diperluas

File:

- `src/app/(protected)/analytics/components/TrendsTab.tsx`
- `src/app/(protected)/analytics/components/SpendingHeatmap.tsx`
- `src/app/(protected)/analytics/components/MonthComparison.tsx`

Perubahan:

- Menambahkan toggle `Mingguan` dan `Bulanan` pada `Pola Pengeluaran`.
- Mode `Bulanan` diubah menjadi heatmap harian satu bulan, bukan chart bar bulanan.
- Menambahkan kartu:
  - `Anomali Pengeluaran`
  - `Hari Tertinggi`
- `Top Kategori Pengeluaran` tetap ada dan sekarang bisa dipakai untuk drill-down.

Tujuan:

- Analisis pola pengeluaran lebih jelas.
- Tren bukan sekadar grafik, tapi juga sinyal anomali.

### 9. Deteksi anomali backend dibuat lebih cerdas

File:

- `src/backend/db/operations/analytics-operations.ts`
- `src/app/(protected)/analytics/components/types.ts`

Perubahan:

- Anomali tidak lagi cuma `> 2x average`.
- Sekarang threshold dimulai dari `> 1.5x average`.
- Ditambahkan:
  - `severity`
  - `ratioToAverage`
  - `insight`

Tujuan:

- Anomali lebih berguna untuk analisis, bukan sekadar flag mentah.

### 10. Wawasan menjadi actionable

File:

- `src/app/(protected)/analytics/components/InsightsTab.tsx`

Perubahan:

- Menambahkan blok `Aksi Minggu Ini`.
- Aksi dibangun dari:
  - anomaly utama
  - budget alert
  - rasio pengeluaran
  - savings rate
  - kategori terbesar
- Item aksi bisa membuka drill-down transaksi saat konteksnya jelas.

Tujuan:

- Insight tidak berhenti di teks AI.
- User bisa langsung investigasi data di balik insight.

### 11. Peta Keuangan diperkuat

File:

- `src/app/(protected)/analytics/components/FinancialMap.tsx`
- `src/frontend/components/SankeyFlowChart.tsx`
- `src/app/api/analytics/sankey/route.ts`

Perubahan:

- Menambahkan:
  - error state
  - tombol `Muat Ulang`
  - badge `focusLabel`
  - preload chart
  - cache data peta
- Route sankey sekarang mendukung:
  - `accountId`
  - `categoryId`
  - `startDate`
  - `endDate`
- Route sankey tidak lagi fetch semua transaksi lalu filter di memory; sekarang memakai query filter langsung.
- Node dan link di sankey sekarang punya metadata:
  - `kind`
  - `categoryId`
  - `targetName`
- Node dan link sekarang bisa diklik untuk membuka drill-down transaksi.

Tujuan:

- Tab `Peta` konsisten dengan filter tab lain.
- Peta berubah dari visual pasif menjadi alat investigasi.

### 12. Filter akun dan kategori analytics dibuat end-to-end

File:

- `src/app/(protected)/analytics/page.tsx`
- `src/app/api/analytics/route.ts`
- `src/backend/db/operations/analytics-operations.ts`
- `src/app/api/analytics/sankey/route.ts`
- `src/app/(protected)/analytics/components/FinancialMap.tsx`

Perubahan:

- Analytics sekarang bisa difilter per akun dan kategori.
- Filter ini berlaku ke:
  - ringkasan
  - tren
  - wawasan
  - peta
  - export PDF

Tujuan:

- User bisa membedah analytics berdasarkan subset data yang benar.

### 13. Drill-down analytics ditambahkan

File:

- `src/app/(protected)/analytics/components/AnalyticsTransactionsModal.tsx`
- `src/app/(protected)/analytics/page.tsx`
- `src/app/(protected)/analytics/components/OverviewTab.tsx`
- `src/app/(protected)/analytics/components/TrendsTab.tsx`
- `src/app/(protected)/analytics/components/InsightsTab.tsx`
- `src/app/(protected)/analytics/components/EnhancedCharts.tsx`
- `src/app/(protected)/analytics/components/FinancialMap.tsx`

Perubahan:

- Menambahkan modal drill-down transaksi.
- Sumber drill-down sekarang mencakup:
  - anomaly
  - hari tertinggi
  - kategori teratas
  - pemasukan
  - pengeluaran
  - budget alert
  - action items di wawasan
  - pie chart kategori
  - bar chart sumber pemasukan
  - node dan link di peta
- Modal drill-down juga punya:
  - detail transaksi read-only
  - tombol `Buka di Riwayat`
  - tombol `Fokus di Peta`
  - cache hasil per kombinasi filter

Tujuan:

- Analytics berubah menjadi workflow investigasi, bukan dashboard statis.

### 14. Export PDF analytics diperluas

File:

- `src/lib/pdf-export.ts`
- `src/app/(protected)/analytics/page.tsx`
- `src/app/(protected)/analytics/components/InsightsTab.tsx`

Perubahan:

- PDF sekarang membawa:
  - `periodLabel`
  - anomaly summary
  - action items

Tujuan:

- Laporan tidak hanya berisi angka, tapi juga temuan dan tindakan.

### 15. Caching dan prefetch analytics ditambahkan

File:

- `src/app/(protected)/analytics/page.tsx`
- `src/app/(protected)/analytics/components/FinancialMap.tsx`

Perubahan:

- Menambahkan cache in-memory untuk response analytics utama.
- Menambahkan cache in-memory untuk response `Peta`.
- Menambahkan preload saat browser idle untuk:
  - bundle chart `Peta`
  - data sankey periode aktif
  - insight AI jika perlu

Tujuan:

- Mengurangi loading saat user pindah tab atau kembali ke kombinasi filter yang sama.

### 16. Query layer analytics sudah diformalisasi

File:

- `src/app/(protected)/analytics/hooks/useAnalyticsQueries.ts`
- `src/app/(protected)/analytics/page.tsx`
- `src/app/(protected)/analytics/components/FinancialMap.tsx`
- `src/app/(protected)/analytics/components/AnalyticsTransactionsModal.tsx`

Perubahan:

- Query analytics utama, filter akun/kategori, `Peta`, dan daftar transaksi drill-down sekarang memakai query options terpusat.
- Cache `Map` manual di page analytics dan `FinancialMap` dihapus.
- Prefetch idle untuk `Peta` sekarang memakai `queryClient.prefetchQuery(...)`.
- Modal drill-down analytics tidak lagi memakai cache lokal `Map`; sekarang ikut memakai query layer yang sama.

Tujuan:

- Menyatukan strategi cache/fetch di analytics.
- Mengurangi sumber stale state dan invalidasi ganda.
- Membuat prefetch, refetch, dan reuse cache lebih konsisten.

## Perubahan halaman Riwayat

### 1. Header tanggal riwayat diperbaiki

File:

- `src/app/(protected)/transactions/hooks/useGroupedTransactions.ts`
- `src/app/(protected)/transactions/components/TransactionList.tsx`
- `src/frontend/lib/normalize-date.ts`
- `src/frontend/hooks/useTransactionsData.ts`
- `src/frontend/components/TransactionItem.tsx`

Perubahan:

- Menambahkan helper `normalize-date.ts`.
- Pengelompokan transaksi sekarang menggunakan key ISO mentah, bukan hasil format yang rawan salah parsing.
- Rendering label tanggal grup dilakukan dari tanggal yang sudah dinormalisasi.
- Mapping transaksi sekarang tahan terhadap:
  - unix seconds
  - milliseconds
  - microseconds atau nanoseconds yang kebablasan
  - string ISO
  - numeric string

Tujuan:

- Menghilangkan bug tahun aneh seperti `58030` dan `58031`.

### 2. Filter Riwayat diperluas

File:

- `src/app/(protected)/transactions/types.ts`
- `src/app/(protected)/transactions/hooks/useTransactionFilters.ts`
- `src/app/(protected)/transactions/components/ActiveFilters.tsx`
- `src/app/(protected)/transactions/components/TransactionFilterModal.tsx`
- `src/app/(protected)/transactions/page.tsx`

Perubahan:

- Menambahkan filter `accountId`.
- Filter aktif sekarang bisa menampilkan chip akun aktif.
- Modal filter transaksi sekarang mendukung filter akun.
- Hook filter mendukung initial state dari query param.

Tujuan:

- Riwayat bisa menerima konteks filter dari analytics.
- User bisa menyaring transaksi per akun langsung dari halaman riwayat.

### 3. URL Riwayat sekarang sinkron dengan filter

File:

- `src/app/(protected)/transactions/page.tsx`

Perubahan:

- Halaman `Riwayat` membaca filter awal dari query param:
  - `search`
  - `categoryId`
  - `accountId`
  - `type`
  - `startDate`
  - `endDate`
- Saat user mengubah filter manual, URL ikut diperbarui.

Tujuan:

- Back/forward browser lebih konsisten.
- Filter bisa dishare.
- Analytics bisa melompat ke `Riwayat` dengan konteks yang sama.

### 4. API transaksi diperluas

File:

- `src/app/api/transactions/route.ts`
- `src/backend/db/operations/transaction-operations.ts`

Perubahan:

- Endpoint `/api/transactions` sekarang mendukung:
  - `categoryId`
  - `accountId`
  - `type`
  - `startDate`
  - `endDate`
- Jika ada advanced filters, route memakai `searchTransactions(...)`.
- Response transaksi sekarang selalu diperkaya dengan:
  - `categoryName`
  - `categoryColor`
  - `categoryIcon`

Tujuan:

- Modal drill-down analytics bisa memakai endpoint transaksi yang sama secara konsisten.

### 5. Swipe transaksi diperbaiki

File:

- `src/frontend/components/TransactionItem.tsx`
- `src/app/(protected)/transactions/components/TransactionList.tsx`
- `src/app/(protected)/transactions/page.tsx`

Perubahan:

- Swipe action rail di kiri/kanan sekarang punya lebar tetap.
- Kartu utama dibuat `w-full` agar layout tidak pecah.
- Threshold swipe dibuat lebih tegas.
- Drag momentum dimatikan, drag elastic diperkecil.
- Klik normal dan swipe dipisah agar gesture tidak bentrok.
- Wiring swipe ke handler edit/hapus halaman sekarang tersambung benar.

Tujuan:

- Menghilangkan swipe yang berantakan, action tray yang tumpang tindih, dan trigger yang tidak stabil.

### 6. Tipe pipeline transaksi diperketat

File:

- `src/backend/db/operations/transaction-operations.ts`
- `src/app/api/transactions/bulk/route.ts`
- `src/frontend/lib/offline-manager.ts`
- `src/frontend/hooks/useTransactionsData.ts`

Perubahan:

- Menambahkan tipe formal untuk bulk import transaksi.
- `createBulkTransactions(...)` tidak lagi menerima `any[]`.
- Offline queue dan optimistic transaction sekarang punya shape typed.
- Hook transaksi tidak lagi menebak response API dan data offline dengan `any`.
- Route bulk import sekarang memakai request body typed dan `Request` standar.

Tujuan:

- Mengurangi bug shape data di jalur transaksi.
- Membuat import bulk, offline queue, dan tampilan `Riwayat` lebih tahan regresi.

## Dampak produk

Setelah seluruh perubahan ini:

- Analytics tidak lagi sekadar membaca angka, tapi bisa dipakai untuk investigasi transaksi.
- Semua tab analytics sekarang jauh lebih konsisten terhadap filter dan periode aktif.
- Riwayat bisa menerima konteks dari analytics dan mempertahankannya di URL.
- Sistem tanggal transaksi menjadi jauh lebih tahan terhadap data seed atau timestamp yang campur format.
- Swipe transaksi di riwayat menjadi lebih stabil dan lebih bisa diprediksi.

## File baru yang ditambahkan

- `src/app/(protected)/analytics/components/AnalyticsTransactionsModal.tsx`
- `src/app/(protected)/analytics/components/EnhancedCharts.tsx`
- `src/frontend/lib/normalize-date.ts`

## Catatan kualitas

Area analytics dan riwayat yang disentuh sudah beberapa kali dilint selama implementasi. Perubahan yang didokumentasikan di atas dirapikan agar:

- tidak menambah warning/error lint baru di file yang diubah
- mengurangi `any`
- mengurangi race condition kecil dan bug shape data

Batch hardening terbaru yang juga sudah dilint:

- `src/app/(protected)/analytics/hooks/useAnalyticsQueries.ts`
- `src/app/(protected)/analytics/components/AnalyticsTransactionsModal.tsx`
- `src/app/(protected)/analytics/components/FinancialMap.tsx`
- `src/app/(protected)/analytics/page.tsx`
- `src/frontend/hooks/useTransactionsData.ts`
- `src/frontend/lib/offline-manager.ts`
- `src/backend/db/operations/transaction-operations.ts`
- `src/app/api/transactions/bulk/route.ts`

## Rekomendasi lanjutan

Jika pengembangan dilanjutkan, prioritas berikutnya yang paling bernilai adalah:

1. Menambahkan preload lintas halaman ke `Riwayat`.
2. Menambahkan persistent highlight antar tab analytics.
3. Melanjutkan type hardening di auth/offline boundary lain.
4. Menambahkan state swipe `snap open` sebelum eksekusi aksi di riwayat.
