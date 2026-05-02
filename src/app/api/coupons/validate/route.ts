import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCouponByCode, useCoupon as redeemCoupon, hasUserClaimedCoupon, getCouponClaimCount } from "@/backend/db/operations";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ success: false, error: "Kode kupon diperlukan" }, { status: 400 });
        }

        const coupon = await getCouponByCode(code.toUpperCase());
        if (!coupon) {
            return NextResponse.json({ success: false, error: "Kupon tidak ditemukan" }, { status: 404 });
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ success: false, error: "Kupon sudah kadaluarsa" }, { status: 400 });
        }

        const userId = parseInt(session.user.id);
        if (isNaN(userId)) {
            return NextResponse.json({ success: false, error: "ID pengguna tidak valid" }, { status: 400 });
        }

        const alreadyClaimed = await hasUserClaimedCoupon(coupon.id, userId);
        if (alreadyClaimed) {
            return NextResponse.json({ success: false, error: "Anda sudah mengklaim kupon ini" }, { status: 400 });
        }

        const claimedCount = await getCouponClaimCount(coupon.id);
        if (claimedCount >= coupon.quota) {
            return NextResponse.json({ success: false, error: "Kuota kupon sudah habis" }, { status: 400 });
        }

        await redeemCoupon(coupon.id, userId, coupon.tier as "pro" | "sultan");

        return NextResponse.json({
            success: true,
            message: `Berhasil upgrade ke tier ${coupon.tier}!`,
            tier: coupon.tier
        });

    } catch (error: any) {
        console.error("[Coupon API] Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Terjadi kesalahan server" }, { status: 500 });
    }
}
