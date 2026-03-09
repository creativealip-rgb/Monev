import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { debts, transactions } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        
        const body = await request.json();
        const { 
            transactionId, 
            totalAmount, 
            description, 
            participants 
        } = body;
        
        // Validation
        if (!transactionId || !totalAmount || !participants || participants.length === 0) {
            return NextResponse.json(
                { error: "Missing required fields" }, 
                { status: 400 }
            );
        }
        
        const db = getDb();
        
        // Generate splitGroupId
        const splitGroupId = `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Update transaction with splitGroupId
        await db
            .update(transactions)
            .set({ splitGroupId })
            .where(
                and(
                    eq(transactions.id, transactionId),
                    eq(transactions.userId, userId)
                )
            );
        
        // Create debt records for each participant
        const debtRecords = await Promise.all(
            participants.map(async (participant: { name: string; amount: number }) => {
                const debt = await db
                    .insert(debts)
                    .values({
                        userId,
                        debtorName: participant.name,
                        amount: participant.amount,
                        description: description,
                        splitGroupId,
                        transactionId,
                        status: "unpaid",
                        createdAt: new Date()
                    })
                    .returning()
                    .get();
                return debt;
            })
        );
        
        return NextResponse.json({
            success: true,
            data: {
                transaction: {
                    id: transactionId,
                    splitGroupId
                },
                debts: debtRecords
            }
        });
    } catch (error) {
        console.error("Error creating split bill:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create split bill";
        return NextResponse.json(
            { success: false, error: errorMessage }, 
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        
        const { searchParams } = new URL(request.url);
        const splitGroupId = searchParams.get("splitGroupId");
        const transactionId = searchParams.get("transactionId");
        
        if (!splitGroupId && !transactionId) {
            return NextResponse.json(
                { error: "Missing splitGroupId or transactionId" }, 
                { status: 400 }
            );
        }
        
        const db = getDb();
        
        // Get all debts for this split
        const splitDebts = await db
            .select()
            .from(debts)
            .where(
                splitGroupId 
                    ? eq(debts.splitGroupId, splitGroupId)
                    : and(
                          transactionId ? eq(debts.transactionId, parseInt(transactionId)) : undefined,
                          eq(debts.userId, userId)
                      )
            )
            .orderBy(debts.createdAt);
        
        if (splitDebts.length === 0) {
            return NextResponse.json(
                { error: "Split bill not found" }, 
                { status: 404 }
            );
        }
        
        // Get transaction details
        const transaction = await db
            .select()
            .from(transactions)
            .where(
                eq(transactions.id, splitDebts[0].transactionId || 0)
            )
            .get();
        
        // Calculate my share (total - sum of others)
        const totalOthers = splitDebts.reduce((sum, debt) => sum + debt.amount, 0);
        const myShare = (transaction?.amount || 0) - totalOthers;
        
        // Calculate payment status
        const paidCount = splitDebts.filter(d => d.status === "paid").length;
        const totalReceived = splitDebts
            .filter(d => d.status === "paid")
            .reduce((sum, debt) => sum + debt.amount, 0);
        const totalOutstanding = totalOthers - totalReceived;
        
        return NextResponse.json({
            success: true,
            data: {
                transaction: {
                    id: transaction?.id,
                    amount: transaction?.amount,
                    description: transaction?.description,
                    splitGroupId: transaction?.splitGroupId
                },
                myShare,
                others: splitDebts.map(debt => ({
                    id: debt.id,
                    name: debt.debtorName,
                    amount: debt.amount,
                    status: debt.status,
                    dueDate: debt.dueDate,
                    createdAt: debt.createdAt
                })),
                summary: {
                    totalAmount: transaction?.amount || 0,
                    participantCount: splitDebts.length + 1, // +1 for "Saya"
                    paidCount,
                    totalReceived,
                    totalOutstanding
                }
            }
        });
    } catch (error) {
        console.error("Error fetching split bill:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch split bill";
        return NextResponse.json(
            { success: false, error: errorMessage }, 
            { status: 500 }
        );
    }
}
