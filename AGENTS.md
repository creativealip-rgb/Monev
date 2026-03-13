# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

**Monev** - Indonesian personal finance app. Stack: Next.js 16, React 19, TypeScript (strict), Tailwind CSS v4, SQLite via Drizzle ORM, next-auth v5. UI in Indonesian. Currency: IDR.

## Build / Lint / Test Commands

```bash
# Development
npm run dev                          # Start dev server (Webpack, 4GB heap)
npm run dev:clean                    # Kill node + restart dev
npm run dev:reset                    # Kill + clean caches + restart dev

# Production
npm run build                        # Build for production
npm run start                        # Start production server

# Linting (ESLint 9 flat config)
npm run lint                         # Lint entire project
npx eslint src/path/to/file.tsx      # Lint single file
npx eslint --fix src/path/to/file.tsx  # Auto-fix single file

# Unit tests (Vitest)
npm run test                         # Run all unit tests
npm run test:watch                   # Run tests in watch mode
npx vitest run src/lib/validations.test.ts  # Run single test file
npx vitest run -t "test name"               # Run single test by name
npx vitest src/lib/validations.test.ts      # Watch single file

# E2E tests (Playwright) - requires dev server running
npx playwright test                  # Run all E2E tests
npx playwright test tests/login.spec.ts     # Run single spec

# Database (Drizzle ORM + SQLite)
npx drizzle-kit push                 # Push schema to local sqlite.db
npx drizzle-kit generate             # Generate migration files
npx drizzle-kit migrate              # Run migrations (local)
npx drizzle-kit studio               # Open Drizzle Studio GUI
```

## Code Style

### Formatting
- **Indent**: 4 spaces (no tabs)
- **Semicolons**: always required
- **Quotes**: double quotes for imports/JSX/TS
- **Trailing commas**: yes, in multi-line
- **Max line**: ~100 chars (soft limit)
- **No Prettier** - follow existing patterns

### Naming Conventions
| Category | Convention | Example |
|---|---|---|
| Component files | PascalCase.tsx | `TransactionItem.tsx` |
| Non-component files | kebab-case.ts | `api-client.ts` |
| Components | `export function` PascalCase | `export function Button()` |
| Functions/vars | camelCase | `formatCurrency` |
| Props interfaces | PascalCase + Props | `interface ButtonProps` |
| Data types | PascalCase | `type TransactionWithCategory` |
| True constants | UPPER_SNAKE_CASE | `CURRENCY_CONFIG` |
| DB tables | camelCase | `userSettings` |
| DB columns | snake_case | `user_id`, `created_at` |

### Import Order
```typescript
"use client"; // 1. Directive (only for hooks/browser APIs)
// 2. React / Next.js
import { useState } from "react";
import { usePathname } from "next/navigation";
// 3. External libraries
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
// 4. Internal @/ imports
import { cn } from "@/frontend/lib/utils";
import { Button } from "@/frontend/components/Button";
import type { Transaction } from "@/types";
// 5. Relative imports (avoid when possible)
import { helper } from "./helper";
```

### Component Pattern
```typescript
"use client";
import { useState } from "react";
import { cn } from "@/frontend/lib/utils";

interface ButtonProps {
    label: string;
    variant?: "primary" | "secondary";
    onClick?: () => void;
}

export function Button({ label, variant = "primary", onClick }: ButtonProps) {
    const [active, setActive] = useState(false);
    return (
        <button className={cn("px-4 py-2", variant === "primary" && "bg-primary")} onClick={onClick}>
            {label}
        </button>
    );
}
```

**Rules**: Use `export function` (not arrow functions). Props via `interface` with destructuring. `"use client"` only when using hooks/browser APIs. Always use `cn()` for conditional classes.

### TypeScript
- **Strict mode** enabled
- Use `interface` for props; `type` for unions/data shapes
- Avoid `any` - use `unknown` with type guards
- Path alias: `@/*` maps to `./src/*`
- Nullable: `?` for optional, `| null` for explicit null
- Drizzle types: `typeof table.$inferSelect`, `createInsertSchema(table)`

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

**Rules**: Always check `auth()` first; return 401 if missing. Response envelope: `{ success, data?, error? }`. Wrap in try/catch; `console.error` the error. Use `Request` (not `NextRequest`).

### Error Handling
- **API routes**: try/catch + `console.error` + JSON error response (400/401/500)
- **Components**: try/catch + `console.error` + user-facing state (`useState<string | null>`)
- **Nested try/catch** for non-critical ops so main flow continues
- Use `logger` utility from `@/lib/logger` when available
- User-facing messages in **Indonesian**

### Styling (Tailwind CSS v4)
- Use `cn()` for all conditional classes
- Class order: layout > spacing > sizing > colors > effects > transitions > dark:
- Custom classes: `glass`, `glass-card`, `card-clean`, `btn-primary`, `btn-secondary`, `input-modern`, `icon-box`
- Design tokens via CSS variables (`--primary`, `--background`, `--radius`)
- Dark mode via `class` strategy; use `dark:` variants
- Animations: `framer-motion` for page transitions

### Database (Drizzle + SQLite)
- Schema: `src/backend/db/schema.ts` | Connection: `src/backend/db/index.ts`
- Operations: `src/backend/db/operations/*.ts` (domain-specific files)
- `getDb()` returns singleton (survives HMR via `globalThis`)
- Tables: `sqliteTable()`, auto-increment int PKs, `integer(..., { mode: "timestamp" })` for dates
- Booleans: `integer(..., { mode: "boolean" })`; Enums: `text(..., { enum: [...] })`
- Local DB: `sqlite.db` (gitignored); Production: `/app/data/sqlite.db`

## File Organization
```
src/
├── app/                      # Next.js App Router
│   ├── (protected)/          # Auth-required routes
│   ├── admin/                # Admin panel
│   ├── api/                  # API routes
│   ├── login/ register/      # Public auth pages
│   ├── onboarding/           # Onboarding flow
│   └── globals.css           # Global styles
├── frontend/
│   ├── components/           # React components (all "use client")
│   ├── hooks/                # Custom hooks
│   └── lib/                  # Utils, contexts
├── backend/
│   ├── db/                   # Schema, connection, operations/*
│   └── actions/              # Server actions
├── lib/                      # Shared utilities (constants, logger, ai)
├── types/index.ts            # Shared types
├── auth.ts                   # next-auth config
└── auth.config.ts            # Auth provider config
```

## Localization
- UI text in **Indonesian** (hardcoded, not i18n keys)
- Partial i18n via `useI18n()` context and `t()` function
- Currency: `formatCurrency()` from `@/frontend/lib/utils` - IDR default, `Intl.NumberFormat("id-ID")`
- Dates: `date-fns` with `{ locale: id }`
- Category names, errors, labels in Indonesian

## Key Libraries
| Purpose | Library |
|---|---|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS v4, clsx, tailwind-merge |
| Icons | lucide-react |
| Animation | framer-motion |
| Database | drizzle-orm, better-sqlite3 |
| Auth | next-auth v5 (beta) |
| AI | openai, ai SDK |
| Dates | date-fns |
| Charts | recharts, chart.js |
| Validation | drizzle-zod, zod |
| PDF | jspdf, jspdf-autotable |
| Mobile | Capacitor |
| Email | resend |

## Environment Variables (.env.local)
`OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `AUTH_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`