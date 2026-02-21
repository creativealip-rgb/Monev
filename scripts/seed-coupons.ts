import { getDb } from "../src/backend/db";
import { coupons } from "../src/backend/db/schema";

async function seed() {
    console.log("Seeding coupons...");
    const db = getDb();
    const testCoupons = [
        // Kaya tier coupons
        {
            code: "KAYA-TRIAL",
            tier: "kaya" as const,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
            code: "MONEV-KAYA-VIP",
            tier: "kaya" as const,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
            code: "KAYA-2026",
            tier: "kaya" as const,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        // Sultan tier coupons
        {
            code: "SULTAN-BOOST",
            tier: "sultan" as const,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
            code: "MONEV-ULTIMATE",
            tier: "sultan" as const,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        {
            code: "SULTAN-EXCLUSIVE",
            tier: "sultan" as const,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        {
            code: "MONEV-PRO-MAX",
            tier: "sultan" as const,
            expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
    ];

    for (const c of testCoupons) {
        try {
            await db.insert(coupons).values(c).run();
            console.log(`Created coupon: ${c.code} (${c.tier})`);
        } catch (e) {
            console.log(`Coupon ${c.code} already exists or error occurred.`);
        }
    }

    console.log("Seeding finished.");
}

seed().catch(console.error);
