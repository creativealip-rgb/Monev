# Monev Improvement Plan 2026

**Document Version:** 1.0  
**Last Updated:** 2026-05-09  
**Status:** Draft  
**Owner:** Product & Engineering Team

---

## Executive Summary

Monev telah mencapai MVP dengan fitur core yang solid: transaction tracking, AI chat, budgeting, dan analytics. Improvement plan ini fokus pada **user retention**, **daily engagement**, dan **product differentiation** melalui intelligent automation, better UX, dan social features.

**Key Metrics Target (EOY 2026):**
- Daily Active Users (DAU): +150%
- 7-day retention: 60% → 75%
- Average session duration: 2.5min → 5min
- NPS Score: 45 → 65

---

## 🎯 Phase 1: Foundation & Quick Wins (Q2 2026)

**Goal:** Improve first-time experience dan daily engagement tanpa major architecture changes.

### 1.1 Interactive Onboarding Wizard

**Problem:** User baru bingung mulai dari mana, bounce rate tinggi di first session.

**Solution:** Guided setup wizard yang fun dan cepat (< 3 menit).

#### Technical Breakdown

**Database Schema:**
```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_step INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN onboarding_skipped BOOLEAN DEFAULT FALSE;
```

**Components:**
- `src/app/onboarding/page.tsx` - Main wizard container
- `src/frontend/components/onboarding/WelcomeStep.tsx` - Step 1: Welcome + value prop
- `src/frontend/components/onboarding/AccountSetupStep.tsx` - Step 2: Add 2-3 main accounts
- `src/frontend/components/onboarding/BudgetQuickSetup.tsx` - Step 3: Set monthly budget (optional)
- `src/frontend/components/onboarding/DemoDataOffer.tsx` - Step 4: Load sample data?
- `src/frontend/components/onboarding/CompletionStep.tsx` - Step 5: Achievement unlocked!

**API Endpoints:**
- `POST /api/onboarding/complete` - Mark onboarding done
- `POST /api/onboarding/skip` - Skip onboarding
- `POST /api/onboarding/demo-data` - Load sample transactions

**User Flow:**
1. User registers → redirect to `/onboarding`
2. Welcome screen: "Yuk kenalan dulu! 2 menit aja kok 😊"
3. Account setup: "Kamu punya akun apa aja?" (BCA, GoPay, Cash)
4. Budget setup: "Kira-kira budget bulanan kamu berapa?" (slider Rp2jt - Rp20jt)
5. Demo data offer: "Mau lihat contoh dulu?" (Yes → load 30 sample transactions)
6. Completion: "Siap! Sekarang coba chat sama Monev AI 💬"

**Success Metrics:**
- Onboarding completion rate: >70%
- Time to first transaction: <5 minutes
- Demo data acceptance rate: >40%

**Effort:** 3 days  
**Priority:** P0 (Critical)

---

### 1.2 Smart Notifications System

**Problem:** Notifikasi masih basic reminder, tidak proactive.

**Solution:** AI-powered notification engine yang detect anomaly dan kasih actionable insight.

#### Technical Breakdown

**Database Schema:**
```sql
CREATE TABLE notification_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    anomaly_alerts BOOLEAN DEFAULT TRUE,
    budget_warnings BOOLEAN DEFAULT TRUE,
    positive_reinforcement BOOLEAN DEFAULT TRUE,
    weekly_recap BOOLEAN DEFAULT TRUE,
    quiet_hours_start TEXT, -- "22:00"
    quiet_hours_end TEXT, -- "08:00"
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'anomaly', 'budget', 'positive', 'recap'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    action_url TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    clicked_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Notification Types:**

1. **Anomaly Detection**
   - Trigger: Daily spending > 2x average
   - Message: "Pengeluaran hari ini Rp450rb, biasanya cuma Rp200rb. Ada yang spesial? 🤔"
   - Action: "Lihat Detail"

2. **Budget Warning**
   - Trigger: Budget usage > 80% dan masih >7 hari
   - Message: "Budget Makanan tinggal 15% (Rp150rb), masih 12 hari lagi. Mau adjust?"
   - Action: "Atur Budget"

3. **Positive Reinforcement**
   - Trigger: Monthly spending < last month
   - Message: "Keren! Kamu hemat Rp750rb bulan ini vs bulan lalu 🎉"
   - Action: "Lihat Laporan"

4. **Weekly Recap**
   - Trigger: Every Sunday 18:00
   - Message: "Minggu ini kamu spending Rp1.2jt. Top category: Makanan (Rp450rb)"
   - Action: "Buka Dashboard"

**Components:**
- `src/backend/services/notificationEngine.ts` - Core notification logic
- `src/backend/services/anomalyDetector.ts` - Spending pattern analysis
- `src/backend/cron/notification-scheduler.ts` - Scheduled notification sender
- `src/frontend/components/NotificationPreferences.tsx` - Settings UI

**API Endpoints:**
- `GET /api/notifications/preferences` - Get user preferences
- `PUT /api/notifications/preferences` - Update preferences
- `GET /api/notifications/history` - Get notification history
- `POST /api/notifications/mark-read` - Mark as read
- `POST /api/cron/send-notifications` - Cron job endpoint

**Implementation Steps:**
1. Create notification preferences table + API
2. Build anomaly detection algorithm (rolling 7-day average)
3. Implement notification scheduler (cron every hour)
4. Add push notification support (Web Push API)
5. Build notification center UI
6. Add notification preferences to profile settings

**Success Metrics:**
- Notification open rate: >40%
- Click-through rate: >25%
- User opt-out rate: <10%

**Effort:** 5 days  
**Priority:** P0 (Critical)

---

### 1.3 Quick Add Shortcuts

**Problem:** Input transaksi butuh banyak tap, friction tinggi untuk daily use.

**Solution:** One-tap shortcuts untuk transaksi favorit.

#### Technical Breakdown

**Database Schema:**
```sql
CREATE TABLE transaction_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL, -- "Makan Siang", "Parkir", "Bensin"
    type TEXT NOT NULL, -- 'income' or 'expense'
    category_id INTEGER NOT NULL,
    amount REAL, -- NULL = ask user, or preset amount
    account_id INTEGER, -- NULL = ask user
    is_favorite BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

**Components:**
- `src/frontend/components/QuickAddBar.tsx` - Horizontal scrollable shortcuts
- `src/frontend/components/TemplateManager.tsx` - Manage templates
- `src/frontend/components/QuickAddSheet.tsx` - Bottom sheet for quick input

**Features:**

1. **Smart Templates**
   - Auto-suggest templates based on usage frequency
   - "Makan" (most used) → show first
   - Time-based suggestions: "Parkir" at 08:00, "Makan Siang" at 12:00

2. **Quick Add Flow**
   - Tap "Makan Siang" → Amount input → Done (2 taps)
   - Preset amount: Tap "Parkir Rp5rb" → Done (1 tap)

3. **Template Management**
   - Create from existing transaction: "Jadikan Template"
   - Edit template: name, category, default amount
   - Pin favorites to top

**API Endpoints:**
- `GET /api/transaction-templates` - Get user templates
- `POST /api/transaction-templates` - Create template
- `PUT /api/transaction-templates/:id` - Update template
- `DELETE /api/transaction-templates/:id` - Delete template
- `POST /api/transaction-templates/:id/use` - Create transaction from template

**UI Placement:**
- Dashboard: Horizontal scroll bar below balance card
- Add Transaction Sheet: "Atau pilih template" section
- Profile: "Template Transaksi" menu item

**Success Metrics:**
- Template usage rate: >60% of transactions
- Average time to add transaction: <10 seconds
- Template creation rate: >2 per user

**Effort:** 3 days  
**Priority:** P0 (Critical)

---

## 🚀 Phase 2: Intelligence & Automation (Q3 2026)

**Goal:** Make Monev proactive, bukan hanya reactive tracker.

### 2.1 AI Chat Quick Actions

**Problem:** AI chat masih conversational, belum actionable.

**Solution:** Natural language commands yang langsung execute action.

#### Technical Breakdown

**Intent Detection:**
```typescript
// src/lib/ai/intentDetector.ts
export type Intent = 
  | { type: 'add_transaction'; amount: number; category: string; description?: string }
  | { type: 'check_balance'; account?: string }
  | { type: 'check_budget'; category?: string }
  | { type: 'get_insight'; period: 'today' | 'week' | 'month' }
  | { type: 'conversation'; query: string };

export async function detectIntent(message: string): Promise<Intent> {
  // Use AI to parse intent from natural language
  // "tambah pengeluaran makan 50rb" → { type: 'add_transaction', amount: 50000, category: 'Makanan' }
}
```

**Supported Commands:**
- "Tambah pengeluaran makan 50rb" → Create transaction
- "Saldo BCA berapa?" → Show account balance
- "Budget makanan masih berapa?" → Show budget status
- "Pengeluaran hari ini berapa?" → Show today's spending
- "Apa insight bulan ini?" → Generate AI insight

**Components:**
- `src/lib/ai/intentDetector.ts` - Intent parsing
- `src/lib/ai/actionExecutor.ts` - Execute detected actions
- `src/frontend/components/chat/ActionConfirmation.tsx` - Confirm before execute
- `src/frontend/components/chat/ActionResult.tsx` - Show result

**Chat Flow:**
1. User: "Tambah pengeluaran makan 50rb"
2. AI detects intent: `add_transaction`
3. Show confirmation card: "Mau tambah pengeluaran Makanan Rp50.000?"
4. User taps "Ya" → Transaction created
5. AI responds: "Oke, udah dicatat! Pengeluaran hari ini jadi Rp125rb."

**API Changes:**
- `POST /api/chat` - Add intent detection + action execution
- Response format: `{ type: 'action' | 'message', action?: Action, message: string }`

**Success Metrics:**
- Action command usage: >30% of chat messages
- Action success rate: >90%
- User satisfaction with quick actions: >4.5/5

**Effort:** 4 days  
**Priority:** P1 (High)

---

### 2.2 Recurring Transaction Intelligence

**Problem:** User lupa input subscription/tagihan rutin, data jadi incomplete.

**Solution:** Auto-detect recurring patterns dan suggest automation.

#### Technical Breakdown

**Pattern Detection Algorithm:**
```typescript
// src/backend/services/recurringDetector.ts
interface RecurringPattern {
  transactions: Transaction[];
  frequency: 'daily' | 'weekly' | 'monthly';
  averageAmount: number;
  confidence: number; // 0-1
  suggestedName: string;
}

export async function detectRecurringPatterns(userId: number): Promise<RecurringPattern[]> {
  // 1. Group transactions by similar amount + category + description
  // 2. Check if they occur at regular intervals (±3 days tolerance)
  // 3. Calculate confidence based on consistency
  // 4. Return patterns with confidence > 0.7
}
```

**Detection Rules:**
- Minimum 3 occurrences
- Amount variance < 10%
- Time interval consistency > 70%
- Same category + similar description

**Components:**
- `src/backend/services/recurringDetector.ts` - Pattern detection
- `src/frontend/components/RecurringSuggestions.tsx` - Suggestion cards
- `src/frontend/components/RecurringSetupModal.tsx` - Convert to recurring

**User Flow:**
1. System detects pattern: "Netflix Rp54rb" every month
2. Show suggestion card: "Kayaknya ini langganan bulanan, mau dijadiin recurring?"
3. User taps "Ya" → Open setup modal
4. Pre-filled: Name="Netflix", Amount=54000, Frequency=Monthly, Next Date=auto
5. User confirms → Recurring transaction created

**API Endpoints:**
- `GET /api/recurring/suggestions` - Get detected patterns
- `POST /api/recurring/from-pattern` - Create recurring from pattern
- `POST /api/recurring/dismiss-suggestion` - Dismiss suggestion

**Notification Integration:**
- "Kami deteksi 3 transaksi berulang. Mau diatur otomatis?"
- "Besok tanggal 10, biasanya kamu bayar Netflix Rp54rb. Mau diingatkan?"

**Success Metrics:**
- Pattern detection accuracy: >80%
- Suggestion acceptance rate: >50%
- Recurring transaction coverage: >70% of actual recurring expenses

**Effort:** 5 days  
**Priority:** P1 (High)

---

### 2.3 Offline-First Sync Enhancement

**Problem:** Offline sync masih manual retry, UX kurang smooth.

**Solution:** Auto background sync + conflict resolution UI.

#### Technical Breakdown

**Sync Queue System:**
```typescript
// src/lib/sync/syncQueue.ts
interface SyncQueueItem {
  id: string;
  type: 'transaction' | 'account' | 'budget';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'conflict';
  error?: string;
}

export class SyncQueue {
  async add(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void>;
  async process(): Promise<void>; // Process all pending items
  async retry(id: string): Promise<void>;
  async clear(): Promise<void>;
  async getStatus(): Promise<{ pending: number; failed: number; conflicts: number }>;
}
```

**Conflict Resolution:**
- Server wins: Discard local changes
- Local wins: Overwrite server
- Merge: Show diff, let user choose

**Components:**
- `src/lib/sync/syncQueue.ts` - Queue management
- `src/lib/sync/syncWorker.ts` - Background sync worker
- `src/frontend/components/SyncStatusBadge.tsx` - Visual indicator
- `src/frontend/components/ConflictResolutionModal.tsx` - Resolve conflicts

**Auto Sync Triggers:**
- On app focus (user returns to app)
- On network reconnect
- Every 5 minutes (if online)
- After user action (optimistic UI + background sync)

**UI Indicators:**
- Badge: "3 transaksi menunggu sync"
- Toast: "Syncing..." → "Sync berhasil!"
- Conflict modal: "Ada perbedaan data, pilih mana yang mau disimpan"

**API Endpoints:**
- `GET /api/sync/status` - Get sync queue status
- `POST /api/sync/process` - Trigger manual sync
- `POST /api/sync/resolve-conflict` - Resolve conflict

**Success Metrics:**
- Auto sync success rate: >95%
- Conflict occurrence rate: <5%
- User manual retry rate: <10%

**Effort:** 6 days  
**Priority:** P1 (High)

---

## 💡 Phase 3: Engagement & Retention (Q4 2026)

**Goal:** Build habit-forming features dan social proof.

### 3.1 Gamification & Achievements

**Problem:** No incentive untuk daily engagement.

**Solution:** Achievement system + streak tracking.

#### Technical Breakdown

**Database Schema:**
```sql
CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- 'first_transaction', '7_day_streak'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- emoji or icon name
    tier TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum'
    points INTEGER NOT NULL,
    requirement_type TEXT NOT NULL, -- 'count', 'streak', 'amount'
    requirement_value INTEGER NOT NULL
);

CREATE TABLE user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE user_streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Achievement Categories:**

1. **Getting Started**
   - 🎯 First Transaction - "Transaksi pertama kamu!"
   - 💰 First Budget - "Budget pertama dibuat!"
   - 🤖 First AI Chat - "Ngobrol sama Monev AI!"

2. **Consistency**
   - 🔥 3 Day Streak - "3 hari berturut-turut catat transaksi"
   - ⚡ 7 Day Streak - "Seminggu konsisten!"
   - 💎 30 Day Streak - "Sebulan penuh! Keren!"

3. **Milestones**
   - 📊 100 Transactions - "100 transaksi tercatat"
   - 💸 Rp10jt Tracked - "Total Rp10jt tercatat"
   - 🎯 First Goal Achieved - "Goal pertama tercapai!"

4. **Mastery**
   - 📈 Budget Master - "3 bulan berturut-turut budget terpenuhi"
   - 💰 Saving Champion - "Hemat Rp1jt dalam sebulan"
   - 🏆 Monev Pro - "Unlock semua fitur"

**Components:**
- `src/backend/services/achievementEngine.ts` - Achievement checker
- `src/frontend/components/AchievementUnlockModal.tsx` - Celebration modal
- `src/frontend/components/AchievementList.tsx` - Achievement gallery
- `src/frontend/components/StreakWidget.tsx` - Streak counter

**Unlock Flow:**
1. User adds transaction
2. Backend checks achievement conditions
3. If unlocked → Push notification + confetti animation
4. Show achievement modal: "🎉 Achievement Unlocked! 7 Day Streak"
5. Add to user profile

**API Endpoints:**
- `GET /api/achievements` - Get all achievements
- `GET /api/achievements/user` - Get user's unlocked achievements
- `GET /api/achievements/progress` - Get progress toward next achievements
- `GET /api/streaks` - Get user streak data

**Success Metrics:**
- Achievement unlock rate: >5 per user
- 7-day streak retention: >40%
- Achievement share rate: >15%

**Effort:** 4 days  
**Priority:** P2 (Medium)

---

### 3.2 Social Features - Split Bill 2.0

**Problem:** Split bill masih manual, friction tinggi.

**Solution:** Smart split bill dengan OCR + payment link.

#### Technical Breakdown

**Enhanced Flow:**
1. User scans receipt (OCR)
2. AI detects items + prices
3. User assigns items to people
4. Generate payment link
5. Send via WhatsApp/Telegram
6. Track who paid

**Database Schema:**
```sql
CREATE TABLE split_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    total_amount REAL NOT NULL,
    receipt_image_url TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'partial', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE split_bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_bill_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (split_bill_id) REFERENCES split_bills(id)
);

CREATE TABLE split_bill_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_bill_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    amount_owed REAL NOT NULL,
    paid_at TIMESTAMP,
    payment_proof_url TEXT,
    FOREIGN KEY (split_bill_id) REFERENCES split_bills(id)
);
```

**Components:**
- `src/frontend/components/SplitBillScanner.tsx` - Receipt OCR
- `src/frontend/components/SplitBillEditor.tsx` - Assign items
- `src/frontend/components/SplitBillSummary.tsx` - Payment status
- `src/app/split/[id]/page.tsx` - Public payment page

**OCR Integration:**
- Use existing `/api/transactions/ocr` endpoint
- Parse receipt → extract items + prices
- AI categorize items

**Payment Link:**
- URL: `monev.app/split/abc123`
- Shows: Items, amount owed, payment instructions
- Payment methods: Bank transfer, e-wallet
- Mark as paid → Upload proof

**API Endpoints:**
- `POST /api/split-bill/scan` - OCR receipt
- `POST /api/split-bill/create` - Create split bill
- `GET /api/split-bill/:id` - Get split bill details
- `POST /api/split-bill/:id/mark-paid` - Mark participant as paid
- `GET /api/split-bill/user` - Get user's split bills

**Success Metrics:**
- Split bill creation rate: >2 per user per month
- Payment completion rate: >80%
- OCR accuracy: >85%

**Effort:** 7 days  
**Priority:** P2 (Medium)

---

### 3.3 Advanced Data Visualization

**Problem:** Analytics masih terlalu teknis, kurang engaging.

**Solution:** Interactive charts + shareable insights.

#### Technical Breakdown

**New Visualizations:**

1. **Spending Heatmap Calendar**
   - GitHub-style contribution graph
   - Color intensity = spending amount
   - Hover: "Senin, 5 Mei: Rp250rb"

2. **Category Trend Line**
   - Multi-line chart per category
   - Show trend: naik/turun/stabil
   - Forecast next month

3. **Interactive Sankey Diagram**
   - Income → Categories → Subcategories
   - Click to drill down
   - Animated flow

4. **Spending Distribution Pie**
   - Animated donut chart
   - Tap slice → Show transactions
   - Export as image

**Components:**
- `src/frontend/components/charts/SpendingHeatmap.tsx` - Calendar heatmap
- `src/frontend/components/charts/CategoryTrendChart.tsx` - Line chart
- `src/frontend/components/charts/InteractiveSankey.tsx` - Sankey diagram
- `src/frontend/components/charts/SpendingPieChart.tsx` - Donut chart

**Libraries:**
- `recharts` - React charting library
- `d3-sankey` - Sankey diagram
- `html-to-image` - Export chart as image

**Share Feature:**
- "Share Insight" button
- Generate image: Chart + Monev branding
- Share to Instagram Story / WhatsApp Status

**API Endpoints:**
- `GET /api/analytics/heatmap` - Get daily spending data
- `GET /api/analytics/category-trend` - Get category trend data
- `GET /api/analytics/sankey` - Get flow data (already exists)
- `POST /api/analytics/export-image` - Generate shareable image

**Success Metrics:**
- Chart interaction rate: >60%
- Share rate: >10%
- Time spent on analytics: +50%

**Effort:** 6 days  
**Priority:** P2 (Medium)

---

## 🔧 Phase 4: Technical Debt & Polish (Ongoing)

### 4.1 Performance Optimization

**Targets:**
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse Score: >90

**Actions:**
- [ ] Lazy load dashboard widgets
- [ ] Virtualize transaction list (react-window)
- [ ] Optimize images (next/image + WebP)
- [ ] Code splitting per route
- [ ] Service worker aggressive caching

**Effort:** 5 days  
**Priority:** P2 (Medium)

---

### 4.2 Accessibility Improvements

**WCAG 2.1 AA Compliance:**
- [ ] Screen reader support (ARIA labels)
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Focus indicators
- [ ] Color contrast ratio >4.5:1
- [ ] Alt text for all images

**Components to Audit:**
- All modals and sheets
- Form inputs
- Charts and graphs
- Navigation menus

**Effort:** 4 days  
**Priority:** P3 (Low)

---

### 4.3 Security Hardening

**Actions:**
- [ ] Session timeout (30 min idle)
- [ ] Biometric re-auth for sensitive actions
- [ ] Rate limiting on API endpoints
- [ ] CSRF token validation
- [ ] Content Security Policy headers
- [ ] Audit log for critical actions

**Effort:** 3 days  
**Priority:** P1 (High)

---

## 📊 Success Metrics Dashboard

### User Engagement
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Monthly Active Users (MAU)
- DAU/MAU ratio (stickiness)
- Average session duration
- Sessions per user per day

### Feature Adoption
- Onboarding completion rate
- AI chat usage rate
- Quick add template usage
- Notification open rate
- Achievement unlock rate
- Split bill creation rate

### Retention
- 1-day retention
- 7-day retention
- 30-day retention
- Churn rate
- Resurrection rate

### Product Quality
- Crash-free rate
- API error rate
- Offline sync success rate
- Average response time
- Lighthouse score

---

## 🗓️ Implementation Timeline

### Q2 2026 (May - July)
**Week 1-2:** Onboarding Wizard  
**Week 3-4:** Smart Notifications  
**Week 5-6:** Quick Add Shortcuts  
**Week 7-8:** Testing & Bug Fixes

### Q3 2026 (August - October)
**Week 1-2:** AI Chat Quick Actions  
**Week 3-5:** Recurring Intelligence  
**Week 6-8:** Offline Sync Enhancement  
**Week 9-10:** Testing & Optimization

### Q4 2026 (November - December)
**Week 1-2:** Gamification System  
**Week 3-5:** Split Bill 2.0  
**Week 6-8:** Advanced Visualization  
**Week 9-12:** Polish & Launch

---

## 💰 Resource Allocation

### Engineering
- 1 Full-stack Engineer (Full-time)
- 1 Frontend Engineer (Part-time, Q4)
- 1 Backend Engineer (Part-time, Q3)

### Design
- 1 Product Designer (Part-time)
- Illustrations & animations (Freelance)

### QA
- Manual testing (Internal)
- Beta testing (50 users per phase)

---

## 🚨 Risks & Mitigations

### Technical Risks
**Risk:** OCR accuracy too low for split bill  
**Mitigation:** Manual edit fallback, improve with user feedback

**Risk:** Offline sync conflicts too frequent  
**Mitigation:** Optimistic UI + clear conflict resolution UX

**Risk:** AI intent detection inaccurate  
**Mitigation:** Confirmation step before action, improve with training data

### Product Risks
**Risk:** Feature bloat, app becomes complex  
**Mitigation:** Progressive disclosure, hide advanced features

**Risk:** Low feature adoption  
**Mitigation:** In-app tooltips, onboarding tours, A/B testing

### Business Risks
**Risk:** Increased server costs (AI, notifications)  
**Mitigation:** Optimize API calls, cache aggressively, premium tier

---

## 📝 Appendix

### A. User Research Insights
- 70% users want faster transaction input
- 60% users forget to track recurring expenses
- 50% users want spending comparison with peers
- 40% users want gamification elements

### B. Competitor Analysis
- **Wallet by BudgetBakers:** Strong visualization, weak AI
- **Money Lover:** Good templates, no social features
- **Spendee:** Beautiful UI, limited intelligence
- **Monev Advantage:** AI-first, Indonesian-focused, social-ready

### C. Technical Stack
- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Next.js API Routes, SQLite (Turso)
- **AI:** OpenRouter (Claude Sonnet 4.5)
- **Hosting:** Dokploy + Traefik
- **Analytics:** Custom (future: PostHog)

---

**Document End**

*For questions or feedback, contact: Product Team*
