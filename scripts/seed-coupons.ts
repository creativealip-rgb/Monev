import { getDb } from "../src/backend/db";
import { coupons } from "../src/backend/db/schema";

async function seed() {
    console.log("Seeding coupons...");
    const db = getDb();
    const testCoupons = [
        {
            code: "KAYA-TRIAL",
            tier: "kaya" as const,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        {
            code: "SULTAN-BOOST",
            tier: "sultan" as const,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        {
            code: "MONEV-ULTIMATE",
            tier: "sultan" as const,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }
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
