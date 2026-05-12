import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { mayarPayments, users } from "@/backend/db/schema";

export type MayarPlan = {
    tier?: "pro" | "sultan";
    isBenefector: boolean;
};

type MayarPayload = {
    event?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
};

const PAID_STATUSES = new Set(["paid", "success", "successful", "completed", "settled"]);

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
}

function normalizePayload(payload: MayarPayload): Record<string, unknown> {
    if (payload.data && typeof payload.data === "object") {
        return payload.data;
    }
    return payload;
}

export function isPaidMayarEvent(payload: MayarPayload) {
    const data = normalizePayload(payload);
    const event = asString(payload.event)?.toLowerCase();
    const status = asString(data.transactionStatus ?? data.status ?? payload.status)?.toLowerCase();

    if (event && !event.includes("payment")) return false;
    return status ? PAID_STATUSES.has(status) : event === "payment.received";
}

export function identifyMayarPlan(payload: MayarPayload): MayarPlan {
    const data = normalizePayload(payload);
    const fingerprint = [
        data.productId,
        data.productName,
        data.paymentLinkId,
        data.description,
        data.title,
    ]
        .map((value) => asString(value)?.toLowerCase())
        .filter(Boolean)
        .join(" ");

    const isBenefector = fingerprint.includes("benefector") || fingerprint.includes("benefactor");
    if (fingerprint.includes("sultan")) return { tier: "sultan", isBenefector };
    if (fingerprint.includes("pro")) return { tier: "pro", isBenefector };
    return { isBenefector };
}

export async function activateMayarPayment(rawPayload: MayarPayload) {
    const payload = normalizePayload(rawPayload);
    const transactionId = asString(payload.transactionId ?? payload.id ?? rawPayload.id);
    if (!transactionId) {
        throw new Error("Missing Mayar transaction ID");
    }

    const customerEmail = asString(payload.customerEmail ?? payload.email)?.toLowerCase();
    const customerName = asString(payload.customerName ?? payload.name);
    const productId = asString(payload.productId ?? payload.paymentLinkId);
    const productName = asString(payload.productName ?? payload.description ?? payload.title);
    const amount = asNumber(payload.amount ?? payload.totalAmount ?? payload.grossAmount);
    const status = asString(payload.transactionStatus ?? payload.status) ?? "received";
    const plan = identifyMayarPlan(rawPayload);
    const db = getDb();

    const existingPayment = await db
        .select()
        .from(mayarPayments)
        .where(eq(mayarPayments.transactionId, transactionId))
        .get();
    if (existingPayment) {
        return { status: "duplicate" as const, payment: existingPayment };
    }

    const user = customerEmail
        ? await db.select().from(users).where(eq(users.email, customerEmail)).get()
        : undefined;

    if (user && (plan.tier || plan.isBenefector)) {
        const userPatch: Partial<typeof users.$inferInsert> = {};
        if (plan.tier) {
            userPatch.tier = plan.tier;
            userPatch.tierExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        if (plan.isBenefector) {
            userPatch.isBenefector = true;
        }

        await db.update(users).set(userPatch).where(eq(users.id, user.id)).run();
    }

    const payment = await db.insert(mayarPayments).values({
        transactionId,
        userId: user?.id,
        customerEmail,
        customerName,
        productId,
        productName,
        amount,
        status,
        tier: plan.tier,
        isBenefector: plan.isBenefector,
        rawPayload: JSON.stringify(rawPayload),
    }).returning().get();

    return {
        status: user ? "activated" as const : "recorded_unmatched" as const,
        payment,
        userId: user?.id,
        tier: plan.tier,
        isBenefector: plan.isBenefector,
    };
}
