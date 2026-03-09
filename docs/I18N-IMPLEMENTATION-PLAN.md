# 📋 MONEV I18N IMPLEMENTATION PLAN

## Executive Summary

Complete internationalization (i18n) implementation for Monev finance app to support both Indonesian (id) and English (en) languages across all pages and components.

---

## 🎯 Objectives

| Goal | Target | Priority |
|------|--------|----------|
| **100% Translation Coverage** | All user-facing text translatable | P0 |
| **Zero Hardcoded Text** | Remove all hardcoded strings | P0 |
| **Consistent Key Naming** | Follow naming convention | P1 |
| **No Breaking Changes** | Maintain existing functionality | P0 |

---

## 📊 Current Status

### ✅ Completed (Phase 1)
- [x] i18n infrastructure setup (i18n-context.tsx)
- [x] Core navigation translations
- [x] Profile page (100% complete)
- [x] Dashboard page (90% complete)
- [x] Common UI components (buttons, labels)
- [x] Profile menu items and modals

### 🔄 In Progress (Phase 2)
- [ ] Transactions page
- [ ] Analytics page
- [ ] Budgets page
- [ ] Bills page
- [ ] Savings/Goals page

### ⏳ Pending (Phase 3)
- [ ] Investments page
- [ ] Chat AI page
- [ ] Balances/Saldo page
- [ ] All modal dialogs
- [ ] Error messages & validation
- [ ] Email templates
- [ ] Push notifications

---

## 📁 File-by-File Implementation Plan

### Phase 2: Core Pages (Week 1-2)

#### 1. Transactions Page
**File:** `src/app/(protected)/transactions/page.tsx`

| Task | Estimated Effort | Priority |
|------|-----------------|----------|
| Add translation keys to i18n-context | 30 min | P0 |
| Replace page title & headers | 15 min | P0 |
| Replace search/filter labels | 20 min | P0 |
| Replace empty states | 15 min | P0 |
| Replace toast messages | 20 min | P0 |
| Replace action buttons | 15 min | P0 |
| Update filter modal | 45 min | P1 |
| Replace date formatting | 30 min | P1 |
| **Total** | **3 hours** | |

**Translation Keys Needed:**
```typescript
"transactions.noResults": "Tidak ada hasil pencarian" / "No search results"
"transactions.deleteConfirm": "Yakin hapus transaksi ini?" / "Delete this transaction?"
"transactions.deleteSuccess": "Transaksi dihapus" / "Transaction deleted"
"transactions.editSuccess": "Transaksi diperbarui" / "Transaction updated"
"transactions.exportCSV": "Export CSV" / "Export CSV"
"transactions.exportExcel": "Export Excel" / "Export Excel"
"transactions.bulkDelete": "Hapus Terpilih" / "Delete Selected"
// ... (approximately 40 keys)
```

---

#### 2. Analytics Page
**File:** `src/app/(protected)/analytics/page.tsx`

| Task | Estimated Effort | Priority |
|------|-----------------|----------|
| Add translation keys | 30 min | P0 |
| Tab labels (Overview/Trends/Insights) | 15 min | P0 |
| Chart labels & tooltips | 45 min | P0 |
| Category breakdown labels | 20 min | P0 |
| Month comparison text | 20 min | P0 |
| AI insights text | 30 min | P1 |
| Empty states | 15 min | P0 |
| **Total** | **2.5 hours** | |

**Translation Keys Needed:**
```typescript
"analytics.noData": "Belum ada data" / "No data yet"
"analytics.vsLastMonth": "vs bulan lalu" / "vs last month"
"analytics.totalIncome": "Total Pemasukan" / "Total Income"
"analytics.totalExpense": "Total Pengeluaran" / "Total Expense"
"analytics.netSavings": "Tabungan Bersih" / "Net Savings"
"analytics.topSpendingCategory": "Kategori Pengeluaran Terbanyak" / "Top Spending Category"
// ... (approximately 35 keys)
```

---

#### 3. Budgets Page
**File:** `src/app/(protected)/budgets/page.tsx`

| Task | Estimated Effort | Priority |
|------|-----------------|----------|
| Add translation keys | 30 min | P0 |
| Page title & subtitle | 10 min | P0 |
| Budget progress labels | 20 min | P0 |
| Template names & descriptions | 30 min | P0 |
| Add/Edit budget modal | 45 min | P0 |
| Validation messages | 20 min | P0 |
| Success/Error toasts | 15 min | P0 |
| Delete confirmation | 10 min | P0 |
| **Total** | **3 hours** | |

**Translation Keys Needed:**
```typescript
"budgets.addBudget": "Tambah Anggaran" / "Add Budget"
"budgets.editBudget": "Edit Anggaran" / "Edit Budget"
"budgets.selectCategory": "Pilih Kategori" / "Select Category"
"budgets.budgetAmount": "Nominal Budget" / "Budget Amount"
"budgets.rolloverEnabled": "Rollover Aktif" / "Rollover Enabled"
"budgets.templateApplied": "Template berhasil diterapkan" / "Template applied successfully"
// ... (approximately 45 keys)
```

---

#### 4. Bills Page
**File:** `src/app/(protected)/bills/page.tsx`

| Task | Estimated Effort | Priority |
|------|-----------------|----------|
| Add translation keys | 30 min | P0 |
| Page title & filters | 15 min | P0 |
| Bill status labels | 15 min | P0 |
| Add/Edit bill modal | 45 min | P0 |
| Frequency options | 15 min | P0 |
| Mark as paid/unpaid | 15 min | P0 |
| Reminder settings | 20 min | P1 |
| Template section | 20 min | P1 |
| **Total** | **2.5 hours** | |

**Translation Keys Needed:**
```typescript
"bills.addBill": "Tambah Tagihan" / "Add Bill"
"bills.markPaid": "Tandai Lunas" / "Mark as Paid"
"bills.dueDate": "Jatuh Tempo" / "Due Date"
"bills.daysLeft": "hari lagi" / "days left"
"bills.overdue": "Terlambat" / "Overdue"
"bills.recurring": "Berulang" / "Recurring"
// ... (approximately 40 keys)
```

---

#### 5. Savings/Goals Page
**File:** `src/app/(protected)/savings/page.tsx`

| Task | Estimated Effort | Priority |
|------|-----------------|----------|
| Add translation keys | 30 min | P0 |
| Page title & stats | 15 min | P0 |
| Goal progress labels | 20 min | P0 |
| Add/Edit goal modal | 40 min | P0 |
| Deposit/Withdraw actions | 20 min | P0 |
| Completion messages | 15 min | P0 |
| Empty states | 10 min | P0 |
| **Total** | **2.5 hours** | |

**Translation Keys Needed:**
```typescript
"savings.addGoal": "Tambah Goals" / "Add Goal"
"savings.targetAmount": "Target Nominal" / "Target Amount"
"savings.currentProgress": "Progress Saat Ini" / "Current Progress"
"savings.deposit": "Setor" / "Deposit"
"savings.withdraw": "Tarik" / "Withdraw"
"savings.goalCompleted": "Goals Selesai!" / "Goal Completed!"
// ... (approximately 35 keys)
```

---

#### 6. Balances/Saldo Page
**File:** `src/app/(protected)/saldo/page.tsx`

| Task | Estimated Effort | Priority |
|------|-----------------|----------|
| Add translation keys | 30 min | P0 |
| Page title & net worth | 15 min | P0 |
| Account type labels | 20 min | P0 |
| Add account modal | 40 min | P0 |
| Account list/group view | 20 min | P0 |
| Edit/Delete actions | 15 min | P0 |
| Quick add presets | 20 min | P1 |
| **Total** | **2.5 hours** | |

---

### Phase 3: Secondary Pages (Week 3)

#### 7. Investments Page
**File:** `src/app/(protected)/investments/page.tsx`
- **Estimated Effort:** 2 hours
- **Keys Needed:** ~30 keys

#### 8. Chat AI Page
**File:** `src/app/(protected)/chat/page.tsx`
- **Estimated Effort:** 1.5 hours
- **Keys Needed:** ~20 keys

#### 9. All Modal Components
**Files:** Various modal components
- **Estimated Effort:** 4 hours
- **Keys Needed:** ~60 keys

---

### Phase 4: System-Wide (Week 4)

#### 10. Error Messages & Validation
**Files:** All form validation, API error handlers
- **Estimated Effort:** 3 hours
- **Keys Needed:** ~50 keys

#### 11. Email Templates
**Files:** Email notification templates
- **Estimated Effort:** 2 hours
- **Keys Needed:** ~25 keys

#### 12. Push Notifications
**Files:** Push notification handlers
- **Estimated Effort:** 1.5 hours
- **Keys Needed:** ~15 keys

---

## 🛠️ Technical Implementation Guide

### Step 1: Add Translation Keys

For each hardcoded string, add to `i18n-context.tsx`:

```typescript
// BEFORE (hardcoded)
<p className="text-lg">Pengeluaran melebihi pemasukan!</p>

// AFTER (translated)
<p className="text-lg">{t("dashboard.expenseExceedsIncome")}</p>
```

### Step 2: Handle Dynamic Values

For strings with variables, use template replacement:

```typescript
// i18n-context.tsx
"dashboard.expensePercentage": "Pengeluaran sudah {percentage}% dari pemasukan!"

// Component
{t("dashboard.expensePercentage").replace("{percentage}", String(percentage))}
```

### Step 3: Naming Convention

```
[page/feature].[section].[element]

Examples:
- dashboard.expenseWarning.title
- transactions.delete.confirm
- profile.menu.accountSettings
- bills.status.overdue
```

### Step 4: Testing Checklist

For each page, verify:
- [ ] Switch to English - all text updates
- [ ] Switch to Indonesian - all text updates
- [ ] Dynamic values render correctly
- [ ] No missing keys (fallback to Indonesian works)
- [ ] Toast messages translated
- [ ] Modal dialogs translated
- [ ] Error messages translated

---

## 📈 Progress Tracking

### Key Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Pages Fully Translated | 2/12 | 12/12 | 🟡 17% |
| Translation Keys | ~150 | ~500 | 🟡 30% |
| Hardcoded Strings Removed | ~50 | ~600 | 🔴 8% |
| Components Using i18n | 15/80 | 80/80 | 🔴 19% |

### Weekly Goals

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Core Pages | Transactions, Analytics, Budgets |
| **Week 2** | Financial Pages | Bills, Savings, Balances |
| **Week 3** | Secondary Pages | Investments, Chat, Modals |
| **Week 4** | System-Wide | Errors, Emails, Notifications |
| **Week 5** | Testing & Polish | QA, bug fixes, edge cases |

---

## 🚀 Quick Start for Developers

### For New Pages/Components

```typescript
// 1. Import useI18n
import { useI18n } from "@/frontend/lib/i18n-context";

// 2. Get t function
const { t } = useI18n();

// 3. Use t() for all text
<h1>{t("page.title")}</h1>
<button>{t("common.save")}</button>
```

### Adding New Translation Keys

```typescript
// src/frontend/lib/i18n-context.tsx

// Indonesian (id section)
"page.newFeature.title": "Judul Fitur Baru",

// English (en section)  
"page.newFeature.title": "New Feature Title",
```

---

## ⚠️ Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing translations | Medium | Fallback to Indonesian (already implemented) |
| Broken dynamic values | High | Test all template replacements |
| Performance impact | Low | Translations are loaded once, cached |
| Inconsistent naming | Medium | Follow naming convention strictly |
| Regression bugs | High | Test each page after changes |

---

## ✅ Definition of Done

A page is considered "fully translated" when:
- [ ] All visible text uses `t()` function
- [ ] All toast/notifications translated
- [ ] All modal dialogs translated
- [ ] All error messages translated
- [ ] All placeholder text translated
- [ ] All aria-labels translated
- [ ] Dynamic values work in both languages
- [ ] Tested in both languages
- [ ] No hardcoded Indonesian strings remain

---

## 📞 Support & Resources

- **i18n Context:** `src/frontend/lib/i18n-context.tsx`
- **Example Implementation:** Profile page, Dashboard page
- **Translation Keys Pattern:** `[feature].[section].[element]`
- **Fallback Behavior:** Missing keys → Indonesian → key name

---

**Total Estimated Effort:** 25-30 hours  
**Timeline:** 4-5 weeks  
**Priority:** P0 (Critical for international users)

---

**📅 Next Review:** End of Week 1  
**👤 Owner:** Development Team  
**📊 Status:** In Progress

---

**Last Updated:** March 9, 2026  
**Version:** 1.0  
**Author:** AI Development Team
