import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/backend/actions/auth-actions";

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const formData = new FormData();
        formData.set("email", typeof body.email === "string" ? body.email : "");

        const result = await requestPasswordReset({}, formData);
        return NextResponse.json(result);
    } catch (error) {
        console.error("POST /api/auth/forgot-password error:", error);
        return NextResponse.json(
            { success: false, error: "Terjadi kesalahan. Silakan coba lagi." },
            { status: 500 },
        );
    }
}
