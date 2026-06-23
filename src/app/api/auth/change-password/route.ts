import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { validatePassword } from "@/lib/password-validation";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ success: false, error: "Password lama dan baru wajib diisi" }, { status: 400 });
        }

        const pwdCheck = validatePassword(newPassword);
        if (!pwdCheck.valid) {
            return NextResponse.json({ success: false, error: pwdCheck.error || "Password tidak valid" }, { status: 400 });
        }

        const userId = parseInt(session.user.id);
        const db = getDb();
        const user = await db.select().from(users).where(eq(users.id, userId)).get();

        if (!user?.password) {
            return NextResponse.json({ success: false, error: "User tidak ditemukan atau tidak punya password" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ success: false, error: "Password lama salah" }, { status: 400 });
        }

        const hashedPw = await bcrypt.hash(newPassword, 10);
        await db.update(users).set({ password: hashedPw }).where(eq(users.id, userId));

        return NextResponse.json({ success: true, message: "Password berhasil diubah" });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Gagal mengubah password" }, { status: 500 });
    }
}
