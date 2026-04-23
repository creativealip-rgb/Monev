# Repo Improvement Audit

Tanggal audit: 23 April 2026

Dokumen ini merangkum area yang paling tidak efektif di repo `Monev`, dampaknya, dan urutan perbaikan yang paling masuk akal. Fokusnya bukan daftar ideal abstrak, tapi backlog yang bisa benar-benar dieksekusi.

## Ringkasan eksekutif

Secara produk, repo sudah bergerak cepat dan banyak fitur berjalan. Masalah utamanya bukan kekurangan fitur, tapi biaya maintenance yang mulai naik karena beberapa hal:

- hygiene repo lemah
- boundary dev vs production bocor
- logging/debug terlalu noisy
- typing belum konsisten
- strategi fetch/cache bercabang
- scripts dan utilitas data terlalu banyak dan saling overlap

Kalau dibiarkan, repo akan tetap bisa jalan, tapi setiap perubahan baru akan makin mahal diuji, makin sulit di-review, dan makin mudah menimbulkan side effect.

## Temuan utama

### 1. Repo hygiene masih lemah

Gejala:

- database lokal pernah ikut masuk tree
- artefak seperti `build-output.txt`, backup, dan nested workspace ikut muncul di root
- ada nested git repository `my-agent-finance/`

Dampak:

- clone dan review jadi bising
- risiko mendorong state lokal ke remote
- konflik git lebih sulit dipahami

Perbaikan:

- kunci `.gitignore`
- putuskan status `my-agent-finance/`: submodule resmi atau keluar dari repo
- bersihkan artefak lokal dari index di commit terpisah

Status:

- `.gitignore` sudah diperluas untuk mencegah artefak sejenis masuk lagi
- artefak lokal yang sudah terlanjur tracked sudah dikeluarkan dari git index dan tinggal dicatat dalam follow-up commit

### 2. Security debt pada akun admin dan script operasional

Gejala:

- ada script reset password admin dengan password default tetap
- ada script yang menampilkan login info admin secara eksplisit

Dampak:

- praktik operasional jadi tidak aman
- tim bisa terbiasa mengandalkan default credential
- risiko kebocoran makin tinggi bila script dijalankan di environment yang salah

Perbaikan:

- hapus password default hardcoded
- ganti jadi bootstrap flow berbasis env atau one-time reset token
- pisahkan script dev-only dari script operasional resmi

Prioritas:

- tinggi

### 3. Logging terlalu verbose dan tidak dibedakan levelnya

Gejala:

- banyak `console.log` tersebar di auth, webhook, DB ops, dan script
- log memuat detail flow user/session yang seharusnya tidak selalu keluar

Dampak:

- noise tinggi saat debugging
- observability buruk karena sinyal penting tenggelam
- berisiko membocorkan data sensitif ke log

Perbaikan:

- standarkan ke logger dengan level (`debug`, `info`, `warn`, `error`)
- buat redaction policy untuk auth/session/user data
- matikan debug verbose di production

Prioritas:

- tinggi

### 4. Type safety belum merata

Gejala:

- masih banyak `any`, `@ts-ignore`, dan cast liar di berbagai domain
- analytics sudah jauh lebih rapi, tapi area lain belum menyusul

Dampak:

- bug shape data masih mudah lolos
- refactor mahal karena compiler belum cukup membantu

Perbaikan:

- prioritaskan boundary yang paling rawan:
  - auth
  - transaction pipeline
  - offline manager
  - AI routes
  - scripts yang menyentuh DB

Prioritas:

- tinggi

### 5. Data layer tidak konsisten

Gejala:

- sebagian layar sudah memakai TanStack Query
- sebagian lain masih mengandalkan cache `Map` manual
- invalidasi cache belum punya pola tunggal

Dampak:

- perilaku fetch antar halaman berbeda
- risiko stale data atau cache dobel lebih tinggi

Perbaikan:

- tetapkan satu pola utama untuk data client
- rekomendasi: dorong cache manual layar berat ke query layer formal secara bertahap

Prioritas:

- menengah-tinggi

### 6. Scripts dan utilitas data terlalu banyak

Gejala:

- banyak script seed/check/fix/reset dengan fungsi yang mirip
- versi `.js` dan `.ts` hidup berdampingan tanpa status yang jelas

Dampak:

- sulit tahu script mana yang resmi
- risiko menjalankan script yang salah
- maintenance operasional makin mahal

Perbaikan:

- kategorikan script:
  - seed resmi
  - migration support
  - audit/check
  - dev-only scratch
- pindahkan scratch script ke folder terpisah atau keluarkan dari repo
- beri README singkat untuk scripts

Prioritas:

- menengah

### 7. Test coverage belum sebanding dengan kompleksitas

Gejala:

- ada test, tapi coverage kritikal masih tipis dibanding domain repo
- banyak area high-risk belum punya kontrak test yang kuat

Area yang paling butuh test tambahan:

- auth/session sync
- analytics API contract
- transaction filter + drill-down
- upgrade flow
- normalisasi tanggal
- payment and webhook paths

Prioritas:

- menengah

## Prioritas eksekusi

### Batch 1: Repo Safety

Target:

- repo lebih aman disentuh harian
- artefak lokal berhenti bocor

Pekerjaan:

1. Bersihkan file lokal yang tidak semestinya tracked
2. Putuskan nasib `my-agent-finance/`
3. Audit `.gitignore` dan lock pola final

Estimasi:

- 0.5 sampai 1 hari

### Batch 2: Security + Logging

Target:

- kurangi risiko operasional dan kebocoran log

Pekerjaan:

1. Hapus flow password admin default
2. Audit script reset/show-login
3. Reduksi `console.log` di auth dan jalur sensitif
4. Standarkan level logging

Estimasi:

- 1 sampai 2 hari

### Batch 3: Type Hardening

Target:

- turunkan jumlah `any` di boundary penting

Pekerjaan:

1. Auth types
2. Transaction pipeline types
3. Offline manager types
4. AI response contract types

Estimasi:

- 2 sampai 4 hari

### Batch 4: Data Layer Unification

Target:

- perilaku fetch/cache lebih konsisten

Pekerjaan:

1. petakan layar yang pakai cache manual
2. tentukan query key strategy
3. pindahkan cache manual bertahap

Estimasi:

- 2 sampai 3 hari

### Batch 5: Test Reinforcement

Target:

- area yang paling mahal kalau rusak punya guardrail

Pekerjaan:

1. kontrak analytics API
2. filter dan drill-down transaksi
3. auth session hydration
4. date normalization

Estimasi:

- 2 sampai 4 hari

## Rekomendasi langsung yang paling worth it

Kalau hanya boleh memilih tiga hal untuk dikerjakan berikutnya, urutannya:

1. Repo safety cleanup
2. Security + logging cleanup
3. Type hardening di auth dan transaction pipeline

Alasannya sederhana:

- ketiganya menurunkan biaya semua pekerjaan setelahnya
- ketiganya mengurangi risiko error yang sifatnya sistemik, bukan kosmetik

## Catatan implementasi

Guardrail awal yang sudah ditambahkan pada audit ini:

- `.gitignore` diperluas untuk:
  - `playwright-report/`
  - `test-results/`
  - `build-output.txt`
  - `*.bak`
  - `my-agent-finance/`

Catatan penting:

- perubahan `.gitignore` ini hanya mencegah file baru ikut masuk ke depan
- file yang sempat tracked sudah dibersihkan dari git index, tetapi perubahan itu masih perlu di-commit

## Next action yang disarankan

Langkah paling masuk akal setelah dokumen ini:

1. buat commit cleanup repo hygiene
2. audit dan kurangi log debug di `src/auth.ts`
3. hapus atau redesign script password admin default

## Update implementasi 23 April 2026

Yang sudah dieksekusi setelah audit ini dibuat:

- `src/auth.ts`
  - log auth/session/JWT yang terlalu verbose sudah direduksi dan dipindahkan ke logger bertingkat
  - payload sensitif tidak lagi dicetak mentah ke console
- `scripts/reset-admin-password.ts`
  - password admin default hardcoded dihapus
  - script sekarang mewajibkan `ADMIN_PASSWORD` dari environment
- `scripts/show-login-info.ts`
  - plaintext password tidak lagi ditampilkan
- `package.json`
  - nama package diselaraskan dari `my-agent-finance` menjadi `monev`
- git index
  - `AGENTS.md.bak`
  - `build-output.txt`
  - `sqlite.db`
  - `sqlite.db-shm`
  - `sqlite.db-wal`
  - `my-agent-finance`
  sudah dikeluarkan dari tracking tanpa menghapus file lokal pengguna
