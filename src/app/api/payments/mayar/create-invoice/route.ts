import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { getAppUrl, getMayarApiKey, isMayarTier, MAYAR_TIER_CONFIG } from "@/lib/mayar";

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

    const db = getDb();
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!user?.email) {
        return NextResponse.json({ success: false, error: "User/email tidak ditemukan" }, { status: 404 });
    }

    const tierConfig = MAYAR_TIER_CONFIG[tier];
    const appUrl = getAppUrl();
    const payload = {
        name: user.name || user.firstName || user.email.split("@")[0],
        email: user.email,
        mobile: "081234567890",
        redirectUrl: `${appUrl}/fitur/upgrade?payment=return&tier=${tier}`,
        description: tierConfig.description,
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        items: [
            {
                quantity: 1,
                rate: tierConfig.amount,
                description: tierConfig.name,
            },
        ],
        extraData: {
            app: "monev",
            userId: String(user.id),
            tier,
            period: "monthly",
        },
    };

    const mayarResponse = await fetch("https://api.mayar.id/hl/v1/invoice/create", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await mayarResponse.json().catch(() => null);
    if (!mayarResponse.ok || data?.statusCode >= 400) {
        return NextResponse.json(
            { success: false, error: data?.messages || "Gagal membuat invoice Mayar" },
            { status: 502 }
        );
    }

    const paymentUrl = data?.data?.linkUrl || data?.data?.linkPayment || data?.data?.paymentUrl || data?.data?.url;
    if (!paymentUrl) {
        return NextResponse.json({ success: false, error: "Mayar tidak mengembalikan URL pembayaran" }, { status: 502 });
    }

    return NextResponse.json({
        success: true,
        paymentUrl,
        invoiceId: data?.data?.id,
        transactionId: data?.data?.transactionId,
    });
}
