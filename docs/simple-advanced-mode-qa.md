# Simple/Advanced Mode QA

## Smoke Checks

- New user completes onboarding and lands on Simple Mode by default when `Sederhana` is selected.
- New user selecting `Lengkap` lands with Advanced menu after onboarding.
- Existing user with no explicit setting remains Advanced because DB default is `advanced`.
- Profile mode toggle persists after reload and syncs menu/dashboard.
- Simple mode BottomNav shows only Beranda, Transaksi, and Profil.
- Simple Dashboard shows focused sections only: hero, quick add, monthly summary, budget snapshot when available, and recent transactions.
- `+ Pengeluaran` opens the transaction form with expense selected.
- `+ Pemasukan` opens the transaction form with income selected.
- Advanced routes opened from Simple Mode show the mode prompt.
- `Lihat halaman ini saja` opens the requested advanced page without changing saved mode.
- `Aktifkan Advanced Mode` switches saved mode and reveals full navigation.
- `Tetap di Mode Sederhana` returns to `/dashboard`.

## Route Matrix

Simple-mode core routes:

- `/dashboard`
- `/transactions`
- `/profile`
- `/fitur/upgrade`

Advanced prompt routes:

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

## Product Events

Expected events:

- `view_mode_selected` after onboarding mode selection is saved.
- `view_mode_changed` when Profile or prompt changes the mode.
- `simple_dashboard_viewed` when Simple Dashboard renders.
- `advanced_feature_prompt_viewed` when simple user opens advanced route.
- `advanced_feature_prompt_accepted` when user activates Advanced Mode from prompt.
- `advanced_feature_prompt_dismissed` when user views once or returns to simple.

## Mobile QA

- Check 360px width for onboarding mode choice, simple dashboard hero, quick add buttons, and advanced prompt.
- Verify floating add button does not cover BottomNav actions.
- Verify dark mode contrast for prompt, empty states, and quick add cards.
