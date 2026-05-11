import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getAccounts, createAccount, createBalanceAuditEntry } from "@/backend/db/account-operations";
import { createLogger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/api-rate-limit";

const logger = createLogger("API:Accounts");

const accountSchema = z.object({
    name: z.string().trim().min(1, "Nama akun wajib diisi").max(80),
    type: z.enum(["bank", "emoney", "cash", "credit_card", "investment_wallet"]).default("bank"),
    balance: z.coerce.number().nonnegative("Saldo akun tidak valid").max(1_000_000_000).default(0),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
    icon: z.string().trim().min(1).max(40).default("Wallet"),
});

export async function GET() {
    logger.debug("GET /api/accounts - Start");
    try {
        const session = await auth();
        logger.debug("GET /api/accounts - Session:", session?.user?.id);

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        logger.debug("GET /api/accounts - Fetching accounts for userId:", session.user.id);
        const accounts = await getAccounts(Number(session.user.id));
        logger.debug("GET /api/accounts - Success, found:", accounts.length);

        return NextResponse.json({ success: true, data: accounts });
    } catch (error) {
        logger.error("GET /api/accounts - Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch accounts" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    try {
        const rateLimitResponse = await applyRateLimit(req, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const body = await req.json().catch(() => null);
        const parsedBody = accountSchema.safeParse(body);
        if (!parsedBody.success) {
            return NextResponse.json({ success: false, error: "Valid account payload is required" }, { status: 400 });
        }

        const userId = Number(session.user.id);
        const account = await createAccount(userId, parsedBody.data);
        if (parsedBody.data.balance > 0) {
            await createBalanceAuditEntry(userId, {
                accountId: account.id,
                accountName: account.name,
                amount: parsedBody.data.balance,
                kind: "opening_balance",
            });
        }
        return NextResponse.json({ success: true, data: account });
    } catch {
        return NextResponse.json({ success: false, error: "Failed to create account" }, { status: 500 });
    }
}
