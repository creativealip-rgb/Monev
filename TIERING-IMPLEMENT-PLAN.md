# 🚀 TIERING SYSTEM - IMPLEMENTATION PLAN

> **Step-by-step guide untuk implementasi tier structure baru**  
> **Version:** 3.0 (Telegram Bot Differentiation)  
> **Timeline:** 6-7 weeks  
> **Status:** Ready to Start ✅

---

## 📋 OVERVIEW

### What We're Implementing

```
OLD STRUCTURE (v2.0):
├── Miskin (Free): 50 transactions, 3 AI chats, no export
├── Kaya (Rp 50K): Unlimited, basic features
└── Sultan (Rp 149K): Everything + Telegram bot

NEW STRUCTURE (v3.0):
├── Starter (Free): 100 transactions, 5 AI chats, CSV export
├── Pro (Rp 29K): Unlimited + Telegram bot (command-based)
└── Sultan (Rp 49K): Unlimited + Telegram bot (conversational AI)
```

### Key Changes

| Aspect | Old | New | Impact |
|---|---|---|---|
| **Tier Names** | Miskin/Kaya/Sultan | Starter/Pro/Sultan | Remove negative connotation |
| **Free Transactions** | 50/month | 100/month | Better hook period |
| **Free AI Chats** | 3/day | 5/day | More meaningful conversations |
| **Free Export** | None | CSV only | Basic user expectation |
| **Telegram Bot** | Sultan only | Pro + Sultan (differentiated) | Clear upgrade path |
| **Pro Price** | Rp 50K/month | **Rp 29K/month** | Mass market penetration |
| **Sultan Price** | Rp 149K/month | **Rp 49K/month** | Affordable luxury |

---

## 📅 TIMELINE (6-7 Weeks)

```
Week 1: Documentation & Planning
├── Update tier-gate.ts
├── Update pricing page copy
├── Create tier comparison graphics
└── Update app store descriptions

Week 2-3: Technical Implementation
├── Update database schema
├── Implement usage tracking
├── Build tier enforcement
└── Test tier limits

Week 3-4: Telegram Bot Development
├── Setup infrastructure
├── Implement command parser (PRO)
├── Implement conversational AI (SULTAN)
└── Test both modes

Week 4-5: UI/UX Updates
├── Update pricing page
├── Add tier badges
├── Create upgrade prompts
└── Add usage indicators

Week 6: Soft Launch (10% users)
├── Monitor conversion rates
├── Gather feedback
├── A/B test pricing messages
└── Iterate based on data

Week 7+: Full Launch (100% users)
├── Launch promotion
├── Influencer outreach
├── Content marketing push
└── Monitor & optimize daily
```

---

## 🛠️ PHASE 1: DOCUMENTATION (Week 1)

### Task 1.1: Update Tier Gate Configuration

**File:** `src/lib/tier-gate.ts`

```typescript
// OLD
export const TIER_LIMITS = {
  miskin: { transactions: 50, aiChats: 3, ... },
  kaya: { transactions: Infinity, aiChats: Infinity, ... },
  sultan: { transactions: Infinity, aiChats: Infinity, telegram: true, ... },
};

// NEW
export const TIER_LIMITS = {
  starter: { 
    transactions: 100, 
    aiChats: 5, 
    export: ['csv'],
    telegramBot: false,
    ...
  },
  pro: { 
    transactions: Infinity, 
    aiChats: 100, 
    export: ['csv', 'excel'],
    telegramBot: 'command',
    ...
  },
  sultan: { 
    transactions: Infinity, 
    aiChats: Infinity, 
    export: ['csv', 'excel', 'pdf'],
    telegramBot: 'ai',
    ...
  },
};
```

**Acceptance Criteria:**
- [ ] All tier limits updated
- [ ] Type definitions updated (UserTier type)
- [ ] All references to old tier names updated
- [ ] Tests passing

---

### Task 1.2: Update Pricing Page Copy

**File:** `src/app/(protected)/fitur/upgrade/page.tsx`

**Content Updates:**

```tsx
// OLD
<h1>Upgrade ke Kaya atau Sultan</h1>
<p>Dapatkan fitur lebih lengkap!</p>

// NEW
<h1>Pilih Paket yang Cocok Buat Kamu</h1>
<p>Dari gratis sampai premium, ada untuk semua!</p>

// OLD
<TierCard 
  name="Kaya" 
  price="Rp 50.000" 
  ...
/>

// NEW
<TierCard 
  name="Pro" 
  price="Rp 29.000" 
  highlight="BEST VALUE"
  ...
/>
```

**Acceptance Criteria:**
- [ ] Tier names updated (Starter/Pro/Sultan)
- [ ] Prices updated (Rp 29K/Rp 49K)
- [ ] Features list updated
- [ ] Telegram bot differentiation clear
- [ ] Visual design updated

---

### Task 1.3: Create Tier Comparison Graphics

**Deliverables:**
- [ ] Tier comparison table (web)
- [ ] Tier comparison card (mobile)
- [ ] Feature icons for each tier
- [ ] Upgrade badge icons

**Tools:**
- Figma for design
- Export as SVG/PNG
- Add to `public/images/tiers/`

---

### Task 1.4: Update App Store Descriptions

**Files to Update:**
- `public/manifest.json` (PWA)
- `android/app/src/main/res/values/strings.xml` (APK)
- Landing page meta descriptions

**Content:**
```
OLD: "Monev - Aplikasi Keuangan dengan Tier Miskin/Kaya/Sultan"
NEW: "Monev - Aplikasi Keuangan Gratis dengan AI (Starter/Pro/Sultan)"
```

**Acceptance Criteria:**
- [ ] All app store descriptions updated
- [ ] Meta tags updated
- [ ] Social media preview updated

---

## 🔧 PHASE 2: TECHNICAL IMPLEMENTATION (Week 2-3)

### Task 2.1: Database Schema Updates

**File:** `src/backend/db/schema.ts`

```typescript
// Add tier column to users table (if not exists)
tier: text('tier', { enum: ['starter', 'pro', 'sultan'] }).notNull().default('starter'),
tier_expires_at: integer('tier_expires_at', { mode: 'timestamp' }),

// Create usage_tracking table
export const usageTracking = sqliteTable('usage_tracking', {
  id: integer('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  transactions_count: integer('transactions_count').default(0),
  ai_chats_count: integer('ai_chats_count').default(0),
  ocr_scans_count: integer('ocr_scans_count').default(0),
  telegram_messages_count: integer('telegram_messages_count').default(0),
});
```

**Migration Steps:**
```bash
# 1. Update schema
npx drizzle-kit push

# 2. Generate migration
npx drizzle-kit generate

# 3. Run migration
npx drizzle-kit migrate
```

**Acceptance Criteria:**
- [ ] Schema updated
- [ ] Migration generated
- [ ] Migration tested locally
- [ ] Backup created before migration

---

### Task 2.2: Implement Usage Tracking

**File:** `src/lib/usage-tracker.ts` (NEW)

```typescript
import { getDb } from "@/backend/db";
import { usageTracking } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function incrementUsage(
  userId: number, 
  feature: 'transactions' | 'ai_chats' | 'ocr_scans' | 'telegram'
) {
  const db = getDb();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  // Get or create usage record
  const record = await db.select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.user_id, userId),
        eq(usageTracking.month, month),
        eq(usageTracking.year, year)
      )
    )
    .get();
  
  if (!record) {
    // Create new record
    await db.insert(usageTracking).values({
      user_id: userId,
      month,
      year,
      [`${feature}_count`]: 1,
    });
  } else {
    // Increment existing
    await db.update(usageTracking)
      .set({
        [`${feature}_count`]: record[`${feature}_count`] + 1,
      })
      .where(eq(usageTracking.id, record.id));
  }
}

export async function getUsage(userId: number): Promise<any> {
  const db = getDb();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  const record = await db.select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.user_id, userId),
        eq(usageTracking.month, month),
        eq(usageTracking.year, year)
      )
    )
    .get();
  
  return record || {
    transactions_count: 0,
    ai_chats_count: 0,
    ocr_scans_count: 0,
    telegram_messages_count: 0,
  };
}

export async function checkLimit(userId: number, tier: string, feature: string): Promise<boolean> {
  const usage = await getUsage(userId);
  const limit = TIER_LIMITS[tier as keyof typeof TIER_LIMITS][feature];
  
  if (limit === Infinity) return true;
  
  const usageKey = `${feature}_count`;
  return usage[usageKey] < limit;
}
```

**Acceptance Criteria:**
- [ ] Usage tracking implemented
- [ ] Increment function works
- [ ] Get usage function works
- [ ] Check limit function works
- [ ] Tests passing

---

### Task 2.3: Build Tier Enforcement Middleware

**File:** `src/middleware/tier-gate.ts` (NEW)

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { TIER_LIMITS } from "@/lib/tier-gate";
import { checkLimit } from "@/lib/usage-tracker";

export async function tierGateMiddleware(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = parseInt(session.user.id);
  const userTier = session.user.tier || 'starter';
  const url = new URL(request.url);
  const feature = getFeatureFromPath(url.pathname);
  
  // Check if feature is tier-gated
  if (feature) {
    const allowed = await checkLimit(userId, userTier, feature);
    if (!allowed) {
      return NextResponse.json({
        error: "Tier limit reached",
        message: getLimitMessage(userTier, feature),
        upgradeUrl: "/fitur/upgrade"
      }, { status: 403 });
    }
  }
  
  return NextResponse.next();
}

function getFeatureFromPath(pathname: string): string | null {
  if (pathname.startsWith('/api/transactions')) return 'transactions';
  if (pathname.startsWith('/api/chat')) return 'ai_chats';
  if (pathname.startsWith('/api/ocr')) return 'ocr_scans';
  if (pathname.startsWith('/api/telegram')) return 'telegram';
  return null;
}

function getLimitMessage(tier: string, feature: string): string {
  const messages = {
    starter: {
      transactions: "Kamu sudah mencapai batas 100 transaksi bulan ini. Upgrade ke Pro untuk unlimited!",
      ai_chats: "Kamu sudah mencapai batas 5 AI chats hari ini. Upgrade ke Pro untuk 100 chats/hari!",
    },
    pro: {
      // Pro has higher limits, but still check
    },
    sultan: {
      // Sultan has unlimited, but check for abuse
    },
  };
  
  return messages[tier]?.[feature] || "Batas tier tercapai. Upgrade untuk akses lebih!";
}
```

**Acceptance Criteria:**
- [ ] Middleware implemented
- [ ] Integrated with API routes
- [ ] Returns proper 403 responses
- [ ] Upgrade URL included
- [ ] Tests passing

---

### Task 2.4: Test Tier Limits

**Test Cases:**

```typescript
// src/__tests__/tier-gate.test.ts

describe('Tier Gate', () => {
  it('should allow starter user 100 transactions', async () => {
    // Create starter user
    // Try to create 100 transactions
    // Should succeed
  });
  
  it('should block 101st transaction for starter user', async () => {
    // Create starter user with 100 transactions
    // Try to create 101st transaction
    // Should return 403
  });
  
  it('should allow pro user unlimited transactions', async () => {
    // Create pro user
    // Try to create 150 transactions
    // Should all succeed
  });
  
  it('should allow sultan user conversational AI', async () => {
    // Create sultan user
    // Send natural language to Telegram bot
    // Should get AI response
  });
  
  it('should block starter user from Telegram bot', async () => {
    // Create starter user
    // Try to access Telegram bot
    // Should get upgrade prompt
  });
});
```

**Acceptance Criteria:**
- [ ] All test cases written
- [ ] All tests passing
- [ ] Edge cases covered
- [ ] Performance tested

---

## 🤖 PHASE 3: TELEGRAM BOT (Week 3-4)

### Task 3.1: Setup Telegram Bot Infrastructure

**File:** `src/lib/telegram/bot.ts` (NEW)

```typescript
import { Telegraf, Context } from 'telegraf';
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Middleware to check user tier
bot.use(async (ctx, next) => {
  const telegramId = ctx.from.id;
  
  // Get user from DB
  const db = getDb();
  const user = await db.select()
    .from(users)
    .where(eq(users.telegram_id, telegramId))
    .get();
  
  if (!user) {
    await ctx.reply(
      '❌ Akun tidak ditemukan.\n\n' +
      'Hubungkan akun Monev kamu dulu:\n' +
      '1. Buka app Monev\n' +
      '2. Profile → Integrasi Bot\n' +
      '3. Masukkan Telegram ID kamu'
    );
    return;
  }
  
  // Attach user to context
  ctx.state.user = user;
  await next();
});

// Start command
bot.start(async (ctx) => {
  const user = ctx.state.user;
  
  if (user.tier === 'starter') {
    await ctx.reply(
      '👋 Selamat datang di Monev Bot!\n\n' +
      '❌ Fitur Telegram bot hanya untuk tier PRO dan SULTAN.\n\n' +
      'Upgrade ke PRO untuk:\n' +
      '✅ Add transaksi cepat via /add\n' +
      '✅ Cek saldo via /balance\n' +
      '✅ Notif budget otomatis\n\n' +
      'Harga: cuma Rp 29rb/bulan!\n' +
      'Upgrade: /upgrade'
    );
    return;
  }
  
  await ctx.reply(
    `👋 Selamat datang, ${user.name}!\n\n` +
    `Tier kamu: **${user.tier.toUpperCase()}**\n\n` +
    'Ketik /help untuk lihat command yang tersedia.'
  );
});

export default bot;
```

**Acceptance Criteria:**
- [ ] Bot infrastructure setup
- [ ] User authentication working
- [ ] Tier check middleware working
- [ ] Start command implemented
- [ ] Error handling in place

---

### Task 3.2: Implement Command Parser (PRO Tier)

**File:** `src/lib/telegram/commands.ts` (NEW)

```typescript
import { Context } from 'telegraf';
import { createTransaction } from '@/backend/db/operations';

// /add command
export async function handleAddCommand(ctx: Context) {
  const user = ctx.state.user;
  const args = ctx.message.text.split(' ').slice(1);
  
  // Parse: /add 50000 makanan Makan siang
  if (args.length < 2) {
    await ctx.reply(
      '❌ Format salah!\n\n' +
      'Gunakan: /add <amount> <category> [desc]\n' +
      'Contoh: /add 50000 makanan Makan siang'
    );
    return;
  }
  
  const amount = parseInt(args[0]);
  const category = args[1];
  const description = args.slice(2).join(' ') || category;
  
  // Create transaction
  await createTransaction({
    user_id: user.id,
    amount,
    category_id: category, // Simplified
    type: 'expense',
    description,
    date: new Date(),
  });
  
  await ctx.reply(
    '✅ Transaksi berhasil!\n\n' +
    `💰 Rp ${amount.toLocaleString('id-ID')}\n` +
    `📍 ${category}\n` +
    `📝 ${description}\n` +
    `📅 ${new Date().toLocaleDateString('id-ID')}`
  );
}

// /balance command
export async function handleBalanceCommand(ctx: Context) {
  const user = ctx.state.user;
  
  // Get user accounts
  // Format response
  await ctx.reply(
    '💼 Saldo Anda:\n\n' +
    '• BCA: Rp 5.200.000\n' +
    '• GoPay: Rp 450.000\n' +
    '• Total: Rp 5.650.000'
  );
}

// /budget command
export async function handleBudgetCommand(ctx: Context) {
  // Get user budgets
  // Format response
}

// Register commands
export function registerCommands(bot: Telegraf) {
  bot.command('add', handleAddCommand);
  bot.command('balance', handleBalanceCommand);
  bot.command('budget', handleBudgetCommand);
  // ... more commands
}
```

**Acceptance Criteria:**
- [ ] All PRO commands implemented
- [ ] Command parser working
- [ ] Error messages clear
- [ ] Responses formatted nicely
- [ ] Tests passing

---

### Task 3.3: Implement Conversational AI (SULTAN Tier)

**File:** `src/lib/telegram/ai.ts` (NEW)

```typescript
import { Context } from 'telegraf';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handleAIConversation(ctx: Context) {
  const user = ctx.state.user;
  const message = ctx.message.text;
  
  // Check if it's a command (shouldn't be, but just in case)
  if (message.startsWith('/')) {
    return; // Let command handler deal with it
  }
  
  // Get conversation context (last 10 messages)
  const context = await getChatContext(user.id);
  
  // Call OpenAI with financial context
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Kamu adalah AI Financial Assistant untuk Monev.
                  User tier: SULTAN (premium).
                  Berikan saran keuangan yang actionable dan personalized.
                  Gunakan Bahasa Indonesia yang friendly dan informal.`
      },
      ...context,
      { role: 'user', content: message }
    ],
  });
  
  const aiResponse = response.choices[0].message.content;
  
  // Save to chat history
  await saveChatMessage(user.id, 'user', message);
  await saveChatMessage(user.id, 'assistant', aiResponse);
  
  await ctx.reply(aiResponse);
}

// Register AI handler
export function registerAIHandler(bot: Telegraf) {
  bot.on('text', async (ctx) => {
    const user = ctx.state.user;
    
    if (user.tier === 'sultan') {
      await handleAIConversation(ctx);
    }
  });
}
```

**Acceptance Criteria:**
- [ ] Conversational AI implemented
- [ ] Context awareness working
- [ ] Financial personalization working
- [ ] Response quality tested
- [ ] Rate limiting in place

---

### Task 3.4: Add Tier-Based Feature Gating

**File:** `src/lib/telegram/middleware.ts` (NEW)

```typescript
import { Context, Middleware } from 'telegraf';

// Check if message is a command
function isCommand(message: string): boolean {
  return message.startsWith('/');
}

// Tier-based routing
export function tierGateMiddleware(): Middleware<Context> {
  return async (ctx, next) => {
    const user = ctx.state.user;
    const message = ctx.message.text;
    
    if (user.tier === 'starter') {
      // Block all bot access
      await ctx.reply('❌ Fitur Telegram bot hanya untuk tier PRO dan SULTAN.\nUpgrade: /upgrade');
      return;
    }
    
    if (user.tier === 'pro') {
      // Only allow commands
      if (!isCommand(message)) {
        await ctx.reply(
          '❓ Format tidak dikenali. Gunakan command:\n' +
          '/add <amount> <category> [desc]\n\n' +
          '💡 Mau chat natural? Upgrade ke SULTAN!\n' +
          '/upgrade_sultan'
        );
        return;
      }
    }
    
    if (user.tier === 'sultan') {
      // Allow everything (commands + natural conversation)
      // AI handler will deal with non-commands
    }
    
    await next();
  };
}
```

**Acceptance Criteria:**
- [ ] Tier gating implemented
- [ ] PRO users blocked from AI
- [ ] SULTAN users get full access
- [ ] Error messages helpful
- [ ] Upgrade prompts clear

---

## 🎨 PHASE 4: UI/UX UPDATES (Week 4-5)

### Task 4.1: Update Pricing Page

**File:** `src/app/(protected)/fitur/upgrade/page.tsx`

**Design Requirements:**
- [ ] 3-tier card layout (Starter/Pro/Sultan)
- [ ] Highlight "Pro" as "BEST VALUE"
- [ ] Clear feature comparison
- [ ] Telegram bot differentiation visible
- [ ] Annual discount shown (17% off)
- [ ] Upgrade CTA buttons prominent

**Acceptance Criteria:**
- [ ] Design matches Figma mockups
- [ ] Responsive on mobile
- [ ] Dark mode supported
- [ ] All features listed correctly
- [ ] Pricing accurate

---

### Task 4.2: Add Tier Badges

**Components to Update:**
- `src/frontend/components/BottomNav.tsx`
- `src/app/(protected)/profile/page.tsx`
- `src/app/(protected)/dashboard/page.tsx`

**Badge Design:**
```tsx
// Starter
<div className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
  STARTER
</div>

// Pro
<div className="px-2 py-1 bg-sky-100 text-sky-600 text-xs font-bold rounded-full">
  PRO
</div>

// Sultan
<div className="px-2 py-1 bg-amber-100 text-amber-600 text-xs font-bold rounded-full">
  SULTAN 👑
</div>
```

**Acceptance Criteria:**
- [ ] Badge visible in profile
- [ ] Badge visible in settings
- [ ] Color-coded by tier
- [ ] Consistent across app

---

### Task 4.3: Create Upgrade Prompts

**File:** `src/frontend/components/UpgradePrompt.tsx` (NEW)

```tsx
interface UpgradePromptProps {
  feature: string;
  currentTier: string;
  limit?: number;
  usage?: number;
}

export function UpgradePrompt({ feature, currentTier, limit, usage }: UpgradePromptProps) {
  const nextTier = currentTier === 'starter' ? 'pro' : 'sultan';
  const price = nextTier === 'pro' ? 'Rp 29rb' : 'Rp 49rb';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-2xl border border-sky-200 dark:border-sky-800"
    >
      <h4 className="font-bold text-slate-900 dark:text-white mb-2">
        🚀 Upgrade ke {nextTier.toUpperCase()}
      </h4>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
        {getUpgradeMessage(feature, limit, usage)}
      </p>
      <div className="flex gap-2">
        <Link
          href="/fitur/upgrade"
          className="flex-1 py-2 bg-sky-500 text-white text-sm font-bold rounded-xl text-center"
        >
          Upgrade ({price}/bulan)
        </Link>
        <button className="px-4 py-2 text-slate-500 text-sm font-medium">
          Nanti
        </button>
      </div>
    </motion.div>
  );
}

function getUpgradeMessage(feature: string, limit?: number, usage?: number): string {
  if (feature === 'transactions') {
    return `Kamu sudah catat ${usage} dari ${limit} transaksi bulan ini. Upgrade untuk unlimited!`;
  }
  if (feature === 'ai_chats') {
    return `Kamu sudah pakai ${usage} dari ${limit} AI chats hari ini. Upgrade untuk 100 chats/hari!`;
  }
  if (feature === 'telegram_bot') {
    return 'Fitur Telegram bot hanya untuk PRO dan SULTAN. Upgrade sekarang!';
  }
  return 'Upgrade untuk akses fitur lebih lengkap!';
}
```

**Acceptance Criteria:**
- [ ] Prompt shows at 75% usage
- [ ] Prompt shows at 100% usage
- [ ] Clear upgrade CTA
- [ ] Dismissible
- [ ] Tracks impressions

---

### Task 4.4: Add Usage Indicators

**File:** `src/frontend/components/UsageIndicator.tsx` (NEW)

```tsx
interface UsageIndicatorProps {
  feature: string;
  current: number;
  limit: number;
  tier: string;
}

export function UsageIndicator({ feature, current, limit, tier }: UsageIndicatorProps) {
  const percentage = Math.min((current / limit) * 100, 100);
  const isWarning = percentage >= 75;
  const isDanger = percentage >= 90;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {feature}
        </span>
        <span className="text-slate-500">
          {current} / {limit === Infinity ? '∞' : limit}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={cn(
            "h-full rounded-full transition-colors",
            isDanger ? "bg-rose-500" :
            isWarning ? "bg-amber-500" : "bg-emerald-500"
          )}
        />
      </div>
      {isWarning && (
        <p className="text-xs text-amber-600 font-medium">
          ⚠️ Hampir mencapai batas!
        </p>
      )}
      {isDanger && (
        <p className="text-xs text-rose-600 font-medium">
          🔴 Segera mencapai batas!
        </p>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows current usage
- [ ] Shows limit
- [ ] Progress bar color-coded
- [ ] Warning at 75%
- [ ] Danger at 90%
- [ ] Shows ∞ for unlimited

---

## 🚀 PHASE 5: SOFT LAUNCH (Week 6)

### Task 5.1: Launch to 10% Users

**Steps:**
1. Enable new tier structure for 10% of users
2. Monitor for errors/bugs
3. Gather initial feedback
4. Track conversion rates

**Monitoring:**
- [ ] Error rates in Sentry
- [ ] Conversion funnel in analytics
- [ ] User feedback in support tickets
- [ ] Server performance metrics

---

### Task 5.2: A/B Test Pricing Messages

**Test Variants:**

```
Variant A: "Rp 29rb/bulan"
Variant B: "Cuma Rp 967/hari" (29K / 30)
Variant C: "50% OFF bulan pertama"

Measure:
- Click-through rate
- Conversion rate
- Revenue per user
```

**Tools:**
- Google Optimize or VWO
- Mixpanel for analytics
- Internal A/B testing framework

---

### Task 5.3: Iterate Based on Data

**Metrics to Watch:**
- Free → Pro conversion rate (target: 8-10%)
- Pro → Sultan conversion rate (target: 5-8%)
- Churn rate (target: <5%)
- MRR growth
- User feedback sentiment

**Iteration Process:**
1. Collect data for 1 week
2. Identify bottlenecks
3. Implement fixes
4. Re-test

---

## 📈 PHASE 6: FULL LAUNCH (Week 7+)

### Task 6.1: Launch Promotion

**Promotion Details:**
- 50% OFF first month for all tiers
- Valid for 2 weeks
- Promote via:
  - Email blast
  - Social media
  - In-app banners
  - Influencer partnerships

---

### Task 6.2: Content Marketing Push

**Content Plan:**
- Blog post: "Monev Tier Baru: Lebih Murah, Lebih Lengkap!"
- YouTube video: "Cara Upgrade Tier Monev"
- Instagram carousel: "Starter vs Pro vs Sultan: Mana yang Cocok Buat Kamu?"
- TikTok: "Upgrade Monev cuma Rp 29rb, worth it gak?"

---

### Task 6.3: Monitor & Optimize Daily

**Daily Tasks:**
- Check conversion rates
- Review support tickets
- Monitor server performance
- Respond to user feedback
- Optimize underperforming areas

**Weekly Tasks:**
- Revenue report
- Conversion funnel analysis
- User feedback summary
- A/B test results
- Plan next week's optimizations

---

## 📊 SUCCESS METRICS

### Conversion Metrics

| Metric | Target | Week 6 (Soft) | Week 8 (Full) |
|---|---|---|---|
| Free → Pro (30 days) | 8-10% | TBD | TBD |
| Free → Pro (90 days) | 15-18% | TBD | TBD |
| Pro → Sultan | 5-8% | TBD | TBD |
| Annual Plan Adoption | 30% | TBD | TBD |

### Revenue Metrics

| Metric | Target | Month 1 | Month 3 | Month 6 |
|---|---|---|---|---|
| Total Users | - | 5,000 | 10,000 | 20,000 |
| Paid Users | 15% | 750 | 1,500 | 3,000 |
| MRR | Rp 65M | TBD | TBD | TBD |

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Conversion Rate Lower Than Expected

**Probability:** MEDIUM

**Mitigation:**
- A/B test pricing messages
- Improve upgrade prompts
- Add limited-time offers
- Enhance free tier limitations (if needed)

---

### Risk 2: Technical Issues at Launch

**Probability:** LOW

**Mitigation:**
- Thorough testing in soft launch
- Rollback plan ready
- 24/7 monitoring during launch week
- Support team on standby

---

### Risk 3: User Backlash on Tier Changes

**Probability:** LOW

**Mitigation:**
- Grandfather existing users (keep old pricing for 6 months)
- Clear communication about value increase
- Offer discount for early adopters
- Responsive customer support

---

## ✅ CHECKLIST SUMMARY

### Pre-Launch
- [ ] Documentation updated
- [ ] Code implemented
- [ ] Tests passing
- [ ] Design assets ready
- [ ] Marketing materials ready

### Soft Launch (Week 6)
- [ ] 10% users enabled
- [ ] Monitoring in place
- [ ] Feedback collection ready
- [ ] Rollback plan ready

### Full Launch (Week 7+)
- [ ] 100% users enabled
- [ ] Promotion running
- [ ] Content published
- [ ] Daily monitoring active

---

**Document Status:** ✅ Ready for Execution  
**Version:** 3.0  
**Timeline:** 6-7 weeks  
**Owner:** Development Team  
**Approved by:** Pending Bos Alip approval

---

**🦭 Maintained for Bos Alip**
