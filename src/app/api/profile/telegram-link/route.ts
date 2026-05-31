import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createTelegramStartPayload } from "@/lib/telegram-link";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "MonevappBot";

export async function GET() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = createTelegramStartPayload(userId);
    const url = `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(payload)}`;

    return NextResponse.json({ success: true, data: { url } });
}
