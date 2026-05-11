import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dismissSmartNotification, generateSmartNotifications, getSmartNotifications, logSmartNotificationAsRead } from "@/backend/db/operations";

type AuthSession = { user?: { id?: string | number | null } } | null;

function getUserId(session: AuthSession) {
    return session?.user?.id ? parseInt(String(session.user.id), 10) : null;
}

export async function GET(request: NextRequest) {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const shouldGenerate = request.nextUrl.searchParams.get("generate") === "true";
        if (shouldGenerate) {
            await generateSmartNotifications(userId);
        }

        const data = await getSmartNotifications(userId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Smart Notifications GET Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userId = getUserId(await auth());
        if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        if (body.action === "generate") {
            const data = await generateSmartNotifications(userId);
            return NextResponse.json({ success: true, data });
        }

        if (body.action === "dismiss" && Number.isInteger(Number(body.id))) {
            const data = await dismissSmartNotification(userId, Number(body.id));
            return NextResponse.json({ success: true, data });
        }

        if (body.action === "sendToInbox" && Number.isInteger(Number(body.id))) {
            const data = await logSmartNotificationAsRead(userId, Number(body.id));
            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Smart Notifications POST Error:", error);
        return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
    }
}
