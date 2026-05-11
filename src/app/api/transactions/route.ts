import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
    getCategories,
    getTransactions,
    getTransactionsCount,
    createTransaction,
    searchTransactions
} from "@/backend/db/operations";
import { getAccountById } from "@/backend/db/account-operations";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/api-rate-limit";
import type { TransactionWithCategory } from "@/types";

const logger = createLogger("API:Transactions");

const transactionSchema = z.object({
    amount: z.coerce.number().positive().max(1_000_000_000),
    description: z.string().trim().max(300).optional(),
    merchantName: z.string().trim().max(120).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    type: z.enum(["expense", "income", "transfer"]),
    paymentMethod: z.string().trim().max(40).default("cash"),
    accountId: z.coerce.number().int().positive(),
    targetAccountId: z.coerce.number().int().positive().nullable().optional(),
    date: z.coerce.date().optional(),
});

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");
        const search = searchParams.get("search") || undefined;
        const categoryId = searchParams.get("categoryId");
        const accountId = searchParams.get("accountId");
        const type = searchParams.get("type") as "expense" | "income" | "transfer" | "all" | null;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const hasAdvancedFilters = Boolean(categoryId || accountId || type || startDateParam || endDateParam);

        const startDate = startDateParam ? new Date(`${startDateParam}T00:00:00.000Z`) : undefined;
        const endDate = endDateParam ? new Date(`${endDateParam}T23:59:59.999Z`) : undefined;

        // Get transactions with pagination
        const transactions = hasAdvancedFilters
            ? await searchTransactions(userId, {
                limit,
                offset,
                search,
                categoryId: categoryId ? parseInt(categoryId, 10) : undefined,
                accountId: accountId ? parseInt(accountId, 10) : undefined,
                type: type || "all",
                startDate,
                endDate,
            })
            : await getTransactions(userId, limit, offset, search);
        const categories = await getCategories(userId);
        const categoryMap = new Map(categories.map((category) => [category.id, category]));
        const enrichedTransactions: TransactionWithCategory[] = transactions.map((transaction) => {
            const category = transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined;

            return {
                ...transaction,
                categoryName: category?.name || "Lainnya",
                categoryColor: category?.color || "#94a3b8",
                categoryIcon: category?.icon || "Wallet",
            };
        });
        
        // Debug: log bill payment transactions
        const billTransactions = enrichedTransactions.filter((t) => t.destinationType === "bill");
        if (billTransactions.length > 0) {
            logger.debug("Bill payment transactions:", billTransactions.map((t) => ({
                id: t.id,
                categoryId: t.categoryId,
                merchantName: t.merchantName,
                description: t.description
            })));
        }

        // Get total count for pagination
        const total = hasAdvancedFilters ? transactions.length : await getTransactionsCount(userId, search);

        return NextResponse.json({
            success: true,
            data: enrichedTransactions,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + enrichedTransactions.length < total
            }
        });
    } catch (error) {
        logger.error("Error fetching transactions:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch transactions" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const rateLimitResponse = await applyRateLimit(request, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json().catch(() => null);
        const parsedBody = transactionSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid transaction payload is required" }, { status: 400 });
        }

        const payload = parsedBody.data;
        const account = await getAccountById(userId, payload.accountId);
        if (!account) {
            return NextResponse.json({ success: false, error: "Account not found" }, { status: 400 });
        }

        if (payload.type === "transfer") {
            if (!payload.targetAccountId || payload.targetAccountId === payload.accountId) {
                return NextResponse.json({ success: false, error: "Valid target account is required" }, { status: 400 });
            }
            const targetAccount = await getAccountById(userId, payload.targetAccountId);
            if (!targetAccount) {
                return NextResponse.json({ success: false, error: "Target account not found" }, { status: 400 });
            }
        }

        const categoryId = payload.categoryId ?? (await getCategories())[0]?.id;
        if (!categoryId) {
            return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
        }

        const transaction = await createTransaction(userId, {
            amount: payload.amount,
            description: payload.description || "Transaksi",
            merchantName: payload.merchantName,
            categoryId,
            type: payload.type,
            paymentMethod: payload.paymentMethod,
            accountId: payload.accountId,
            targetAccountId: payload.type === "transfer" ? payload.targetAccountId! : undefined,
            date: payload.date || new Date(),
        });

        return NextResponse.json({ success: true, data: transaction });
    } catch (error) {
        logger.error("Error creating transaction:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create transaction" },
            { status: 500 }
        );
    }
}
