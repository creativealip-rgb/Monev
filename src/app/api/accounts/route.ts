import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAccounts, createAccount, updateAccount, deleteAccount, createBalanceAuditEntry } from "@/backend/db/account-operations";
import { createLogger } from "@/lib/logger";

const logger = createLogger("API:Accounts");
const ACCOUNT_TYPES = new Set(["bank", "emoney", "cash", "credit_card", "investment_wallet"]);

function validateAccountPayload(body: any) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const type = typeof body.type === "string" ? body.type : "bank";
    const balance = body.balance === undefined || body.balance === "" ? 0 : Number(body.balance);

    if (!name) return { error: "Nama akun wajib diisi" };
    if (!ACCOUNT_TYPES.has(type)) return { error: "Tipe akun tidak valid" };
    if (!Number.isFinite(balance) || balance < 0) return { error: "Saldo akun tidak valid" };

    return {
        data: {
            name,
            type,
            balance,
            color: typeof body.color === "string" && body.color.trim() ? body.color : "#3b82f6",
            icon: typeof body.icon === "string" && body.icon.trim() ? body.icon : "Wallet",
        }
    };
}

export async function GET(req: NextRequest) {
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
        const body = await req.json();
        const validated = validateAccountPayload(body);
        if (validated.error) {
            return NextResponse.json({ success: false, error: validated.error }, { status: 400 });
        }

        const userId = Number(session.user.id);
        const account = await createAccount(userId, validated.data!);
        if (validated.data!.balance > 0) {
            await createBalanceAuditEntry(userId, {
                accountId: account.id,
                accountName: account.name,
                amount: validated.data!.balance,
                kind: "opening_balance",
            });
        }
        return NextResponse.json({ success: true, data: account });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to create account" }, { status: 500 });
    }
}
