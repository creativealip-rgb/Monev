# Monev Improvement V2 - Full Refactor

> **Scope:** Full Refactor (Backend + Frontend + Optimization)  
> **Timeline:** 8 minggu  
> **Approach:** Parallel (semua phase dikerjakan bersamaan)  
> **Testing:** Manual  
> **Team:** Solo + AI

---

## Ringkasan

Improvement V2 adalah refactor menyeluruh untuk meningkatkan:
- **Security** - Fix vulnerabilities dan proper error handling
- **Maintainability** - Split God object dan large components
- **Performance** - Optimize bundle size dan loading times
- **Type Safety** - Remove `any` types dan proper TypeScript

---

## Strategy Parallel

Karena solo + AI, kita kerjakan multiple workstreams secara bersamaan:

```
Week 1-2: Backend Refactor (Security + DB Split + Constants)
Week 3-4: Frontend Refactor (Components + Pages + Hooks)
Week 5-6: Optimization (Logger + Dynamic Imports + Polish)
Week 7-8: Testing & Bug Fixes (Manual testing + Performance tuning)
```

---

## Phase A: Backend Refactor (Week 1-2)

### A1. Split Database Operations

**File Target:** `src/backend/db/operations.ts` (2213 lines)

**Struktur Baru:**
```
src/backend/db/
├── operations/
│   ├── index.ts                    # Re-export semua operations
│   ├── transaction-operations.ts   # ~300 lines
│   ├── budget-operations.ts        # ~250 lines
│   ├── goal-operations.ts          # ~200 lines
│   ├── bill-operations.ts          # ~200 lines
│   ├── investment-operations.ts    # ~180 lines
│   ├── user-operations.ts          # ~200 lines
│   └── gamification-operations.ts  # ~150 lines
└── utils/
    ├── query-builders.ts
    └── validators.ts
```

**Tasks:**
- [ ] Extract transaction operations
- [ ] Extract budget operations
- [ ] Extract goal operations
- [ ] Extract bill operations
- [ ] Extract investment operations
- [ ] Extract user operations
- [ ] Extract gamification operations
- [ ] Update all imports across codebase (40+ files)

---

### A2. Security Fixes

#### SQL Injection Fix
**File:** `src/backend/db/operations.ts` (searchTransactions)

```typescript
// BEFORE (Vulnerable):
sql`(${transactions.description} LIKE ${'%' + search + '%'})`

// AFTER (Safe):
import { like, or } from "drizzle-orm";
or(
    like(transactions.description, `%${search}%`),
    like(transactions.merchantName, `%${search}%`)
)
```

#### Remove `any` Types
**Files:**
- `src/app/api/chat/route.ts` (4 locations)
- `src/lib/importers/csv-parser.ts`
- `src/lib/usage-tracker.ts`
- `src/lib/importer.ts`

#### Proper Error Handling
```typescript
// BEFORE (Silent failure):
updateUserStreak(userId).catch(console.error);

// AFTER:
try {
    await updateUserStreak(userId);
} catch (error) {
    logger.error("Failed to update streak", error);
    throw error;
}
```

---

### A3. Utilities

#### Centralize Constants
**File:** `src/lib/constants.ts`

```typescript
export const PAGINATION = {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 500
};

export const ANALYSIS = {
    DEFAULT_MONTHS_BACK: 3,
    TREND_THRESHOLD_PERCENTAGE: 15
};

export const BUDGET_RULES = {
    NEEDS: 0.5,
    WANTS: 0.3,
    SAVINGS: 0.2
};

export const DATE_FORMATS = {
    LOCALE: 'id-ID',
    CURRENCY: 'IDR',
    DISPLAY_DATE: 'dd MMMM yyyy'
};
```

#### Create Logger Utility
**File:** `src/lib/logger.ts`

```typescript
export const logger = {
    debug: (...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(...args);
        }
    },
    error: (message: string, error: Error) => {
        console.error(message, error);
        // Extend dengan error tracking service
    },
    info: (message: string) => {
        console.log(message);
    }
};
```

**Replace 372+ console.log statements**

---

## Phase B: Frontend Refactor (Week 3-4)

### B1. Split Large Components

#### TransactionForm.tsx (754 lines)
```
src/frontend/components/TransactionForm/
├── index.tsx                    # Main form (~300 lines)
├── sections/
│   ├── AmountSection.tsx        # Amount input
│   ├── CategorySection.tsx      # Category selector
│   ├── AccountSection.tsx       # Account selector
│   └── DateSection.tsx          # Date picker
└── hooks/
    └── useTransactionForm.ts    # Form logic
```

#### DetailModalsVerified.tsx (700+ lines)
```
src/frontend/components/modals/
├── TransactionDetailModal.tsx
├── BudgetDetailModal.tsx
├── GoalDetailModal.tsx
└── BillDetailModal.tsx
```

---

### B2. Split Large Pages

#### transactions/page.tsx (1129 lines)
```
src/app/(protected)/transactions/
├── page.tsx                          # Main page (~300 lines)
├── components/
│   ├── TransactionList.tsx           # List + virtual scroll
│   ├── TransactionFilters.tsx        # Filter sidebar/chips
│   ├── TransactionActions.tsx        # Bulk actions toolbar
│   ├── ImportCSVButton.tsx           # Import flow
│   └── DeleteConfirmation.tsx        # Delete modal
├── hooks/
│   ├── useTransactionFilters.ts      # Filter logic
│   ├── useTransactionActions.ts      # Bulk actions
│   └── useTransactionExport.ts       # Export logic
└── types/
    └── transaction.ts                # Shared types
```

#### dashboard/page.tsx (515 lines)
```
src/app/(protected)/dashboard/
├── page.tsx
├── components/
│   ├── widgets/
│   │   ├── HeroBalanceWidget.tsx
│   │   ├── QuickStatsWidget.tsx
│   │   ├── RecentTransactionsWidget.tsx
│   │   ├── BudgetOverviewWidget.tsx
│   │   └── AIInsightWidget.tsx
│   └── modals/
│       ├── TransferModal.tsx
│       └── OnboardingModal.tsx
└── hooks/
    └── useDashboardStats.ts
```

---

## Phase C: Optimization (Week 5-6)

### C1. Create Shared Hooks

#### Event Listener Hook
**File:** `src/frontend/hooks/useTransactionEvents.ts`

```typescript
export function useTransactionEvents(callback: () => void) {
    useEffect(() => {
        window.addEventListener("transactionAdded", callback);
        return () => window.removeEventListener("transactionAdded", callback);
    }, [callback]);
}
```

#### Date Range Hook
**File:** `src/frontend/hooks/useDateRange.ts`

```typescript
export function useMonthDateRange(year: number, month: number) {
    return useMemo(() => ({
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0, 23, 59, 59, 999)
    }), [year, month]);
}
```

### C2. Validation Schemas
**File:** `src/lib/validation-schemas.ts`

```typescript
import { z } from "zod";

export const CreateTransactionSchema = z.object({
    amount: z.number().positive(),
    description: z.string().min(1).max(255),
    categoryId: z.number().optional(),
    type: z.enum(["income", "expense"]),
    date: z.date()
});
```

### C3. Performance Optimization
- Dynamic imports untuk icons (lucide-react)
- Optimize bundle size
- Proper loading states
- Memoization untuk expensive calculations

---

## Phase D: Testing & Bug Fixes (Week 7-8)

### D1. Manual Testing Checklist

#### Core Features
- [ ] Login/Register masih berfungsi
- [ ] CRUD transaksi normal
- [ ] Search transaksi (SQL injection fix)
- [ ] Filter transaksi
- [ ] Budget operations (create, update, rollover)
- [ ] Goals operations (create, update, auto-transfer)
- [ ] Bills operations (create, pay, partial payment)
- [ ] Investments operations (add, update, P&L calc)

#### AI Features
- [ ] AI chat (type safety)
- [ ] AI insights (anomaly detection)
- [ ] Voice input
- [ ] OCR scan receipt

#### Reports & Export
- [ ] Monthly report generation (PDF with charts)
- [ ] Weekly insight (Telegram)
- [ ] CSV import/export
- [ ] PDF export

#### Security
- [ ] PIN lock masih berfungsi
- [ ] Biometric auth
- [ ] Decoy PIN
- [ ] Session management

### D2. Bug Fixes
- [ ] Fix issues found during testing
- [ ] Performance tuning
- [ ] Final polish

---

## Timeline Detail (8 Minggu)

| Week | Backend (A) | Frontend (B) | Optimization (C) | Testing (D) |
|------|-------------|--------------|------------------|-------------|
| 1 | A1: DB Split | - | - | - |
| 2 | A2: Security, A3: Utils | B1: Start components | - | - |
| 3 | - | B1: Continue, B2: Start pages | - | - |
| 4 | - | B2: Finish pages | C1: Shared hooks | - |
| 5 | - | - | C2: Validation, C3: Performance | - |
| 6 | - | - | C3: Continue | - |
| 7 | - | - | - | D1: Testing |
| 8 | - | - | - | D2: Bug fixes |

**Total Estimasi:** 120 jam (15 jam/minggu)

---

## Acceptance Criteria

### Code Quality
- [ ] operations.ts: 2213 → 7 files (<300 lines each)
- [ ] transactions/page.tsx: 1129 → <500 lines
- [ ] dashboard/page.tsx: 515 → <300 lines
- [ ] TransactionForm.tsx: 754 → <400 lines
- [ ] DetailModalsVerified.tsx: split into 4 files

### Security
- [ ] Zero SQL injection vulnerabilities
- [ ] Zero `any` types in critical paths
- [ ] Proper error handling (no silent failures)
- [ ] No hardcoded secrets

### Performance
- [ ] Constants centralized
- [ ] Logger utility replacing 372+ console.log
- [ ] Dynamic imports for icons
- [ ] Shared hooks extracted

### Functionality
- [ ] All CRUD operations working
- [ ] Search & filters working
- [ ] Reports & exports working
- [ ] AI features working
- [ ] Manual testing 100% passed
- [ ] No console errors
- [ ] Build successful

---

## Risk Mitigation

### Risk 1: Breaking Changes
**Mitigation:**
- Buat branch `improvement-v2`
- Incremental refactoring (file per file)
- Test setelah setiap perubahan besar
- Backup branch ready

### Risk 2: Time Overrun
**Mitigation:**
- Parallel workstreams (solo + AI)
- Prioritize critical paths
- Daily progress tracking
- Cut scope if needed

### Risk 3: Merge Conflicts
**Mitigation:**
- Daily sync dengan `main` branch
- Clear commit messages
- Rebase regularly

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| operations.ts | 2213 lines | 7 files <300 lines |
| transactions/page.tsx | 1129 lines | <500 lines |
| TransactionForm.tsx | 754 lines | <400 lines |
| `any` types | 8 locations | 0 locations |
| console.log | 372+ | Replaced with logger |
| Test pass rate | - | 100% |
| Build time | - | Improved |
| Bundle size | - | Reduced |

---

## Catatan untuk AI Agent

1. **Satu module per hari:** Fokus kualitas, bukan kecepatan
2. **Test setelah setiap split:** Pastikan tidak ada regression
3. **Commit setiap hari:** Push ke branch improvement-v2
4. **Update todo list:** Track progress daily
5. **Prioritas:** Security > Functionality > Performance

---

## Deliverables

1. **Code Changes:**
   - 7 new database operation files
   - 15+ new component files
   - 10+ new hook files
   - Updated API routes (40+ files)
   - Security fixes
   - Constants & utilities

2. **Documentation:**
   - Updated AGENTS.md (struktur baru)
   - Code comments untuk complex logic

3. **Testing Report:**
   - Manual testing checklist completed
   - Bug fixes documented
   - Performance metrics

---

**Status:** Ready for Implementation  
**Branch:** improvement-v2  
**Last Updated:** Maret 2026
