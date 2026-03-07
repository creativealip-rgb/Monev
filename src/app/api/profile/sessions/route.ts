import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { sessions } from "@/backend/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const db = getDb();
        const userSessions = await db.select()
            .from(sessions)
            .where(eq(sessions.userId, userId))
            .all();

        return NextResponse.json({
            success: true,
            data: userSessions
        });
    } catch (error: any) {
        console.error("Sessions GET Error:", error);
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
        const { action, sessionId } = body;

        const db = getDb();

        if (action === "revoke_all_others") {
            // Revoke all other sessions for the user
            // We need to know which one is the current session to keep it.
            // But next-auth might not be using this sessions table yet.
            // If the user is logged in, their session must have an ID in the sessions table if we track it.
            // For now, let's just delete all sessions that are NOT the provided sessionId.
            await db.delete(sessions)
                .where(and(
                    eq(sessions.userId, userId),
                    ne(sessions.id, sessionId)
                ));

            return NextResponse.json({
                success: true,
                message: "All other sessions have been revoked."
            });
        }

        if (action === "revoke") {
            if (!sessionId) {
                return NextResponse.json({ success: false, error: "Session ID is required" }, { status: 400 });
            }

            await db.delete(sessions)
                .where(and(
                    eq(sessions.userId, userId),
                    eq(sessions.id, sessionId)
                ));

            return NextResponse.json({
                success: true,
                message: "Session has been revoked."
            });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Sessions POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
