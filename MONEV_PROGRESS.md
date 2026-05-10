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

2. Review/hardening duplikasi data jika user menjalankan onboarding ulang dengan akun yang sama.
