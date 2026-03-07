import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { budgets } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

        const db = getDb();
        
        // Get current month budgets
        const currentBudgets = await db.select()
            .from(budgets)
            .where(and(
                eq(budgets.userId, userId),
                eq(budgets.month, month),
                eq(budgets.year, year)
            ));

        // Calculate rollover amounts from previous month
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const prevBudgets = await db.select()
            .from(budgets)
            .where(and(
                eq(budgets.userId, userId),
                eq(budgets.month, prevMonth),
                eq(budgets.year, prevYear)
            ));

        // Calculate remaining budget from previous month
        const rolloverData = prevBudgets.map(pb => {
            const spent = pb.spent || 0;
            const remaining = (pb.amount || 0) - spent;
            return {
                categoryId: pb.categoryId,
                rolloverAmount: remaining > 0 ? remaining : 0,
                categoryName: pb.categoryId
            };
        }).filter(r => r.rolloverAmount > 0);

        return NextResponse.json({
            success: true,
            data: {
                currentBudgets,
                rolloverAvailable: rolloverData,
                previousMonth: `${prevMonth}/${prevYear}`
            }
        });
    } catch (error: any) {
        console.error("Budget Rollover GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const body = await req.json();
        const { categoryId, enableRollover, month, year } = body;

        const db = getDb();

        // Update budget rollover setting
        await db.update(budgets)
            .set({
                enableRollover: enableRollover ?? false,
            })
            .where(and(
                eq(budgets.userId, userId),
                eq(budgets.categoryId, categoryId),
                eq(budgets.month, month),
                eq(budgets.year, year)
            ));

        return NextResponse.json({
            success: true,
            message: enableRollover 
                ? "Rollover diaktifkan untuk kategori ini" 
                : "Rollover dinonaktifkan untuk kategori ini"
        });
    } catch (error: any) {
        console.error("Budget Rollover POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
