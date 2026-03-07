import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

// POST: Request account deletion (sets grace period)
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { confirmText } = body;

    if (confirmText !== "HAPUS AKUN SAYA") {
        return NextResponse.json({
            success: false,
            error: "Konfirmasi tidak valid. Ketik 'HAPUS AKUN SAYA' untuk melanjutkan."
        }, { status: 400 });
    }

    const db = getDb();
    const userId = parseInt(session.user.id);

    await db.update(users)
        .set({ deletionRequestedAt: new Date() })
        .where(eq(users.id, userId));

    return NextResponse.json({
        success: true,
        message: "Permintaan penghapusan akun diterima. Akun kamu akan dihapus permanen dalam 30 hari.",
        gracePeriodDays: 30
    });
}

// DELETE: Cancel deletion request
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const userId = parseInt(session.user.id);

    await db.update(users)
        .set({ deletionRequestedAt: null })
        .where(eq(users.id, userId));

    return NextResponse.json({
        success: true,
        message: "Permintaan penghapusan akun dibatalkan. Akun kamu aman!"
    });
}
