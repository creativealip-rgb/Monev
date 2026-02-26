import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSettings } from "@/backend/db/operations";
import { verifyPin } from "@/lib/security";
import { checkPinRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const { pin } = await req.json();

        if (!pin || pin.length !== 6) {
            return NextResponse.json({ success: false, message: "PIN tidak valid" }, { status: 400 });
        }

        // Check rate limiting
        const rateLimit = checkPinRateLimit(`user:${userId}`);
        if (!rateLimit.allowed) {
            const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / (60 * 1000));
            return NextResponse.json({
                success: false,
                message: `Terlalu banyak percobaan. Silakan coba lagi dalam ${minutesLeft} menit.`
            }, { status: 429 });
        }

        // Get user's hashed PIN from database
        const settings = await getUserSettings(userId);
        if (!settings || !settings.securityPin) {
            return NextResponse.json({ success: false, message: "PIN belum diatur" }, { status: 400 });
        }

        // Verify PIN
        const isValid = await verifyPin(pin, settings.securityPin);

        if (!isValid) {
            return NextResponse.json({
                success: false,
                message: `PIN salah. Sisa percobaan: ${rateLimit.remaining}`
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Verify PIN Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
