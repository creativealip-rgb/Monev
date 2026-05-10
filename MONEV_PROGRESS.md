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
   - Tambah dashboard card `RecurringSuggestionsCard` untuk menampilkan rekomendasi dan accept menjadi transaksi rutin.
   - Targeted ESLint pass untuk file recurring API/service/widget.
   - E2E smoke pass: onboarding regression + Quick Add + `/api/recurring/suggestions` success array.

7. Next: commit/push Phase 2 slice.
