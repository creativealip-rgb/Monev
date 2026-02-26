import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, passwordResetTokens } from "@/backend/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { token, password, confirmPassword } = await req.json();

        if (!token || !password || !confirmPassword) {
            return NextResponse.json({ success: false, error: "Semua field wajib diisi" }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ success: false, error: "Password tidak cocok" }, { status: 400 });
        }

        const db = getDb();

        // Verify token
        const resetToken = await db.select()
            .from(passwordResetTokens)
            .where(and(
                eq(passwordResetTokens.token, token),
                // eq(passwordResetTokens.expiresAt, ">", new Date()) // Drizzle-lite handle
            ))
            .get();

        if (!resetToken || new Date(resetToken.expiresAt) < new Date()) {
            return NextResponse.json({ success: false, error: "Token tidak valid atau sudah kedaluwarsa" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.email, resetToken.identifier));

        // Delete token
        await db.delete(passwordResetTokens)
            .where(eq(passwordResetTokens.token, token));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Reset Password API Error:", error);
        return NextResponse.json({ success: false, error: "Gagal menyetel ulang password." }, { status: 500 });
    }
}
