import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getInvestmentById, updateInvestment, deleteInvestment } from "@/backend/db/operations/investment-operations";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { id } = await params;
        const investment = await getInvestmentById(userId, parseInt(id));
        if (!investment) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: investment });
    } catch (error) {
        console.error("GET /api/investments/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { id } = await params;
        const body = await request.json();

        const updated = await updateInvestment(userId, parseInt(id), body);
        if (!updated) {
            return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("PUT /api/investments/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { id } = await params;

        await deleteInvestment(userId, parseInt(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/investments/[id] error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
