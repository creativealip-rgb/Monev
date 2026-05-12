import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSettings, updateUserSettings } from "@/backend/db/operations";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const settings = await getUserSettings(userId);
        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(session.user.id);

        const data = await req.json();
        if (data.viewMode && !["simple", "advanced"].includes(data.viewMode)) {
            return NextResponse.json({ error: "Mode tampilan tidak valid" }, { status: 400 });
        }
        const settings = await updateUserSettings(userId, data);

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
