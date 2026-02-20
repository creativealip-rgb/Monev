import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { analyzeSubscriptions } from "@/backend/db/operations";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = getDb();
        const user = db.select().from(users).where(eq(users.email, session.user.email)).get();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const subscriptions = await analyzeSubscriptions(user.id, 3);

        return NextResponse.json({
            success: true,
            data: subscriptions.map(s => ({
                merchant: s.merchant,
                amount: s.amount,
                frequency: s.frequency,
                lastDate: s.lastDate instanceof Date ? s.lastDate.toISOString() : s.lastDate,
            })),
            total: subscriptions.reduce((sum, s) => sum + s.amount, 0),
        });
    } catch (error) {
        console.error("Subscriptions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
