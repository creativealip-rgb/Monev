import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { authAccounts, users, verificationTokens } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mailer";
import { validatePassword } from "@/lib/password-validation";
import { isDisposableEmail } from "@/lib/disposable-emails";

export async function POST(req: NextRequest) {
    try {
        const { name, email, password, confirmPassword } = await req.json();

        if (!email || !password || !name || !confirmPassword) {
            return NextResponse.json({ success: false, error: "Semua field wajib diisi" }, { status: 400 });
        }

        if (isDisposableEmail(email)) {
            return NextResponse.json(
                { success: false, error: "Email disposable/sementara tidak diperbolehkan" },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ success: false, error: "Password dan konfirmasi password tidak cocok" }, { status: 400 });
        }

        const pwdCheck = validatePassword(password);
        if (!pwdCheck.valid) {
            return NextResponse.json(
                { success: false, error: pwdCheck.error },
                { status: 400 }
            );
        }

        const db = getDb();

        // Check if user exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
        if (existingUser) {
            return NextResponse.json({ success: false, error: "Email sudah terdaftar" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [createdUser] = await db.insert(users).values({
            name,
            firstName: name,
            email,
            password: hashedPassword,
            username: email.split("@")[0],
        }).returning({ id: users.id });

        await db.insert(authAccounts).values({
            accountId: createdUser.id.toString(),
            providerId: "credential",
            userId: createdUser.id,
            password: hashedPassword,
        });

        // Generate verification token
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

        await db.insert(verificationTokens).values({
            identifier: email,
            token,
            expiresAt,
        });

        // Send verification email
        try {
            await sendVerificationEmail(email, token);
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // We still return success because user is created
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Registration API Error:", error);
        return NextResponse.json({ success: false, error: "Gagal membuat akun. Silakan coba lagi." }, { status: 500 });
    }
}
