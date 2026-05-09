import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { deleteVocabulary } from "@/backend/db/operations/vocabulary";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        
        const db = getDb();
        await deleteVocabulary(db, id, userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/vocabulary error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
