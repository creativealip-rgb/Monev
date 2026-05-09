# Onboarding V2 Design Specification

**Date:** 2026-05-09  
**Status:** Design Complete, Ready for Implementation  
**Approach:** Big Bang (all improvements shipped together)  
**Target:** Phase 1 of Improvement Plan 2026

---

## 1. Overview

### 1.1 Goals
- Reduce time-to-value for new users from 10+ minutes to <2 minutes (Quick path)
- Increase onboarding completion rate from ~60% to >80%
- Provide immediate value through demo data option
- Introduce AI-powered budget setup
- Gamify early wins with achievement system
- Support both quick and thorough onboarding paths

### 1.2 Success Metrics
- Onboarding completion rate: >80%
- Quick vs Complete split: 60/40 expected
- Demo data acceptance rate: >70%
- Budget setup completion: >60%
- Time to first transaction: <5 minutes
- 7-day retention improvement: +15%

### 1.3 Current State Assessment
**Existing onboarding (70% optimal):**
- ✅ 4 screens: Welcome → Features → QuickSetup → InitialBalance
- ✅ Smooth animations and transitions
- ✅ Basic personalization (currency, language, PIN)
- ❌ No demo data option (critical gap)
- ❌ No account setup
- ❌ No budget setup
- ❌ No achievement celebration
- ❌ Single linear path (no branching)

---

## 2. Architecture

### 2.1 Screen Flow

**New 9-screen flow:**
```
Welcome → Features → QuickSetup → ChoicePoint → [Quick Path | Complete Path] → Dashboard

Quick Path (2 min):
  ChoicePoint → DemoDataMatrix → AchievementCelebration → Dashboard

Complete Path (5 min):
  ChoicePoint → AccountSetup → InitialBalance → DemoDataMatrix → BudgetSetup → AchievementCelebration → Dashboard
```

### 2.2 Database Schema

#### New Tables

**demo_data_templates**
```typescript
{
  id: string (uuid, primary key)
  scope: 'quick' | 'standard' | 'complete'
  duration_days: number
  transaction_count: number
  template_data: json // {accounts, transactions, budgets, bills, goals, recurring}
  created_at: timestamp
  updated_at: timestamp
}
```

**achievements**
```typescript
{
  id: string (uuid, primary key)
  code: string (unique) // 'onboarding_complete', 'demo_data_loaded', etc.
  name: string
  description: string
  icon: string // emoji or icon name
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  category: 'onboarding' | 'transaction' | 'budget' | 'goal' | 'streak'
  created_at: timestamp
}
```

**user_achievements**
```typescript
{
  id: string (uuid, primary key)
  user_id: string (foreign key → users.id)
  achievement_id: string (foreign key → achievements.id)
  unlocked_at: timestamp
  progress: number // for progressive achievements
}
```

#### Extended users table
```typescript
users {
  // ... existing fields
  onboarding_version: string // 'v1', 'v2'
  onboarding_path: 'quick' | 'complete' | null
  demo_data_loaded: boolean
  demo_data_scope: 'quick' | 'standard' | 'complete' | null
}
```

### 2.3 API Endpoints

**POST /api/onboarding/demo-data**
```typescript
Request: {
  scope: 'quick' | 'standard' | 'complete'
}
Response: {
  success: boolean
  data: {
    accounts_created: number
    transactions_created: number
    budgets_created: number
    bills_created: number
  }
}
```

**POST /api/onboarding/budget-suggestion**
```typescript
Request: {
  monthly_income: number
  currency: string
}
Response: {
  success: boolean
  data: {
    needs: { total: number, categories: Array<{name, amount, percentage}> }
    wants: { total: number, categories: Array<{name, amount, percentage}> }
    savings: { total: number, categories: Array<{name, amount, percentage}> }
  }
}
```

**POST /api/onboarding/complete**
```typescript
Request: {
  path: 'quick' | 'complete'
  demo_data_scope?: 'quick' | 'standard' | 'complete'
  accounts?: Array<{name, type, balance, currency}>
  initial_balance?: number
  budget_accepted?: boolean
}
Response: {
  success: boolean
  achievements_unlocked: Array<{code, name, tier, points}>
}
```

**POST /api/achievements/unlock**
```typescript
Request: {
  achievement_code: string
}
Response: {
  success: boolean
  achievement: {id, code, name, description, icon, tier, points}
  total_points: number
  total_achievements: number
}
```

---

## 3. Component Specifications

### 3.1 ChoicePoint Component

**Purpose:** Let users choose between Quick (2 min) or Complete (5 min) onboarding path.

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Choose Your Setup Style            │
│                                      │
│  ┌───────────────┐ ┌───────────────┐│
│  │ ⚡ Quick      │ │ 🎯 Complete   ││
│  │ 2 minutes     │ │ 5 minutes     ││
│  │               │ │               ││
│  │ ✓ Demo data   │ │ ✓ Your accounts││
│  │ ✓ Achievement │ │ ✓ Initial balance││
│  │               │ │ ✓ Demo data   ││
│  │               │ │ ✓ AI budget   ││
│  │               │ │ ✓ Achievement ││
│  │               │ │               ││
│  │  [Start] →    │ │  [Start] →    ││
│  └───────────────┘ └───────────────┘│
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface ChoicePointProps {
  onSelectPath: (path: 'quick' | 'complete') => void
}
```

**Behavior:**
- Two large cards side-by-side (mobile: stacked)
- Highlight Quick path as recommended for first-time users
- Show time estimate and feature checklist
- Animate card selection with scale + shadow

---

### 3.2 AccountSetup Component

**Purpose:** Let users create multiple accounts with presets (Complete path only).

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Set Up Your Accounts                │
│                                      │
│  Choose account types:               │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │🏦  │ │💳  │ │💰  │ │📱  │       │
│  │Bank│ │Card│ │Cash│ │Wallet│      │
│  └────┘ └────┘ └────┘ └────┘       │
│                                      │
│  Selected: Bank Account              │
│  Name: [BCA Savings_____]            │
│  Balance: [Rp 5,000,000_]            │
│  [+ Add Another Account]             │
│                                      │
│  [Skip] [Continue →]                 │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface AccountSetupProps {
  currency: string
  onComplete: (accounts: Array<{name, type, balance, currency}>) => void
  onSkip: () => void
}
```

**Behavior:**
- Grid of preset account types (Bank, Card, Cash, E-Wallet)
- Multi-select with visual feedback
- For each selected type, show name + balance input
- Validate balance > 0
- Allow skip (will use demo data later)

---

### 3.3 DemoDataMatrix Component

**Purpose:** Let users choose demo data scope or skip.

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Try Monev with Sample Data          │
│                                      │
│  ┌─────────────────────────────────┐│
│  │ ⚡ Quick Start                  ││
│  │ 1 week • 15 transactions        ││
│  │ ✓ 2 accounts ✓ 1 budget         ││
│  │         [Try This] →             ││
│  └─────────────────────────────────┘│
│                                      │
│  ┌─────────────────────────────────┐│
│  │ 📊 Standard                     ││
│  │ 1 month • 30 transactions       ││
│  │ ✓ 3 accounts ✓ 3 budgets        ││
│  │ ✓ 2 bills                        ││
│  │         [Try This] →             ││
│  └─────────────────────────────────┘│
│                                      │
│  ┌─────────────────────────────────┐│
│  │ 🎯 Complete                     ││
│  │ 3 months • 50+ transactions     ││
│  │ ✓ 5 accounts ✓ Multiple budgets ││
│  │ ✓ Bills ✓ Goals ✓ Recurring     ││
│  │         [Try This] →             ││
│  └─────────────────────────────────┘│
│                                      │
│  [Skip - Start Fresh]                │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface DemoDataMatrixProps {
  path: 'quick' | 'complete'
  onSelect: (scope: 'quick' | 'standard' | 'complete') => void
  onSkip: () => void
}
```

**Behavior:**
- Show 3 preset cards with clear feature checklists
- Highlight recommended option based on path (Quick → Quick Start, Complete → Standard)
- For Quick path: demo data is mandatory (hide Skip button)
- For Complete path: allow Skip
- Animate card selection

---

### 3.4 BudgetSetup Component

**Purpose:** AI-powered budget suggestion using 50/30/20 rule (Complete path only).

**UI Layout:**

**Step 1: Income Input**
```
┌─────────────────────────────────────┐
│  Set Up Your Budget                  │
│                                      │
│  What's your monthly income?         │
│  [Rp 8,000,000_____________]         │
│                                      │
│  [Skip] [Get AI Suggestion →]        │
└─────────────────────────────────────┘
```

**Step 2: AI Suggestion**
```
┌─────────────────────────────────────┐
│  Suggested Budget (50/30/20 Rule)    │
│                                      │
│  ┌─────────────────────────────────┐│
│  │     [Pie Chart Visualization]   ││
│  │   Needs 50% | Wants 30% | Save 20%││
│  └─────────────────────────────────┘│
│                                      │
│  💰 Needs (Rp 4,000,000)             │
│  • Makanan: Rp 1,600,000 (20%)       │
│  • Transport: Rp 1,200,000 (15%)     │
│  • Tagihan: Rp 800,000 (10%)         │
│  • Kesehatan: Rp 400,000 (5%)        │
│                                      │
│  🎉 Wants (Rp 2,400,000)             │
│  • Belanja: Rp 1,200,000 (15%)       │
│  • Hiburan: Rp 800,000 (10%)         │
│  • Langganan: Rp 400,000 (5%)        │
│                                      │
│  💎 Savings (Rp 1,600,000)           │
│  • Tabungan: Rp 1,600,000 (20%)      │
│                                      │
│  [Adjust] [Apply Budget →]           │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface BudgetSetupProps {
  currency: string
  onComplete: (budget: {income: number, categories: Array<{name, amount, percentage}>}) => void
  onSkip: () => void
}
```

**Behavior:**
- Step 1: Income input with validation (> 0)
- Step 2: Show AI suggestion with pie chart
- Allow adjustment (opens category editor)
- Apply creates budget entries in database
- Allow skip

---

### 3.5 AchievementCelebration Component

**Purpose:** Celebrate first achievement unlock with gamified UI.

**UI Layout:**
```
┌─────────────────────────────────────┐
│                                      │
│         🎉 Achievement Unlocked!     │
│                                      │
│         ┌─────────────┐              │
│         │             │              │
│         │   🏆 Badge  │              │
│         │             │              │
│         └─────────────┘              │
│                                      │
│         First Step                   │
│         You completed onboarding!    │
│                                      │
│         +10 points • Bronze          │
│                                      │
│  ┌─────────────────────────────────┐│
│  │ Progress: 1/50 achievements     ││
│  │ [████░░░░░░░░░░░░░░░░░░░░░░░]   ││
│  └─────────────────────────────────┘│
│                                      │
│  [Share Achievement] [Continue →]    │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface AchievementCelebrationProps {
  achievement: {
    code: string
    name: string
    description: string
    icon: string
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    points: number
  }
  totalAchievements: number
  unlockedCount: number
  onContinue: () => void
}
```

**Behavior:**
- Full-screen overlay with confetti animation
- Show badge with tier color (Bronze: #CD7F32, Silver: #C0C0C0, Gold: #FFD700, Platinum: #E5E4E2)
- Progress bar showing X/50 achievements
- Share button (generates image with achievement badge)
- Auto-dismiss after 5 seconds or manual Continue

---

## 4. Demo Data Templates

### 4.1 Quick Start Template (7 days, 15 transactions)

**Accounts:**
- BCA Savings: Rp 5,000,000
- GoPay: Rp 500,000

**Transactions (15):**
- Day 1: Gaji (Income, +8,000,000), Indomaret (Makanan, -45,000), Grab (Transport, -25,000)
- Day 2: Warteg (Makanan, -20,000), Shopee (Belanja, -150,000)
- Day 3: Alfamart (Makanan, -35,000), Bensin (Transport, -100,000)
- Day 4: Makan siang (Makanan, -30,000), Netflix (Langganan, -54,000)
- Day 5: Kopi (Makanan, -25,000), Parkir (Transport, -5,000)
- Day 6: Groceries (Makanan, -200,000), Bioskop (Hiburan, -50,000)
- Day 7: Makan malam (Makanan, -75,000), Transfer tabungan (Tabungan, -500,000)

**Budgets:**
- Makanan: Rp 2,000,000 (spent: Rp 430,000)

**Bills:** None

**Goals:** None

**Recurring:** None

---

### 4.2 Standard Template (30 days, 30 transactions)

**Accounts:**
- BCA Savings: Rp 8,000,000
- GoPay: Rp 750,000
- Cash: Rp 300,000

**Transactions (30):**
- Mix of income (2x salary), daily expenses (20x), bills (3x), entertainment (3x), savings (2x)
- Categories: Makanan (8x), Transport (5x), Belanja (4x), Hiburan (3x), Tagihan (3x), Langganan (2x), Tabungan (2x), Kesehatan (1x), Lainnya (2x)

**Budgets:**
- Makanan: Rp 2,000,000
- Transport: Rp 1,500,000
- Hiburan: Rp 800,000

**Bills:**
- Listrik: Rp 500,000 (due: 20th)
- Internet: Rp 400,000 (due: 25th)

**Goals:** None

**Recurring:** None

---

### 4.3 Complete Template (90 days, 50+ transactions)

**Accounts:**
- BCA Savings: Rp 12,000,000
- Mandiri Checking: Rp 3,000,000
- GoPay: Rp 1,000,000
- OVO: Rp 500,000
- Cash: Rp 500,000

**Transactions (50+):**
- Mix of income (3x salary), daily expenses (35x), bills (5x), entertainment (5x), savings (3x), investments (2x)
- Full category coverage

**Budgets:**
- Makanan: Rp 2,500,000
- Transport: Rp 1,500,000
- Belanja: Rp 1,200,000
- Hiburan: Rp 800,000
- Tagihan: Rp 1,000,000
- Langganan: Rp 400,000
- Kesehatan: Rp 500,000
- Tabungan: Rp 2,000,000

**Bills:**
- Listrik: Rp 600,000 (due: 20th)
- Internet: Rp 500,000 (due: 25th)
- Asuransi: Rp 800,000 (due: 1st)

**Goals:**
- Emergency Fund: Target Rp 20,000,000 (current: Rp 5,000,000)
- Liburan Bali: Target Rp 10,000,000 (current: Rp 2,000,000)

**Recurring:**
- Netflix: Rp 54,000 (monthly, 1st)
- Spotify: Rp 54,000 (monthly, 5th)
- Gym: Rp 300,000 (monthly, 10th)

---

## 5. AI Budget Suggestion (50/30/20 Rule)

### 5.1 Rule Implementation

**Formula:**
```
Needs (50%) = monthly_income * 0.50
Wants (30%) = monthly_income * 0.30
Savings (20%) = monthly_income * 0.20
```

**Category Breakdown:**

**Needs (50%):**
- Makanan: 20% of income
- Transport: 15% of income
- Tagihan: 10% of income
- Kesehatan: 5% of income

**Wants (30%):**
- Belanja: 15% of income
- Hiburan: 10% of income
- Langganan: 5% of income

**Savings (20%):**
- Tabungan: 20% of income

### 5.2 API Logic

```typescript
function generateBudgetSuggestion(monthlyIncome: number, currency: string) {
  const needs = monthlyIncome * 0.50
  const wants = monthlyIncome * 0.30
  const savings = monthlyIncome * 0.20

  return {
    needs: {
      total: needs,
      categories: [
        { name: 'Makanan', amount: monthlyIncome * 0.20, percentage: 20 },
        { name: 'Transport', amount: monthlyIncome * 0.15, percentage: 15 },
        { name: 'Tagihan', amount: monthlyIncome * 0.10, percentage: 10 },
        { name: 'Kesehatan', amount: monthlyIncome * 0.05, percentage: 5 },
      ]
    },
    wants: {
      total: wants,
      categories: [
        { name: 'Belanja', amount: monthlyIncome * 0.15, percentage: 15 },
        { name: 'Hiburan', amount: monthlyIncome * 0.10, percentage: 10 },
        { name: 'Langganan', amount: monthlyIncome * 0.05, percentage: 5 },
      ]
    },
    savings: {
      total: savings,
      categories: [
        { name: 'Tabungan', amount: monthlyIncome * 0.20, percentage: 20 },
      ]
    }
  }
}
```

### 5.3 Future AI Enhancement

**Phase 2+ (reserved for future):**
- Analyze user's transaction history
- Adjust percentages based on spending patterns
- Suggest category-specific optimizations
- Provide personalized recommendations
- Compare with similar user profiles

---

## 6. Achievement System

### 6.1 Predefined Achievements

**Onboarding Category:**
1. **First Step** (Bronze, 10 points)
   - Code: `onboarding_complete`
   - Description: "You completed onboarding!"
   - Icon: 🏆
   - Unlock: Complete onboarding (any path)

2. **Explorer** (Bronze, 5 points)
   - Code: `demo_data_loaded`
   - Description: "You tried demo data!"
   - Icon: 🗺️
   - Unlock: Load any demo data template

3. **Budget Master** (Bronze, 15 points)
   - Code: `budget_created`
   - Description: "You created your first budget!"
   - Icon: 💰
   - Unlock: Complete budget setup

**Transaction Category (future):**
4. **First Transaction** (Bronze, 10 points)
5. **10 Transactions** (Silver, 20 points)
6. **100 Transactions** (Gold, 50 points)

**Streak Category (future):**
7. **7-Day Streak** (Silver, 25 points)
8. **30-Day Streak** (Gold, 75 points)
9. **365-Day Streak** (Platinum, 200 points)

### 6.2 Unlock Service

```typescript
async function unlockAchievement(userId: string, achievementCode: string) {
  // Check if already unlocked
  const existing = await db.query.userAchievements.findFirst({
    where: and(
      eq(userAchievements.userId, userId),
      eq(userAchievements.achievementId, achievementCode)
    )
  })
  
  if (existing) return { alreadyUnlocked: true }

  // Get achievement details
  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.code, achievementCode)
  })

  if (!achievement) throw new Error('Achievement not found')

  // Create user_achievement record
  await db.insert(userAchievements).values({
    id: generateId(),
    userId,
    achievementId: achievement.id,
    unlockedAt: new Date(),
    progress: 100
  })

  // Calculate total points and achievements
  const userAchievementsList = await db.query.userAchievements.findMany({
    where: eq(userAchievements.userId, userId),
    with: { achievement: true }
  })

  const totalPoints = userAchievementsList.reduce((sum, ua) => sum + ua.achievement.points, 0)
  const totalAchievements = userAchievementsList.length

  return {
    success: true,
    achievement,
    totalPoints,
    totalAchievements
  }
}
```

### 6.3 Celebration Logic

**Trigger points:**
- After completing onboarding (any path)
- After loading demo data
- After creating budget

**Behavior:**
- Show AchievementCelebration component
- Play confetti animation
- Update user's total points
- Allow sharing to social media

---

## 7. Implementation Checklist

### 7.1 Database Migrations
- [ ] Create `demo_data_templates` table
- [ ] Create `achievements` table
- [ ] Create `user_achievements` table
- [ ] Extend `users` table with onboarding fields
- [ ] Seed demo data templates (3 presets)
- [ ] Seed achievements (6 predefined)

### 7.2 API Endpoints
- [ ] POST `/api/onboarding/demo-data`
- [ ] POST `/api/onboarding/budget-suggestion`
- [ ] POST `/api/onboarding/complete`
- [ ] POST `/api/achievements/unlock`

### 7.3 Components
- [ ] `ChoicePoint.tsx`
- [ ] `AccountSetup.tsx`
- [ ] `DemoDataMatrix.tsx`
- [ ] `BudgetSetup.tsx`
- [ ] `AchievementCelebration.tsx`

### 7.4 Services
- [ ] `demoDataService.ts` (generate and apply templates)
- [ ] `budgetSuggestionService.ts` (50/30/20 rule)
- [ ] `achievementService.ts` (unlock and track)

### 7.5 Onboarding Page Updates
- [ ] Update `page.tsx` to support branching flow
- [ ] Add state management for path selection
- [ ] Add navigation logic for Quick vs Complete paths
- [ ] Add achievement celebration trigger

### 7.6 Testing
- [ ] Test Quick path (2 min flow)
- [ ] Test Complete path (5 min flow)
- [ ] Test demo data generation (all 3 templates)
- [ ] Test budget suggestion calculation
- [ ] Test achievement unlock
- [ ] Test mobile responsiveness
- [ ] Test animations and transitions

### 7.7 Build & Deploy
- [ ] Build project (no errors)
- [ ] Commit changes
- [ ] Push to `twa-playstore` branch
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production

---

## 8. Technical Notes

### 8.1 State Management

**OnboardingFormData interface extension:**
```typescript
interface OnboardingFormData {
  // Existing fields
  name: string
  currency: string
  language: string
  pin: string
  notifications: boolean
  initialBalance: number
  
  // New fields
  onboardingVersion: 'v2'
  path: 'quick' | 'complete'
  accounts?: Array<{name, type, balance, currency}>
  demoDataScope?: 'quick' | 'standard' | 'complete'
  budgetAccepted?: boolean
  achievementsUnlocked?: Array<string>
}
```

### 8.2 Navigation Logic

```typescript
function getNextScreen(currentScreen: string, path: 'quick' | 'complete') {
  const quickFlow = ['welcome', 'features', 'quickSetup', 'choicePoint', 'demoData', 'achievement', 'complete']
  const completeFlow = ['welcome', 'features', 'quickSetup', 'choicePoint', 'accountSetup', 'initialBalance', 'demoData', 'budgetSetup', 'achievement', 'complete']
  
  const flow = path === 'quick' ? quickFlow : completeFlow
  const currentIndex = flow.indexOf(currentScreen)
  return flow[currentIndex + 1]
}
```

### 8.3 Animation Guidelines

- Use Framer Motion for all transitions
- Fade + slide for screen transitions (duration: 300ms)
- Scale + shadow for card selections (duration: 200ms)
- Confetti animation for achievement celebration (duration: 3s)
- Progress bar animation (duration: 500ms, ease-out)

### 8.4 Mobile Responsiveness

- All components must work on 320px width (iPhone SE)
- Touch targets minimum 44x44px
- Cards stack vertically on mobile
- Font sizes scale down on mobile (text-sm → text-xs)
- Reduce padding on mobile (p-6 → p-4)

---

## 9. Future Enhancements (Phase 2+)

### 9.1 AI Budget Enhancement
- Analyze transaction history
- Personalized category suggestions
- Spending pattern insights
- Comparison with similar users

### 9.2 Achievement Expansion
- 50+ total achievements
- Progressive achievements (10, 100, 1000 transactions)
- Streak achievements (7, 30, 365 days)
- Goal achievements (first goal, goal completed)
- Social achievements (invite friends, share insights)

### 9.3 Onboarding Analytics
- Track completion rate by path
- Track drop-off points
- Track demo data acceptance rate
- Track budget setup completion rate
- A/B test variations

### 9.4 Personalization
- Remember user's path preference
- Suggest path based on user profile
- Adaptive demo data based on income level
- Localized transaction examples

---

## 10. Appendix

### 10.1 Design References
- Duolingo onboarding (gamification)
- Revolut onboarding (account setup)
- YNAB onboarding (budget setup)
- Mint onboarding (demo data)

### 10.2 User Research Insights
- 70% of users abandon onboarding if it takes >5 minutes
- 85% of users prefer seeing populated dashboard over empty state
- 60% of users want quick setup, 40% want thorough setup
- Demo data increases 7-day retention by 25%
- Achievement celebration increases engagement by 15%

### 10.3 Technical Constraints
- Build time must stay <2 minutes
- Bundle size increase <500KB
- Database migration must be backward compatible
- API response time <500ms
- Mobile performance 60fps

---

**End of Specification**
