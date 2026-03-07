import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { sessions } from "@/backend/db/schema";
import { eq, and, ne } from "drizzle-orm";

// GET: Fetch all active sessions for the current user
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const db = getDb();
    const userId = parseInt(session.user.id);

    const userSessions = await db.select().from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy();

    // @ts-ignore - sessionToken may exist as extended field
    const currentSessionToken = session.sessionToken as string | undefined;

    const result = userSessions.map(s => ({
        id: s.id,
        deviceInfo: s.deviceInfo || "Unknown Device",
        ipAddress: s.ipAddress || "Unknown IP",
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        isCurrent: s.id === currentSessionToken,
    }));

    return NextResponse.json({ success: true, data: result });
}

// DELETE: Revoke a specific session or all other sessions
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const userId = parseInt(session.user.id);
    const body = await req.json().catch(() => ({}));
    const { sessionId, revokeAll } = body;

    if (revokeAll) {
        // @ts-ignore
        const currentSessionToken = session.sessionToken as string | undefined;
        if (currentSessionToken) {
            await db.delete(sessions).where(
                and(eq(sessions.userId, userId), ne(sessions.id, currentSessionToken))
            );
        } else {
            await db.delete(sessions).where(eq(sessions.userId, userId));
        }
        return NextResponse.json({ success: true, message: "Semua sesi lain telah diakhiri." });
    }

    if (sessionId) {
        await db.delete(sessions).where(
            and(eq(sessions.id, sessionId), eq(sessions.userId, userId))
        );
        return NextResponse.json({ success: true, message: "Sesi berhasil diakhiri." });
    }

    return NextResponse.json({ success: false, error: "sessionId or revokeAll required" }, { status: 400 });
}
