import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, passwordResetTokens } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, error: "Email wajib diisi" }, { status: 400 });
        }

        const db = getDb();
        const user = await db.select().from(users).where(eq(users.email, email)).get();

        if (!user) {
            // Return success anyway to avoid email enumeration
            return NextResponse.json({ success: true });
        }

        // Generate token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await db.insert(passwordResetTokens).values({
            identifier: email,
            token,
            expiresAt,
        });

        // Send email
        try {
            await sendPasswordResetEmail(email, token);
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Forgot Password API Error:", error);
        return NextResponse.json({ success: false, error: "Gagal memproses permintaan." }, { status: 500 });
    }
}
