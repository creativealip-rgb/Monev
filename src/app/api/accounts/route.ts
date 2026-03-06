import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "@/backend/db/account-operations";

export async function GET(req: NextRequest) {
    console.log("[API] GET /api/accounts - Start");
    try {
        const session = await auth();
        console.log("[API] GET /api/accounts - Session:", session?.user?.id);

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        console.log("[API] GET /api/accounts - Fetching accounts for userId:", session.user.id);
        const accounts = await getAccounts(Number(session.user.id));
        console.log("[API] GET /api/accounts - Success, found:", accounts.length);

        return NextResponse.json({ success: true, data: accounts });
    } catch (error) {
        console.error("[API] GET /api/accounts - Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch accounts" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const account = await createAccount(Number(session.user.id), body);
        return NextResponse.json({ success: true, data: account });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to create account" }, { status: 500 });
    }
}
