# AGENTS.md - Coding Guidelines for Monev

## Project Overview
Next.js 16+ financial app with React 19, TypeScript, Tailwind CSS v4, and Supabase backend.

## Build Commands

```bash
# Development
npm run dev              # Start Next.js dev server (Turbopack)

# Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint
npx eslint src/path/file.tsx  # Lint specific file
```

**No test framework is currently configured.**

## Code Style Guidelines

### Formatting
- Indent: 4 spaces
- Max line length: 100 characters
- Use double quotes in JSX attributes, single quotes in TypeScript
- Semicolons: required
- Trailing commas: use in multi-line objects/arrays

### Naming Conventions
- **Components**: PascalCase (e.g., `TransactionItem.tsx`)
- **Functions/Variables**: camelCase (e.g., `formatCurrency`)
- **Types/Interfaces**: PascalCase (e.g., `Transaction`, `User`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: Match the default export name

### Imports
```typescript
// 1. External libraries (sorted alphabetically)
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee } from "lucide-react";

// 2. Internal absolute imports with @/ alias
import { BottomNav } from "@/components/BottomNav";
import { Transaction } from "@/types";

// 3. Relative imports (avoid if possible)
import { helper } from "../lib/helper";

// Type imports
import type { Metadata } from "next";
```

### Component Structure
```typescript
"use client"; // If using hooks/browser APIs

import { cn } from "@/lib/utils"; // Always import cn utility

// Props interface
interface ComponentProps {
    label: string;
    onClick?: () => void;
}

// Function declaration (preferred)
export function ComponentName({ label, onClick }: ComponentProps) {
    return <div className={cn("...")}>{label}</div>;
}
```

### Styling (Tailwind)
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Order: layout → spacing → sizing → colors → effects → interactions
- Use `group-hover:` and `active:` for interactive states
- Custom colors via CSS variables in `globals.css`
- Avoid arbitrary values (e.g., `w-[100px]`) - use design tokens

### TypeScript
- Enable strict mode (configured in tsconfig.json)
- Explicit return types on exported functions
- Use `type` for unions/objects, `interface` for extensible contracts
- Avoid `any` - use `unknown` with type guards
- Nullable types: use `?` for optional, `| null` for explicit null

### Error Handling
```typescript
try {
    const result = await asyncOperation();
    return result;
} catch (error) {
    console.error("Operation failed:", error);
    // Return user-friendly error or rethrow
    throw new Error("Failed to process request");
}
```

### API Routes (App Router)
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Validate input
        if (!body.field) {
            return NextResponse.json({ error: "Missing field" }, { status: 400 });
        }
        // Process...
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
```

### File Organization
```
src/
├── app/               # Next.js App Router
│   ├── page.tsx       # Route page
│   ├── layout.tsx     # Root layout
│   └── api/           # API routes
├── components/        # React components
├── lib/               # Utilities (cn, formatters)
└── types/             # TypeScript types
```

### Key Libraries
- **UI**: Tailwind CSS v4, lucide-react (icons)
- **Utils**: clsx, tailwind-merge (via `cn()`)
- **Dates**: date-fns
- **Animation**: framer-motion
- **DB**: @supabase/supabase-js

### Localization
- UI uses Indonesian language ("Selamat Sore", "Riwayat Terbaru")
- Currency: IDR format with `formatCurrency()` utility

### Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
TELEGRAM_BOT_TOKEN=
```
