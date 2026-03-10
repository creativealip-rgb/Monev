import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { splitBillMembers, debts } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";

// GET members by splitGroupId
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const splitGroupId = searchParams.get("splitGroupId");
        
        if (!splitGroupId) {
            return NextResponse.json(
                { error: "Missing splitGroupId" }, 
                { status: 400 }
            );
        }
        
        const db = getDb();
        
        const members = await db
            .select()
            .from(splitBillMembers)
            .where(eq(splitBillMembers.splitGroupId, splitGroupId))
            .orderBy(splitBillMembers.invitedAt);
        
        // Calculate summary
        const totalShare = members.reduce((sum, m) => sum + m.shareAmount, 0);
        const totalPaid = members.reduce((sum, m) => sum + m.paidAmount, 0);
        const paidCount = members.filter(m => m.status === "paid").length;
        const partialCount = members.filter(m => m.status === "partial").length;
        const pendingCount = members.filter(m => m.status === "pending").length;
        
        return NextResponse.json({
            success: true,
            data: {
                members: members.map(m => ({
                    id: m.id,
                    name: m.name,
                    email: m.email,
                    whatsappNumber: m.whatsappNumber,
                    shareAmount: m.shareAmount,
                    paidAmount: m.paidAmount,
                    status: m.status,
                    invitedAt: m.invitedAt,
                    paidAt: m.paidAt
                })),
                summary: {
                    totalShare,
                    totalPaid,
                    paidCount,
                    partialCount,
                    pendingCount,
                    participantCount: members.length
                }
            }
        });
    } catch (error) {
        console.error("Error fetching split bill members:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch members";
        return NextResponse.json(
            { success: false, error: errorMessage }, 
            { status: 500 }
        );
    }
}

// POST - Add new member
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const userId = parseInt(session.user.id);
        const body = await request.json();
        const { splitGroupId, name, email, whatsappNumber, shareAmount } = body;
        
        if (!splitGroupId || !name || !shareAmount) {
            return NextResponse.json(
                { error: "Missing required fields: splitGroupId, name, shareAmount" }, 
                { status: 400 }
            );
        }
        
        const db = getDb();
        
        const [newMember] = await db
            .insert(splitBillMembers)
            .values({
                splitGroupId,
                userId,
                name,
                email: email || null,
                whatsappNumber: whatsappNumber || null,
                shareAmount,
                paidAmount: 0,
                status: "pending",
                invitedAt: new Date()
            })
            .returning()
            .all();
        
        return NextResponse.json({
            success: true,
            data: {
                id: newMember.id,
                name: newMember.name,
                email: newMember.email,
                whatsappNumber: newMember.whatsappNumber,
                shareAmount: newMember.shareAmount,
                status: newMember.status
            }
        });
    } catch (error) {
        console.error("Error adding split bill member:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to add member";
        return NextResponse.json(
            { success: false, error: errorMessage }, 
            { status: 500 }
        );
    }
}

// PUT - Update member payment
export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await request.json();
        const { memberId, paidAmount, status } = body;
        
        if (!memberId) {
            return NextResponse.json(
                { error: "Missing memberId" }, 
                { status: 400 }
            );
        }
        
        const db = getDb();
        
        // Get current member data
        const currentMember = await db
            .select()
            .from(splitBillMembers)
            .where(eq(splitBillMembers.id, parseInt(memberId)))
            .get();
        
        if (!currentMember) {
            return NextResponse.json(
                { error: "Member not found" }, 
                { status: 404 }
            );
        }
        
        const finalPaidAmount = paidAmount !== undefined ? paidAmount : currentMember.paidAmount;
        const finalStatus = status || (
            finalPaidAmount >= currentMember.shareAmount ? "paid" :
            finalPaidAmount > 0 ? "partial" : "pending"
        );
        
        // Update member
        const [updatedMember] = await db
            .update(splitBillMembers)
            .set({
                paidAmount: finalPaidAmount,
                status: finalStatus,
                paidAt: finalStatus === "paid" ? new Date() : currentMember.paidAt
            })
            .where(eq(splitBillMembers.id, parseInt(memberId)))
            .returning()
            .all();
        
        // Also update debt record if exists
        await db
            .update(debts)
            .set({
                status: finalStatus === "paid" ? "paid" : "unpaid",
                dueDate: finalStatus === "paid" ? new Date() : currentMember.invitedAt
            })
            .where(
                and(
                    eq(debts.splitGroupId, currentMember.splitGroupId),
                    eq(debts.debtorName, currentMember.name)
                )
            )
            .run();
        
        return NextResponse.json({
            success: true,
            data: {
                id: updatedMember.id,
                shareAmount: updatedMember.shareAmount,
                paidAmount: updatedMember.paidAmount,
                status: updatedMember.status,
                paidAt: updatedMember.paidAt
            }
        });
    } catch (error) {
        console.error("Error updating member payment:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update member";
        return NextResponse.json(
            { success: false, error: errorMessage }, 
            { status: 500 }
        );
    }
}

// DELETE - Remove member
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get("memberId");
        
        if (!memberId) {
            return NextResponse.json(
                { error: "Missing memberId" }, 
                { status: 400 }
            );
        }
        
        const db = getDb();
        
        await db
            .delete(splitBillMembers)
            .where(eq(splitBillMembers.id, parseInt(memberId)))
            .run();
        
        return NextResponse.json({
            success: true,
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error("Error deleting member:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete member";
        return NextResponse.json(
            { success: false, error: errorMessage }, 
            { status: 500 }
        );
    }
}
