# Monev Progress Report

Tanggal: 2026-05-10
Branch: `twa-playstore`

## Sudah Selesai

1. **Security middleware protection**
   - Protected routes `/dashboard/*`, `/fitur/*`, `/api/*` (except auth).
   - Unauthenticated access sekarang redirect ke `/login` atau `401` untuk API.

2. **Edge runtime middleware issue**
   - `middleware.ts` sudah diubah agar tidak import chain yang butuh module Node (`fs`) di edge runtime.

3. **Login redirect setelah sign-in**
   - `src/app/login/page.tsx` sudah diubah agar setelah login cek `/api/profile` dulu:
     - jika onboarding selesai -> `/dashboard`
     - jika belum -> `/onboarding`

4. **Onboarding account setup stuck bug**
   - `handleAccountSetup` di `src/app/onboarding/page.tsx` diperbaiki dari `goToScreen(5)` ke `goToScreen(6)`.

5. **Final onboarding button wiring**
   - Tombol final di `InitialBalanceScreen` sudah diproteksi dengan `type="button"` + `preventDefault/stopPropagation`.

6. **Credential reset untuk user testing**
   - Credential test sudah direduksi dari catatan progress. Gunakan user test ephemeral/E2E saja.

## Sedang / Belum Selesai

1. **Flow onboarding tahap baru (Penghasilan Bulanan)**
   - Requirement: setelah `Saldo Awal` harus ada step `Penghasilan Bulanan`, baru AI budget.
   - Status: **selesai dan E2E pass**.
   - File baru: `src/app/onboarding/components/MonthlyIncomeScreen.tsx`.

2. **Tipe data onboarding untuk monthly income**
   - `src/app/onboarding/types/index.ts` sudah ditambah field:
     - `monthlyIncome: number`
     - `budgetRecommendations?: BudgetRecommendation[]`
   - `useOnboarding.ts`, `page.tsx`, dan API onboarding sudah menerima field ini.
   - `monthlyIncome` sekarang dipersist ke `user_settings.monthly_income` dan diekspos via `/api/profile` + `/api/stats`.

3. **Hydration/login intermittent issue**
   - Pernah muncul error client: `Unexpected end of JSON input` saat `signIn`.
   - Sudah ada hardening basic di login error handling, namun perlu verifikasi ulang setelah flow onboarding final selesai.

4. **E2E final verification onboarding**
   - Sudah pass untuk skenario quick onboarding:
     - login -> onboarding lengkap -> dashboard
     - validasi step `Penghasilan Bulanan` dan budget AI memakai Rp 5.000.000/bulan.
     - validasi persisted stats: `monthlyIncome === 5000000` dan total budget bulan ini `5000000`.
   - Sudah pass untuk skenario complete/account setup:
     - tambah akun `BCA Test` saldo awal Rp 1.250.000 -> penghasilan bulanan -> budget AI -> dashboard.
     - validasi persisted stats: `totalAccounts === 1250000` dan `accountCount >= 1`.
   - Command pass: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1`.

5. **Persist budget onboarding ke dashboard**
   - `completeOnboardingAction` sekarang menyimpan budget hasil `Saran Budget AI` ke tabel `budgets` untuk bulan/tahun berjalan.
   - Mapping kategori onboarding dibuat ke kategori dashboard (`Makan & Minuman`, `Transportasi`, `Tagihan`, dst).
   - Jika budget kategori/bulan/tahun sudah ada, amount di-update agar onboarding ulang tidak membuat duplikasi.
   - `/api/stats` membaca tabel `budgets`, sehingga dashboard `weeklyBudgetTotal/Remaining` ikut terisi dari onboarding.

6. **Schema/migration monthly income**
   - `src/backend/db/schema.ts` ditambah kolom `monthlyIncome` (`monthly_income`).
   - Migration baru: `drizzle/0006_onboarding_monthly_income.sql`.
   - Runtime SQLite dev juga sudah di-ALTER agar DB lokal langsung punya kolom `monthly_income`.

7. **Saldo awal onboarding masuk ke saldo akun**
   - Root cause: dashboard saldo membaca tabel `accounts`, sedangkan onboarding lama hanya membuat transaksi `Saldo Awal`.
   - Fix: onboarding sekarang meneruskan data account setup ke API, membuat row `accounts`, dan mengikat transaksi saldo awal ke `accountId`.
   - Jika user hanya isi `initialBalance` tanpa account setup, dibuat akun cash default `Saldo Awal` supaya total saldo dashboard ikut terisi.
   - Hardening: onboarding rerun sekarang idempotent untuk saldo awal; account/transaction opening balance lama di-update, bukan dibuat dobel.

## Perubahan File yang Sudah Tercatat

- `middleware.ts`
- `src/auth.ts`
- `src/app/login/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/onboarding/components/InitialBalanceScreen.tsx`
- `src/app/onboarding/components/MonthlyIncomeScreen.tsx`
- `src/app/onboarding/hooks/useOnboarding.ts` (perubahan terdahulu terkait total screen + simpan account setup)
- `src/app/onboarding/types/index.ts` (tambah `monthlyIncome`, `accounts`)
- `src/app/api/onboarding/route.ts` (terima `budgetRecommendations`, `accounts`)
- `src/backend/actions/onboarding-actions.ts` (persist monthly income + budget + saldo awal akun)
- `src/backend/db/schema.ts` (kolom `monthlyIncome`)
- `src/backend/db/index.ts` (runtime schema guard untuk dev SQLite)
- `drizzle/0006_onboarding_monthly_income.sql`
- `src/app/api/profile/route.ts` (expose `monthlyIncome`)
- `src/app/api/stats/route.ts` (expose `monthlyIncome`, budget total dari DB)
- `src/app/(protected)/dashboard/types.ts` (tipe `monthlyIncome`)
- `tests/onboarding.spec.ts` (E2E quick onboarding + monthly income + complete account setup saldo awal)
- `playwright.config.ts` (project `login` juga match onboarding spec)

## Next Action (Prioritas)

1. Jalankan regression lebih luas bila perlu: full lint/build dan test dashboard/budget page.

2. **Phase 1.2 Smart Notifications System**
   - Tambah schema/migration `smart_notification_rules`.
   - Tambah generator alert untuk anomaly spending, budget warning, positive reinforcement, dan weekly recap.
   - Tambah API `/api/smart-notifications` untuk generate/list/dismiss/sendToInbox.
   - Tambah dashboard card `SmartNotificationCard`.

3. **Phase 1.3 Quick Add Shortcuts**
   - Tambah schema/migration `quick_add_shortcuts`.
   - Tambah operasi CRUD basic + run shortcut yang membuat transaksi.
   - Tambah API `/api/quick-add` dan `/api/quick-add/[id]/run`.
   - Tambah dashboard widget `QuickAddShortcutsWidget`.
   - Quick Add sekarang punya modal create shortcut langsung dari dashboard: label, nominal, type, account, category, merchant optional.
   - Tambah auto-suggest shortcut dari transaksi 45 hari terakhir yang muncul minimal 2x, lalu bisa di-accept sekali tap.

4. E2E regression pass:
   - `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed.
   - Coverage: quick onboarding monthly income/budget, complete onboarding anti-duplikasi saldo, Quick Add shortcut render + run API + stats expense refresh.

5. **Phase 2.1 AI Chat Quick Actions**
   - Audit: chat API sudah punya local intent/action basic untuk transaksi, undo, budget/goal planning.
   - Response `record_transaction` dan `undo_transaction` sekarang membawa `type: "action_result"` + `action.name`.
   - UI chat menampilkan action result card untuk transaksi tercatat/undo, lengkap nominal dan kategori.
   - Targeted ESLint chat pass dengan warning existing saja.
   - E2E chat quick action pass: kirim `makan 20rb` -> action card muncul -> undo -> undo result card muncul.

6. **Phase 2.2 Recurring Transaction Intelligence**
   - Tambah detector pola transaksi rutin 180 hari terakhir di `src/backend/services/recurring-detector.ts`.
   - Tambah operasi recurring basic di `src/backend/db/operations/recurring-operations.ts`.
   - Tambah API `/api/recurring/suggestions` dan `/api/recurring/from-pattern`.
   - Dashboard card `RecurringSuggestionsCard` menampilkan saran dan bisa membuat recurring dari pattern.
   - Tambah `recurring_suggestion_states` + migration `drizzle/0008_recurring_suggestion_states.sql` untuk status `accepted`/`dismissed`.
   - `GET /api/recurring/suggestions` otomatis dedupe suggestion yang sudah accepted/dismissed.
   - `POST /api/recurring/from-pattern` sekarang menandai pattern sebagai `accepted`.
   - Tambah `POST /api/recurring/dismiss-suggestion` dan tombol sembunyikan di widget.
   - Targeted ESLint pass untuk file recurring API/service/widget.
   - E2E smoke pass: onboarding regression + Quick Add + `/api/recurring/suggestions` success array.

7. **Phase 2.3 Offline-First Sync Enhancement**
   - `npm run db:migrate` sudah di-harden lewat `scripts/apply-sqlite-migrations.ts` agar migration SQL manual `0000`-`0009` bisa diterapkan berurutan dan tracked via `__monev_sql_migrations`.
   - Fresh DB sanity pass: `DATABASE_URL=/tmp/... npm run db:migrate` berhasil apply `0000` sampai `0009`.
   - Tambah schema/migration `sync_queue` dan `sync_conflicts` di `drizzle/0009_offline_sync_queue.sql`.
   - Tambah operasi sync queue/status/process/resolve conflict di `src/backend/db/operations/sync-operations.ts`.
   - Tambah API `GET /api/sync/status`, `POST /api/sync/process`, dan `POST /api/sync/resolve-conflict`.
   - Tambah UI `SyncStatusBadge` dan placeholder `ConflictResolutionModal`, dipasang di `ClientLayout`.
   - `POST /api/sync/process` sekarang memproses mutation `transaction` untuk operasi `create`, `update`, dan `delete` lewat transaction operations existing.
   - E2E sync transaction pass: enqueue offline expense via `/api/sync/process`, expense stats naik, dan `/api/sync/status` mencatat synced mutation.
   - Targeted ESLint pass untuk migration runner, sync API/operations, UI sync components, dan onboarding E2E spec.
   - Full regression pass: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed.

8. **Phase 3.1 Gamification & Achievements**
   - Harden achievement engine di `src/backend/db/operations/gamification-operations.ts` dengan default definitions, auto-seed/upsert, progress calculation, dan auto-unlock berdasarkan transaksi/streak.
   - Tambah unique index `idx_user_achievements_user_achievement_unique` di schema dan migration `drizzle/0010_gamification_hardening.sql` untuk mencegah duplicate unlock.
   - Tambah API `GET /api/achievements/progress` yang mengevaluasi unlock lalu mengembalikan progress semua achievement.
   - E2E smoke pass: setelah transaksi dibuat, `/api/achievements/progress` mengembalikan `first_tx` unlocked 100% dan `/api/streaks` current streak >= 1.
   - Migration existing DB pass dan fresh DB sanity pass sampai `0010`.
   - Targeted ESLint pass untuk gamification operations, schema, progress API, dan onboarding spec.
   - Full regression pass: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed.

9. **Phase 3.2 Split Bill 2.0 foundation**
   - Tambah schema/migration `split_bills`, `split_bill_items`, dan `split_bill_participants` di `drizzle/0011_split_bill_2.sql`.
   - Tambah operasi DB `src/backend/db/operations/split-bill-operations.ts` untuk create/list/detail public bill dan mark participant paid.
   - Tambah API authenticated `GET/POST /api/split-bills` dan `GET /api/split-bills/[id]`.
   - Tambah API public `GET/POST /api/public/split-bills/[publicId]` untuk shareable bill dan konfirmasi bayar per participant token.
   - E2E smoke pass: create split bill Rp 70.000, validasi 2 participant masing-masing Rp 35.000, public detail accessible, dan mark paid mengubah status ke `partial`.
   - Existing `SplitBillFlow` ternyata sudah ada di form transaksi dan API legacy `/api/split-bill`; flow ini sekarang di-wire ke API baru `/api/split-bills` agar share link memakai `publicId` + `paymentToken`.
   - Tambah public page `src/app/split-bills/[publicId]/page.tsx` untuk detail tagihan, bagian peserta, copy link, dan tombol `Saya Sudah Bayar`.
   - Tambah list/card Split Bill 2.0 aktif di `src/app/(protected)/debts/page.tsx`, mengambil data dari `/api/split-bills`, menampilkan total aktif, status, tombol buka, dan salin link.
   - `npm run db:migrate` pass dan apply migration `0011_split_bill_2.sql`; targeted ESLint split bill/debts files + onboarding spec pass dengan warning existing `no-explicit-any` di debts page.
   - Full regression pass terbaru: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed (2.0m).

10. **Phase 3.3 Advanced Analytics - Spending Heatmap foundation**
   - Tambah API `GET /api/analytics/heatmap` untuk agregasi pengeluaran harian per bulan berdasarkan transaksi user.
   - Tambah komponen `SpendingHeatmapPanel` di `src/app/(protected)/analytics/components/SpendingHeatmap.tsx` dengan ringkasan total, hari aktif, tertinggi, dan grid intensitas harian.
   - Tab Analytics sekarang punya tab `Heatmap` yang membuka visualisasi baru tanpa mengganggu chart trends existing.
   - E2E smoke menavigasi ke `/analytics?tab=heatmap` dan memvalidasi panel `Pola pengeluaran harian` tampil.
   - Targeted ESLint pass untuk heatmap API/UI/spec dengan warning existing di analytics page.
   - Full regression pass terbaru: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed (1.1m).

11. **Phase 3.3 Advanced Analytics - Cashflow Forecast foundation**
   - Audit: category anomaly sudah ada di `getSpendingPatterns`/`TrendsTab` dan AI anomaly endpoint `POST /api/ai/analyze-anomalies`; cashflow forecast belum ada.
   - Tambah API `GET /api/analytics/forecast` untuk forecast 3 bulan ke depan dari rata-rata income/expense 6 bulan terakhir.
   - Tambah komponen `CashflowForecast` di `src/app/(protected)/analytics/components/CashflowForecast.tsx` dengan summary trend, rata-rata income/expense/balance, dan proyeksi 3 bulan.
   - Tab Analytics sekarang punya tab `Forecast` dan support `/analytics?tab=forecast`.
   - E2E smoke menavigasi ke `/analytics?tab=forecast` dan memvalidasi panel `Prediksi 3 bulan ke depan` tampil.
   - Targeted ESLint pass untuk forecast API/UI/spec dengan warning existing di analytics page.
   - Full regression pass terbaru: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed (2.1m).

12. **Phase 3.3 Advanced Visualization - Category Trend foundation**
   - Audit advanced visualization: Sankey sudah ada di `SankeyFlowChart`, pie/distribution sudah ada di `EnhancedCharts`, heatmap dan forecast sudah ditambahkan; category trend belum ada endpoint/UI dedicated.
   - Tambah API `GET /api/analytics/category-trend` untuk top 5 kategori expense selama 6 bulan, arah tren, persentase perubahan, rata-rata, dan forecast bulan depan.
   - Tambah komponen `CategoryTrendChart` di `src/app/(protected)/analytics/components/CategoryTrendChart.tsx` dengan multi-line chart Recharts dan ringkasan per kategori.
   - Tab Analytics sekarang punya tab `Tren Kategori` dan support `/analytics?tab=category-trend`.
   - E2E smoke menavigasi ke `/analytics?tab=category-trend` dan memvalidasi panel `Tren kategori 6 bulan` tampil.
   - Targeted ESLint pass untuk category trend API/UI/spec dengan warning existing di analytics page.
   - Full regression pass terbaru: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed (1.4m).

13. **Phase 4.1 Performance Optimization - Dashboard widget lazy loading**
   - Audit Phase 4: dashboard masih import banyak widget berat secara eager; transaksi list belum virtualized dan dependency `react-window` belum tersedia.
   - Tambah dynamic import untuk widget dashboard sekunder: Health Score, Bill Reminder, Smart Notification, Quick Add, Recurring Suggestions, AI Insight, Features, dan Recent Transactions.
   - Tambah lightweight `WidgetSkeleton` agar first render tetap cepat dan layout tidak lompat saat chunk widget dimuat.
   - Hero balance/header/quick stats tetap eager supaya konten utama dashboard langsung tampil.
   - Targeted ESLint pass untuk `src/app/(protected)/dashboard/page.tsx`.
   - Full regression pass terbaru: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed (2.0m).

14. **Phase 4.1 Performance Optimization - Transaction list incremental rendering**
   - Audit transaksi: list sudah infinite-scroll server/page-level, tapi tiap page/group yang sudah dimuat tetap dirender semua sekaligus di client.
   - Tambah incremental group rendering di `src/app/(protected)/transactions/components/TransactionList.tsx`: render awal 8 group tanggal, tombol `Tampilkan transaksi lainnya` membuka 8 group berikutnya.
   - Infinite scroll sentinel baru aktif setelah group client yang tersembunyi habis, sehingga request page berikutnya tidak dipicu sebelum DOM batch saat ini selesai ditampilkan.
   - Tidak menambah dependency baru (`react-window`) agar aman di lingkungan tanpa install tambahan.
   - Targeted ESLint pass untuk `TransactionList.tsx`.
   - Full regression pass terbaru: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed (1.4m).

15. **Phase 4.1 Performance Optimization - Chat image rendering**
   - Audit image usage: landing/pricing/onboarding/profile/dashboard sudah memakai `next/image`; area chat masih memakai `<img>` untuk preview dan bubble gambar.
   - Konversi gambar chat selected preview dan message bubble ke `next/image` dengan ukuran eksplisit (`sizes`) dan container fixed agar layout shift lebih kecil.
   - Tambah `unoptimized` untuk data URL/upload preview supaya Next tidak mencoba optimasi source lokal/base64 yang dinamis.
   - Targeted ESLint pass untuk `src/app/(protected)/chat/page.tsx` dengan warning existing lama saja.
   - Full regression pass terbaru: `BASE_URL=http://localhost:3001 npx playwright test tests/onboarding.spec.ts --project=login --workers=1` -> 2 passed (1.3m).

16. **Phase 4.1 Performance Optimization - Service worker aggressive caching**
   - Audit PWA: `push-sw.js` sudah terdaftar global dan handle push/offline, tapi caching masih network-first tunggal; `sw.js` legacy tidak menjadi jalur utama.
   - Harden `public/push-sw.js` dengan cache terpisah: static, page/navigation, image, dan runtime.
   - Tambah strategy: navigation network-first dengan cache/offline fallback, static cache-first, image/runtime stale-while-revalidate, skip `/api/*` dan auth route agar data sensitif/dinamis tidak stale.
   - Tambah cache trimming untuk membatasi ukuran cache runtime/image/page.
   - Tambah route offline fallback `src/app/offline/page.tsx` untuk pengalaman offline yang jelas.
   - Validasi: `node --check public/push-sw.js`, ESLint offline page pass, full regression sempat gagal karena dev server stale lalu restart; rerun pass `2 passed (1.4m)`.

17. **Phase 4.2 Accessibility Improvements - Navigation/action focus baseline**
   - Audit aksesibilitas high-traffic: bottom nav sudah punya label dasar, tapi belum punya `aria-current` dan focus ring eksplisit; beberapa icon-only action masih kurang descriptive label/focus state.
   - Tambah `aria-current="page"` dan focus-visible ring untuk link bottom navigation aktif serta FAB tambah transaksi.
   - Tambah accessible label dan focus-visible ring untuk link profil/header notifikasi dashboard, termasuk label dinamis jumlah notifikasi belum dibaca.
   - Tambah `aria-label` dan focus ring untuk tombol regenerasi profil psikologi keuangan di profile page.
   - Targeted ESLint pass untuk file terkait dengan warning existing lama saja; full regression pass `2 passed (1.2m)`.

18. **Phase 4.2 Accessibility Improvements - Notification modal semantics**
   - Audit modal/sheet: beberapa modal sudah punya role dialog/Escape handling, tapi `NotificationsModal` belum punya dialog semantics, focus restore, Escape close, dan label icon-only yang lengkap.
   - `src/frontend/components/modals/NotificationsModal.tsx` sekarang memakai `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, fokus awal ke tombol tutup, restore fokus ke pemicu saat modal ditutup, dan Escape close.
   - Tombol mark-as-read dan close ditambah `aria-label`, focus-visible ring, serta icon decorative diberi `aria-hidden`; typing icon config juga di-hardening dari `any` ke `LucideIcon`.
   - E2E onboarding smoke menvalidasi modal Notifikasi bisa dibuka via accessible name dan ditutup dengan Escape.
   - Targeted ESLint pass untuk modal/spec; full regression pass `2 passed (1.8m)`.

19. **Phase 4.2 Accessibility Improvements - Add transaction sheet and confirm dialog focus trap**
   - `AddTransactionSheet` sekarang menyimpan fokus pemicu, fokus awal ke pilihan input pertama, restore fokus saat tutup, trap Tab di area sheet, dan punya `aria-describedby` untuk instruksi sheet.
   - Tombol close/action di sheet ditambah focus-visible ring dan icon decorative diberi `aria-hidden`; label locked action dilokalkan ke Indonesia.
   - `ConfirmDialog` sekarang fokus awal ke tombol batal, restore fokus saat tutup, trap Tab antar tombol aksi, serta menambah focus-visible ring untuk tombol konfirmasi/batal.
   - E2E smoke menvalidasi sheet `Tambah Transaksi` bisa dibuka lewat FAB dan ditutup dengan Escape.
   - Targeted ESLint pass untuk sheet/dialog/spec; full regression pass `2 passed (2.2m)`.

20. **Phase 4.2 Accessibility Improvements - Detail modal keyboard/focus consistency**
   - `TransactionDetailModal` sekarang punya `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape close, fokus awal ke tombol tutup, restore fokus ke pemicu, dan trap Tab antar tombol tutup/edit/hapus.
   - `BudgetDetailModal` ditingkatkan dengan pola fokus yang sama: fokus awal ke close, restore fokus, trap Tab, serta focus-visible ring untuk tombol close/edit/hapus.
   - Icon dekoratif di detail transaksi/budget diberi `aria-hidden` supaya screen reader tidak membaca ikon berulang.
   - Targeted ESLint pass untuk detail modal terkait dengan warning existing `react-hooks/set-state-in-effect` di helper Portal; full regression pass `2 passed (1.8m)`.

21. **Phase 4.2 Accessibility Improvements - Goal/Bill/PayBill modal consistency**
   - `GoalDetailModal` sekarang punya fokus awal ke close, restore fokus, trap Tab antar tombol close/edit/hapus, focus-visible ring, dan decorative icon `aria-hidden`.
   - `BillHistoryModal` sekarang restore fokus, fokus awal ke close, Escape close, dan menjaga Tab tetap di modal riwayat pembayaran.
   - `PayBillModal` sekarang punya `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, fokus awal ke input nominal, restore fokus, Escape close saat tidak submitting, dan trap Tab di kontrol utama.
   - Tombol close/account/Bayar Lunas/Batal/submit di Pay Bill ditambah focus-visible ring; icon dekoratif diberi `aria-hidden` dan input nominal punya `aria-label`.
   - Targeted ESLint pass untuk modal terkait dengan warning existing di helper Portal/loadHistory; full regression pass `2 passed (1.1m)`.

22. Next: lanjut Phase 4.2 admin modal accessibility atau Phase 4.3 security hardening.
