# Project: my-agent-finance

This project is a sophisticated personal finance management application built with Next.js, featuring extensive AI capabilities, cross-platform mobile support via Capacitor, and a robust backend with Drizzle ORM and SQLite. It aims to provide an intelligent and interactive way for users to manage their finances.

## Project Overview

**Purpose:** To offer a comprehensive personal finance AI assistant within the terminal, web, and mobile platforms, enabling users to track expenses, manage budgets, set financial goals, and gain insights through intelligent analysis and conversational interaction.

**Main Technologies:**

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS, Framer Motion
*   **Backend:** Next.js (API Routes/Server Actions), Drizzle ORM, SQLite (better-sqlite3)
*   **Authentication:** Next-Auth (Credentials Provider) with `bcryptjs` for password hashing
*   **AI/ML:** OpenAI API (GPT-4o, Whisper) for:
    *   Optical Character Recognition (OCR) for transaction extraction from images (receipts, checkout screenshots).
    *   Voice processing for transcribing and extracting transaction details from audio.
    *   Natural Language Processing (NLP) to understand user intent and extract financial entities from text.
    *   Intelligent transaction categorization with web search integration ("Detective Agent").
    *   Psychological impact analysis of spending habits.
    *   "Impulse Buying Judge" for spending advice.
    *   "Social Debt Collector" for generating debt reminder messages.
    *   Financial insights and analysis based on spending patterns (e.g., 50/30/20 rule).
    *   Processing mobile notifications for automatic transaction logging.
*   **Database:** SQLite managed by Drizzle ORM, with Zod for schema validation.
*   **Mobile/PWA:** Capacitor for cross-platform mobile app development (Android detected), and `@ducanh2912/next-pwa` for Progressive Web App capabilities.
*   **Other:** Supabase integration, Tanstack Query for data management.

**Architecture:** The application leverages Next.js for a full-stack approach, with API routes handling backend logic and AI integrations. Authentication is managed via Next-Auth, and data persistence is handled by Drizzle ORM with a local SQLite database. The client-side utilizes React with Tailwind CSS for a responsive UI, and Capacitor/PWA for mobile deployment. The core AI logic resides in `src/lib/ai.ts`, orchestrating interactions with OpenAI and external services.

**Key Features:**

*   **Transaction Management:** Record, update, and delete expenses/income.
*   **Budgeting:** Set and track monthly budgets per category.
*   **Financial Goals:** Create and manage saving goals with progress tracking.
*   **Bills Management:** Track recurring bills and mark them as paid.
*   **Investment Tracking:** Record and monitor investments.
*   **AI-Powered Inputs:** Input transactions via OCR from images, voice commands, and natural language text.
*   **Intelligent Categorization:** AI-driven categorization of transactions, potentially enhanced by web searches for unknown merchants.
*   **Personalized Insights:** AI provides financial advice, psychological impact of spending, and impulse buying judgments.
*   **Social Debt Reminders:** AI-generated messages for reminding others about debts.
*   **Mobile Notification Processing:** Automatically log transactions from bank SMS or e-wallet notifications.
*   **Authentication:** Secure user authentication with email/password.

## Building and Running

This project uses `npm` as its package manager.

**Development Setup:**

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be accessible at [http://localhost:3000](http://localhost:3000).

**Build and Start (Production):**

1.  **Build the application:**
    ```bash
    npm run build
    ```
2.  **Start the production server:**
    ```bash
    npm run start
    ```

**Linting:**

To check code for style and errors:
```bash
npm run lint
```

**Mobile (Capacitor):**

The project is configured for Capacitor, allowing it to be built into native mobile applications. Specific Capacitor commands would be executed via the Capacitor CLI (e.g., `npx cap add android`, `npx cap sync`, `npx cap open android`).

## Development Conventions

*   **Language:** TypeScript is used throughout the project for type safety.
*   **Styling:** Tailwind CSS is used for utility-first styling.
*   **Database:** Drizzle ORM is used for database interactions with SQLite. Schema definitions are in `src/backend/db/schema.ts`.
*   **Authentication:** Next-Auth is used for user authentication.
*   **AI Integration:** OpenAI API keys are expected via environment variables (`OPENAI_API_KEY`).
*   **Project Structure:** Follows a standard Next.js app router structure with clear separation for `app`, `backend`, `components`, `lib`, and `types`.
*   **Code Quality:** `eslint` is configured for code linting.
