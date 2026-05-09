import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { getUserVocabulary, addVocabulary } from "@/backend/db/operations/vocabulary";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const db = getDb();
        const vocabulary = await getUserVocabulary(db, userId);
        return NextResponse.json({ success: true, data: vocabulary });
    } catch (error) {
        console.error("GET /api/vocabulary error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);
        const { word, type, categoryId } = await request.json();
        
        if (!word || !type || !["income", "expense"].includes(type)) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const db = getDb();
        await addVocabulary(db, userId, word, type, categoryId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/vocabulary error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
