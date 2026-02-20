import { NextResponse } from "next/server";

// In production, generate VAPID keys with: npx web-push generate-vapid-keys
// Store them in environment variables.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BPlaceholderKeyThatShouldBeReplacedWithRealVAPIDKey123456789012345678901234567890";

export async function GET() {
    return NextResponse.json({
        publicKey: VAPID_PUBLIC_KEY,
    });
}
