import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { recurringTransactions, transactions, accounts } from "@/backend/db/schema";
import { eq, lt } from "drizzle-orm";

/**
 * Cron job untuk auto-execute recurring transactions
 * Dijalankan setiap hari jam 00:00 UTC
 */
export async function POST() {
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
                
                // Create transaction
                const [newTransaction] = await db
                    .insert(transactions)
                    .values({
                        userId: recurring.userId,
                        amount: recurring.amount,
                        description: recurring.description,
                        categoryId: recurring.categoryId,
                        type: recurring.type,
                        isRecurring: true,
                        date: now,
                        createdAt: now
                    })
                    .returning()
                    .all();
                
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
