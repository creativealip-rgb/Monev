import { getDb } from "../index";
import { coupons, couponClaims, users } from "../schema";
import type { Coupon } from "../schema";
import { eq, and, sql } from "drizzle-orm";

// ============ Coupons & Upgrades ============

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
    const db = getDb();
    return db.select().from(coupons).where(eq(coupons.code, code)).get();
}

export async function hasUserClaimedCoupon(couponId: number, userId: number): Promise<boolean> {
    const db = getDb();
    const existing = await db.select({ count: sql<number>`COUNT(*)` })
        .from(couponClaims)
        .where(and(
            eq(couponClaims.couponId, couponId),
            eq(couponClaims.userId, userId)
        ))
        .get();
    return (existing?.count || 0) > 0;
}

export async function getCouponClaimCount(couponId: number): Promise<number> {
    const db = getDb();
    const result = await db.select({ count: sql<number>`COUNT(*)` })
        .from(couponClaims)
        .where(eq(couponClaims.couponId, couponId))
        .get();
    return result?.count || 0;
}

export async function useCoupon(couponId: number, userId: number, tier: "pro" | "sultan"): Promise<void> {
    const db = getDb();

    const coupon = await db.select().from(coupons).where(eq(coupons.id, couponId)).get();
    if (!coupon) {
        throw new Error("Coupon not found");
    }

    const claimedCount = await getCouponClaimCount(couponId);
    if (claimedCount >= coupon.quota) {
        throw new Error("Coupon quota exceeded");
    }

    const alreadyClaimed = await hasUserClaimedCoupon(couponId, userId);
    if (alreadyClaimed) {
        throw new Error("You have already claimed this coupon");
    }

    await db.insert(couponClaims).values({
        couponId,
        userId,
    });

    db.update(coupons)
        .set({
            claimedCount: claimedCount + 1
        })
        .where(eq(coupons.id, couponId))
        .run();

    db.update(users)
        .set({ tier: tier })
        .where(eq(users.id, userId))
        .run();
}
