import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, getRawDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { addMonths, getMayarApiKey, isMayarTier } from "@/lib/mayar";

export const runtime = "nodejs";

type MayarInvoice = {
    id?: string;
    status?: string;
    amount?: number;
    transactions?: Array<{
        id?: string;
        status?: string;
        extraData?: Record<string, unknown>;
    }>;
};

function ensurePaymentTable() {
    const rawDb = getRawDb();
    rawDb.exec(`
        CREATE TABLE IF NOT EXISTS payment_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT NOT NULL,
            provider_event_id TEXT NOT NULL,
            provider_transaction_id TEXT,
            user_id INTEGER,
            tier TEXT,
            status TEXT,
            payload TEXT NOT NULL,
            processed_at INTEGER NOT NULL,
            UNIQUE(provider, provider_event_id)
        );
    `);
}

function getPaidTransaction(invoice: MayarInvoice, userId: number, tier: string) {
    if (String(invoice.status || "").toLowerCase() !== "paid") return null;

    return invoice.transactions?.find((transaction) => {
        const status = String(transaction.status || "").toLowerCase();
        const extraData = transaction.extraData || {};
        return status === "paid" &&
            String(extraData.userId || extraData.user_id || "") === String(userId) &&
            extraData.tier === tier;
    }) || null;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await req.json().catch(() => ({}));
    if (!isMayarTier(tier)) {
        return NextResponse.json({ success: false, error: "Paket tidak valid" }, { status: 400 });
    }

    const apiKey = getMayarApiKey();
    if (!apiKey) {
        return NextResponse.json({ success: false, error: "Mayar API key belum dikonfigurasi" }, { status: 500 });
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
        return NextResponse.json({ success: false, error: "ID pengguna tidak valid" }, { status: 400 });
    }

    const mayarResponse = await fetch("https://api.mayar.id/hl/v1/invoice?page=1&pageSize=20", {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
        },
        cache: "no-store",
    });

    const data = await mayarResponse.json().catch(() => null);
    if (!mayarResponse.ok || data?.statusCode >= 400) {
        return NextResponse.json(
            { success: false, error: data?.messages || "Gagal mengecek status pembayaran Mayar" },
            { status: 502 }
        );
    }

    const invoices = Array.isArray(data?.data) ? data.data as MayarInvoice[] : [];
    const paidInvoice = invoices.find((invoice) => getPaidTransaction(invoice, userId, tier));
    const paidTransaction = paidInvoice ? getPaidTransaction(paidInvoice, userId, tier) : null;

    if (!paidInvoice || !paidTransaction?.id) {
        return NextResponse.json({ success: true, paid: false });
    }

    ensurePaymentTable();
    const rawDb = getRawDb();
    const eventId = paidTransaction.id;
    const existing = rawDb.prepare("SELECT id FROM payment_events WHERE provider = ? AND provider_event_id = ?").get("mayar", eventId);
    if (existing) {
        return NextResponse.json({ success: true, paid: true, duplicate: true, tier });
    }

    const db = getDb();
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) {
        return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    const currentExpiry = user.tierExpiresAt && user.tierExpiresAt > new Date() ? user.tierExpiresAt : new Date();
    const tierExpiresAt = addMonths(currentExpiry, 1);

    await db.update(users)
        .set({ tier, tierExpiresAt })
        .where(eq(users.id, user.id))
        .run();

    rawDb.prepare(`
        INSERT INTO payment_events (provider, provider_event_id, provider_transaction_id, user_id, tier, status, payload, processed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run("mayar", eventId, paidTransaction.id, user.id, tier, "paid", JSON.stringify(paidInvoice), Date.now());

    return NextResponse.json({ success: true, paid: true, userId: user.id, tier, tierExpiresAt: tierExpiresAt.toISOString() });
}
