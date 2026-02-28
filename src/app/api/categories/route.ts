import { NextResponse } from "next/server";
import { getCategories } from "@/backend/db/operations";
import { auth } from "@/auth";

export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

        const categories = await getCategories(userId);
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}
