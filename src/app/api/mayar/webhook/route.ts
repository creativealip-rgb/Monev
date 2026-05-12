import { NextRequest, NextResponse } from "next/server";
import { activateMayarPayment, isPaidMayarEvent } from "@/lib/mayar";
import { createLogger } from "@/lib/logger";

const logger = createLogger("MayarWebhook");

function hasValidWebhookSecret(request: NextRequest) {
    const secret = process.env.MAYAR_WEBHOOK_SECRET;
    if (!secret) return true;

    const authHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const tokenHeader = request.headers.get("x-mayar-token") || request.headers.get("x-webhook-secret");
    const tokenQuery = request.nextUrl.searchParams.get("token");

    return [authHeader, tokenHeader, tokenQuery].some((value) => value === secret);
}

export async function POST(request: NextRequest) {
    if (!hasValidWebhookSecret(request)) {
        return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    try {
        const payload = await request.json();

        if (!isPaidMayarEvent(payload)) {
            return NextResponse.json({ success: true, skipped: "not_paid" });
        }

        const result = await activateMayarPayment(payload);
        logger.info("Mayar payment processed", result);

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        logger.error("Mayar webhook failed", error);
        return NextResponse.json({ error: "Failed to process Mayar webhook" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ ok: true, provider: "mayar" });
}
