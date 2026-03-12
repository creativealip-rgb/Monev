import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { bills } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import { shouldResetBill } from "@/lib/bill-reset";

/**
 * POST /api/bills/reset
 * Auto-reset bills that meet the H-7/H-3/H-30 criteria
 */
export async function POST(_request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const db = getDb();

        // Get all paid and active bills for user
        const userBills = db.select()
            .from(bills)
            .where(and(
                eq(bills.userId, userId),
                eq(bills.isPaid, true),
                eq(bills.isActive, true)
            ))
            .all();

        // Check which bills need reset
        const billsToReset = userBills.filter(shouldResetBill);

        // Reset each bill
        const resetResults = [];
        for (const bill of billsToReset) {
            try {
                db.update(bills)
                    .set({
                        isPaid: false,
                        lastPaidAt: null
                    })
                    .where(and(
                        eq(bills.id, bill.id),
                        eq(bills.userId, userId)
                    ))
                    .run();

                resetResults.push({
                    id: bill.id,
                    name: bill.name,
                    frequency: bill.frequency,
                    success: true
                });
            } catch (err) {
                console.error(`Failed to reset bill ${bill.id}:`, err);
                resetResults.push({
                    id: bill.id,
                    name: bill.name,
                    frequency: bill.frequency,
                    success: false
                });
            }
        }

        return NextResponse.json({
            success: true,
            resetCount: billsToReset.length,
            resetBills: resetResults
        });

    } catch (error) {
        console.error("Error resetting bills:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to reset bills"
        }, { status: 500 });
    }
}

/**
 * GET /api/bills/reset
 * Preview which bills would be reset (without actually resetting)
 */
export async function GET(_request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const db = getDb();

        // Get all paid bills for user
        const userBills = db.select()
            .from(bills)
            .where(and(
                eq(bills.userId, userId),
                eq(bills.isPaid, true),
                eq(bills.isActive, true)
            ))
            .all();

        // Check which bills would be reset
        const { shouldResetBill, getResetInfo } = await import("@/lib/bill-reset");

        const billsWouldReset = userBills
            .filter(shouldResetBill)
            .map(bill => ({
                id: bill.id,
                name: bill.name,
                frequency: bill.frequency,
                ...getResetInfo(bill)
            }));

        return NextResponse.json({
            success: true,
            wouldResetCount: billsWouldReset.length,
            bills: billsWouldReset
        });

    } catch (error) {
        console.error("Error checking bills reset:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to check bills"
        }, { status: 500 });
    }
}
