import { NextRequest, NextResponse } from "next/server";
import { getDb, getRawDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { addMonths, getTierDurationMonths, isMayarTier, MAYAR_TIER_CONFIG, MayarTier } from "@/lib/mayar";

export const runtime = "nodejs";

type MayarWebhookPayload = {
    event?: string;
    data?: Record<string, unknown>;
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

function getExtraData(data: Record<string, unknown>) {
    const extra = data.extraData ?? data.extra_data ?? data.metadata ?? {};
    if (typeof extra === "string") {
        try {
            return JSON.parse(extra);
        } catch {
            return {};
        }
    }
    return extra && typeof extra === "object" ? extra : {};
}

function inferTier(data: Record<string, unknown>, extraData: Record<string, unknown>): MayarTier | null {
    if (isMayarTier(extraData.tier)) return extraData.tier;

    const product = data.product && typeof data.product === "object" ? data.product as Record<string, unknown> : {};
    const paymentLinkId = String(data.paymentLinkId || data.productId || product.id || "");
    const productName = String(data.productName || product.name || data.description || "").toLowerCase();
    const amount = Number(data.amount || data.totalAmount || data.grossAmount || data.price || 0);

    if (paymentLinkId === "7b42d776-45bc-4436-b289-9c4340709c6c" || productName.includes("pro") || amount === MAYAR_TIER_CONFIG.pro.amount) {
        return "pro";
    }
    if (paymentLinkId === "56504daa-989d-421d-a384-02bf90b9e34b" || productName.includes("sultan") || amount === MAYAR_TIER_CONFIG.sultan.amount) {
        return "sultan";
    }
    if (
        paymentLinkId === "f8d86c2f-4a69-4ae6-80ba-355aba09f35e" ||
        productName.includes("benefactor") ||
        productName.includes("benefector") ||
        amount === MAYAR_TIER_CONFIG.benefactor.amount
    ) {
        return "benefactor";
    }

    return null;
}

function getPaidStatus(data: Record<string, unknown>) {
    const status = String(data.transactionStatus || data.status || "").toLowerCase();
    return status === "paid" || status === "success" || status === "settlement";
}

function readWebhookSecret(req: NextRequest) {
    return req.headers.get("x-mayar-webhook-secret") || req.headers.get("x-webhook-secret") || new URL(req.url).searchParams.get("secret") || "";
}

export async function POST(req: NextRequest) {
    const configuredSecret = process.env.MAYAR_WEBHOOK_SECRET;
    if (configuredSecret && readWebhookSecret(req) !== configuredSecret) {
        return NextResponse.json({ success: false, error: "Invalid webhook secret" }, { status: 401 });
    }

    const payload = (await req.json().catch(() => null)) as MayarWebhookPayload | null;
    if (!payload?.data) {
        return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const { event, data } = payload;
    if (event && event !== "payment.received") {
        return NextResponse.json({ success: true, ignored: true, reason: "Unsupported event" });
    }
    if (!getPaidStatus(data)) {
        return NextResponse.json({ success: true, ignored: true, reason: "Payment not paid" });
    }

    ensurePaymentTable();

    const extraData = getExtraData(data);
    const tier = inferTier(data, extraData);
    const userId = Number(extraData.userId || extraData.user_id);
    const customerEmail = typeof data.customerEmail === "string" ? data.customerEmail : undefined;
    const transactionId = String(data.transactionId || data.id || "");
    const eventId = transactionId || `${customerEmail || "unknown"}-${Date.now()}`;

    const rawDb = getRawDb();
    const existing = rawDb.prepare("SELECT id FROM payment_events WHERE provider = ? AND provider_event_id = ?").get("mayar", eventId);
    if (existing) {
        return NextResponse.json({ success: true, duplicate: true });
    }

    if (!tier) {
        return NextResponse.json({ success: false, error: "Tidak bisa menentukan paket dari webhook" }, { status: 400 });
    }

    const db = getDb();
    const user = Number.isFinite(userId)
        ? await db.select().from(users).where(eq(users.id, userId)).get()
        : customerEmail
            ? await db.select().from(users).where(eq(users.email, customerEmail)).get()
            : undefined;

    if (!user) {
        return NextResponse.json({ success: false, error: "User tidak ditemukan untuk pembayaran ini" }, { status: 404 });
    }

    const currentExpiry = user.tierExpiresAt && user.tierExpiresAt > new Date() ? user.tierExpiresAt : new Date();
    const tierExpiresAt = addMonths(currentExpiry, getTierDurationMonths(tier));

    await db.update(users)
        .set({ tier, tierExpiresAt })
        .where(eq(users.id, user.id))
        .run();

    rawDb.prepare(`
        INSERT INTO payment_events (provider, provider_event_id, provider_transaction_id, user_id, tier, status, payload, processed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run("mayar", eventId, transactionId || null, user.id, tier, "paid", JSON.stringify(payload), Date.now());

    return NextResponse.json({ success: true, userId: user.id, tier, tierExpiresAt: tierExpiresAt.toISOString() });
}
