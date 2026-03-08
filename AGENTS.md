# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

**Monev** - Indonesian personal finance app built with Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, SQLite via Drizzle ORM, and next-auth v5 (beta). UI is in Indonesian. Currency is IDR.

## Build / Lint / Test Commands

```bash
# Development
npm run dev                          # Start dev server (Webpack, 4GB heap)
npm run dev:clean                    # Kill node processes + restart dev
npm run dev:reset                    # Kill + clean caches + restart dev

# Production
npm run build                        # Build for production (Webpack)
npm run start                        # Start production server

# Linting (ESLint 9 flat config)
npm run lint                         # Lint entire project
npx eslint src/path/to/file.tsx      # Lint single file
npx eslint --fix src/path/to/file.tsx  # Auto-fix single file

# Unit tests (Vitest)
npm run test                         # Run all unit tests once
npm run test:watch                   # Run tests in watch mode
npx vitest run src/lib/validations.test.ts          # Run single test file
npx vitest run -t "test name"                       # Run single test by name

# E2E tests (Playwright) - requires running dev server
npx playwright test                  # Run all E2E tests
npx playwright test tests/login.spec.ts              # Run single spec
npx playwright test --project=chromium               # Run specific browser

# Database (Drizzle ORM + SQLite)
npx drizzle-kit push                 # Push schema to local sqlite.db
npx drizzle-kit generate             # Generate migration files
npx drizzle-kit migrate              # Run migrations (local)
npx drizzle-kit migrate --config=drizzle.config.prod.ts  # Run migrations (prod)
npx drizzle-kit studio               # Open Drizzle Studio GUI
```

## Code Style

### Formatting
- **Indent**: 4 spaces (no tabs)
- **Semicolons**: always required
- **Quotes**: double quotes (`"`) for imports and JSX attributes; double quotes preferred in TS logic
- **Trailing commas**: yes, in multi-line objects/arrays
- **Max line length**: ~100 characters (soft limit)
- **No Prettier** configured - follow existing patterns

### Naming Conventions
| Category | Convention | Example |
|---|---|---|
| Component files | PascalCase.tsx | `TransactionItem.tsx` |
| Non-component files | kebab-case.ts | `api-client.ts`, `cache-manager.ts` |
| Components | PascalCase, `export function` | `export function TransactionItem()` |
| Functions/variables | camelCase | `formatCurrency`, `handleSubmit` |
| Props interfaces | PascalCase + `Props` suffix | `interface TransactionFormProps` |
| Types (data) | PascalCase | `type TransactionWithCategory` |
| Schema-inferred types | PascalCase | `type User = typeof users.$inferSelect` |
| True constants | UPPER_SNAKE_CASE | `CATEGORY_STYLES`, `CURRENCY_CONFIG` |
| DB table names | camelCase | `userSettings`, `billPayments` |
| DB column names | snake_case | `user_id`, `created_at` |
| API route files | `route.ts` in directory | `api/transactions/route.ts` |

### Import Order
```typescript
"use client"; // 1. Directive (only if using hooks/browser APIs)

// 2. React / Next.js built-ins
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// 3. External libraries
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Wallet, TrendingUp } from "lucide-react";

// 4. Internal @/ alias imports
import { cn, formatCurrency } from "@/frontend/lib/utils";
import { TransactionItem } from "@/frontend/components/TransactionItem";
import { getDb } from "@/backend/db";
import type { Transaction } from "@/types";

// 5. Relative imports (avoid when possible)
import { helper } from "./helper";
```

### Component Pattern
```typescript
"use client";

import { useState } from "react";
import { cn } from "@/frontend/lib/utils";

interface MyComponentProps {
    label: string;
    variant?: "primary" | "secondary";
    onAction?: () => void;
}

export function MyComponent({ label, variant = "primary", onAction }: MyComponentProps) {
    const [active, setActive] = useState(false);
    return (
        <div className={cn("p-4 rounded-xl", active && "bg-primary/10")}>
            {label}
        </div>
    );
}
```

Key rules:
- Use `export function` declarations (not arrow functions, not `React.FC`)
- Props via `interface` with destructuring in the function signature
- Default values inline in destructuring: `variant = "primary"`
- `"use client"` only when using hooks or browser APIs
- Always import `cn` from `@/frontend/lib/utils` for conditional classes

### TypeScript
- **Strict mode** is on (`tsconfig.json`)
- Use `interface` for component props (extensible); use `type` for unions, data shapes, inferred types
- Avoid `any` - use `unknown` with type guards
- Path alias: `@/*` maps to `./src/*`
- Nullable: `?` for optional props, `| null` for explicit null state
- Schema types inferred from Drizzle: `typeof table.$inferSelect`, `createInsertSchema(table)`

### API Route Pattern
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const db = getDb();
        // ... query
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
```

Key rules:
- Always check `auth()` session first; return 401 if missing
- Response envelope: `{ success: boolean, data?: ..., error?: string }`
- Wrap in try/catch; `console.error` the error; return 500
- Use `Request` (not `NextRequest`) as parameter type in most cases

### Error Handling
- **API routes**: try/catch with `console.error` + JSON error response (status 400/401/500)
- **Components**: try/catch with `console.error` + user-facing state (`useState<string | null>`)
- **Nested try/catch** for non-critical ops (e.g., email sending) so main flow continues
- User-facing error messages are in **Indonesian**

### Styling (Tailwind CSS v4)
- Use `cn()` (clsx + tailwind-merge) for all conditional classes
- Class order: layout > spacing > sizing > colors > effects > transitions > dark: variants
- Custom CSS classes in `globals.css`: `glass`, `glass-card`, `card-clean`, `btn-primary`, `btn-secondary`, `input-modern`, `icon-box`
- Design tokens via CSS variables (`--primary`, `--background`, `--radius`, etc.)
- Dark mode via `class` strategy; use `dark:` variants
- Animations: `framer-motion` for page transitions and interactive elements

### Database (Drizzle + SQLite)
- Schema: `src/backend/db/schema.ts` | Connection: `src/backend/db/index.ts`
- Operations: `src/backend/db/operations.ts`, `account-operations.ts`, `budget-operations.ts`
- `getDb()` returns a singleton (survives HMR via `globalThis`)
- Tables use `sqliteTable()`, auto-increment integer PKs, `integer(..., { mode: "timestamp" })` for dates
- Booleans: `integer(..., { mode: "boolean" })`; Enums: `text(..., { enum: [...] })`
- Local DB file: `sqlite.db` (gitignored); Production: `/app/data/sqlite.db`

## File Organization
```
src/
├── app/                      # Next.js App Router
│   ├── (protected)/          # Auth-required routes (dashboard, transactions, etc.)
│   ├── admin/                # Admin panel routes
│   ├── api/                  # API route handlers
│   ├── login/ register/      # Public auth pages
│   ├── onboarding/           # Onboarding flow
│   ├── globals.css           # Global styles + Tailwind config
│   └── layout.tsx            # Root layout (Server Component)
├── frontend/
│   ├── components/           # ~40 React components (all "use client")
│   ├── hooks/                # Custom hooks (useAccountsData, useHaptics, etc.)
│   └── lib/                  # Utils, contexts (utils.ts, theme-context, i18n-context)
├── backend/
│   ├── db/                   # Schema, connection, operations
│   └── actions/              # Server actions (auth, profile, onboarding)
├── lib/                      # Shared server utilities (AI, rate-limit, encryption, etc.)
├── types/index.ts            # Shared TypeScript types
├── components/               # Cross-cutting providers (Providers, SecurityProvider)
├── auth.ts                   # next-auth configuration
└── auth.config.ts            # Auth provider config
```

## Localization
- All UI text is in **Indonesian** (hardcoded, not i18n keys in most places)
- Partial i18n via `useI18n()` context and `t()` function (BottomNav, some components)
- Currency: `formatCurrency()` from `@/frontend/lib/utils` - defaults to IDR, `Intl.NumberFormat("id-ID")`
- Date formatting: `date-fns` with `{ locale: id }` for Indonesian locale
- Category names, error messages, and labels are all in Indonesian

## Key Libraries
| Purpose | Library |
|---|---|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS v4, clsx, tailwind-merge |
| Icons | lucide-react |
| Animation | framer-motion |
| Database | drizzle-orm, better-sqlite3 |
| Auth | next-auth v5 (beta) |
| AI | openai, ai SDK (Vercel) |
| Dates | date-fns |
| Charts | recharts |
| Validation | drizzle-zod, zod |
| PDF | jspdf, jspdf-autotable |
| Mobile | Capacitor (Android APK) |
| Email | resend |

## Environment Variables (.env.local)
`OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `AUTH_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
