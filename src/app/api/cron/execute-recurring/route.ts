import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getDb } from "@/backend/db";
import { recurringTransactions } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { sendPushToUser } from "@/lib/send-push";
import { createTransaction } from "@/backend/db/operations";

/**
 * Cron job untuk auto-execute recurring transactions
 * Dijalankan setiap hari jam 00:00 UTC
 */
function isAuthorizedCron(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true;

    const authHeader = request.headers.get("authorization");
    const cronSecretHeader = request.headers.get("x-cron-secret");
    return authHeader === `Bearer ${secret}` || cronSecretHeader === secret;
}

async function executeRecurringCron(request: NextRequest) {
    if (!isAuthorizedCron(request)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("[CRON] Starting recurring transactions execution...");
        
        const db = getDb();
        const now = new Date();
        
        // Get all active recurring transactions that should run today
        const dueRecurring = await db
            .select()
            .from(recurringTransactions)
            .where(
                eq(recurringTransactions.isActive, true)
            )
            .all();
        
        const executed: any[] = [];
        const failed: any[] = [];
        
        for (const recurring of dueRecurring) {
            try {
                const nextRun = new Date(recurring.nextRunAt);
                
                if (nextRun > now) {
                    continue; // Not due yet
                }
                
                console.log(`[CRON] Executing recurring transaction ${recurring.id} for user ${recurring.userId}`);
                
                if (!recurring.accountId) {
                    throw new Error("Recurring belum punya akun sumber");
                }

                // Use the normal transaction helper so account balance is updated too.
                const newTransaction = await createTransaction(recurring.userId, {
                    amount: recurring.amount,
                    description: recurring.description,
                    categoryId: recurring.categoryId || 0,
                    accountId: recurring.accountId,
                    type: recurring.type,
                    paymentMethod: "recurring",
                    date: now,
                });
                
                // Calculate next run date based on frequency
                const nextDate = new Date(now);
                switch (recurring.frequency) {
                    case "daily":
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case "weekly":
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case "monthly":
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                }
                
                // Update next_run_at
                await db
                    .update(recurringTransactions)
                    .set({ nextRunAt: nextDate })
                    .where(eq(recurringTransactions.id, recurring.id))
                    .run();
                
                executed.push({
                    id: recurring.id,
                    description: recurring.description,
                    transactionId: newTransaction.id,
                    nextRun: nextDate
                });
                
            } catch (error) {
                console.error(`[CRON] Failed to execute recurring ${recurring.id}:`, error);
                failed.push({
                    id: recurring.id,
                    description: recurring.description,
                    error: error instanceof Error ? error.message : "Unknown error"
                });
            }
        }
        
        console.log(`[CRON] Completed: ${executed.length} executed, ${failed.length} failed`);
        
        // Send push notifications to affected users
        const userIds = [...new Set(executed.map(e => {
            // Find the recurring transaction to get the userId
            const recurring = dueRecurring.find(r => r.id === e.id);
            return recurring?.userId;
        }).filter(Boolean))] as number[];

        for (const userId of userIds) {
            const userExecuted = executed.filter(e => {
                const recurring = dueRecurring.find(r => r.id === e.id);
                return recurring?.userId === userId;
            });
            try {
                await sendPushToUser(userId, {
                    title: "Monev",
                    body: `${userExecuted.length} transaksi otomatis telah dijalankan.`,
                    url: "/recurring",
                    tag: "recurring-executed",
                }, "recurring_executed");
            } catch (pushError) {
                console.error(`[CRON] Push failed for user ${userId}:`, pushError);
            }
        }
        
        return NextResponse.json({
            success: true,
            data: {
                executed,
                failed,
                total: dueRecurring.length,
                executedCount: executed.length,
                failedCount: failed.length
            }
        });
        
    } catch (error) {
        console.error("[CRON] Recurring transactions cron failed:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Cron job failed" 
            }, 
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    return executeRecurringCron(request);
}

export async function POST(request: NextRequest) {
    return executeRecurringCron(request);
}
