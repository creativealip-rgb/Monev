import { NextResponse } from "next/server";
import { resetPassword } from "@/backend/actions/auth-actions";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const formData = new FormData();
        formData.set("token", typeof body.token === "string" ? body.token : "");
        formData.set("password", typeof body.password === "string" ? body.password : "");
        formData.set("confirmPassword", typeof body.confirmPassword === "string" ? body.confirmPassword : "");

        const result = await resetPassword({}, formData);
        return NextResponse.json(result);
    } catch (error) {
        console.error("POST /api/auth/reset-password error:", error);
        return NextResponse.json(
            { success: false, error: "Terjadi kesalahan. Silakan coba lagi." },
            { status: 500 },
        );
    }
}
