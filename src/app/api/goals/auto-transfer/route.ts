import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { goals } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const db = getDb();
        
        // Get goals with auto-transfer settings
        const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));

        const autoTransfers = userGoals
            .filter(g => (g as any).autoTransferEnabled)
            .map(g => ({
                goalId: g.id,
                goalName: g.name,
                targetAmount: g.targetAmount,
                currentAmount: g.currentAmount,
                autoTransferAmount: (g as any).autoTransferAmount || 0,
                autoTransferDay: (g as any).autoTransferDay || 1,
                frequency: (g as any).autoTransferFrequency || "monthly"
            }));

        return NextResponse.json({
            success: true,
            data: {
                autoTransfers,
                availableGoals: userGoals.map(g => ({
                    id: g.id,
                    name: g.name,
                    targetAmount: g.targetAmount,
                    currentAmount: g.currentAmount
                }))
            }
        });
    } catch (error: any) {
        console.error("Auto-Transfer GET Error:", error);
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
        const { goalId, enable, amount, day, frequency } = body;

        const db = getDb();

        if (enable) {
            // Enable auto-transfer for goal
            await db.update(goals)
                .set({
                    autoTransferEnabled: true,
                    autoTransferAmount: amount || 100000,
                    autoTransferDay: day || 1,
                    autoTransferFrequency: frequency || "monthly"
                } as any)
                .where(eq(goals.id, goalId));

            return NextResponse.json({
                success: true,
                message: `Auto-transfer Rp ${amount?.toLocaleString("id-ID") || "100.000"} ke goal dimulai`
            });
        } else {
            // Disable auto-transfer
            await db.update(goals)
                .set({
                    autoTransferEnabled: false
                } as any)
                .where(eq(goals.id, goalId));

            return NextResponse.json({
                success: true,
                message: "Auto-transfer dinonaktifkan"
            });
        }
    } catch (error: any) {
        console.error("Auto-Transfer POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Cron endpoint for processing auto-transfers
export async function PUT(req: NextRequest) {
    try {
        // This endpoint should be called by a cron job
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get("secret");
        
        // Simple secret check for cron job
        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const db = getDb();
        const today = new Date();
        const currentDay = today.getDate();

        // Find goals with auto-transfer enabled for today
        const goalsWithAutoTransfer = await db.select()
            .from(goals)
            .where(eq((goals as any).autoTransferEnabled, true));

        const results = [];

        for (const goal of goalsWithAutoTransfer) {
            if ((goal as any).autoTransferDay === currentDay) {
                const amount = (goal as any).autoTransferAmount || 100000;
                
                // Update goal current amount
                await db.update(goals)
                    .set({
                        currentAmount: (goal.currentAmount || 0) + amount
                    })
                    .where(eq(goals.id, goal.id));

                results.push({
                    goalId: goal.id,
                    goalName: goal.name,
                    amountTransferred: amount
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error: any) {
        console.error("Auto-Transfer Cron Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
