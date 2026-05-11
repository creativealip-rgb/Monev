import { NextResponse } from "next/server";
import { getCategories, createCategory, deleteCategory } from "@/backend/db/operations";
import { auth } from "@/auth";
import { z } from "zod";
import { applyRateLimit } from "@/lib/api-rate-limit";

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

const createCategorySchema = z.object({
    name: z.string().trim().min(1, "Nama kategori wajib diisi").max(80),
    icon: z.string().trim().min(1, "Icon wajib dipilih").max(40),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna tidak valid"),
    type: z.enum(["expense", "income"]),
});

const categoryIdSchema = z.coerce.number().int().positive();

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResponse = await applyRateLimit(req, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const userId = parseInt(session.user.id);
        const body = await req.json().catch(() => null);
        const validatedData = createCategorySchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json({ success: false, error: "Valid category payload is required" }, { status: 400 });
        }

        const category = await createCategory({
            ...validatedData.data,
            userId
        });

        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        console.error("Error creating custom category:", error);
        return NextResponse.json({ success: false, error: "Failed to create category" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResponse = await applyRateLimit(req, "bulk");
        if (rateLimitResponse) return rateLimitResponse;

        const userId = parseInt(session.user.id);
        const { searchParams } = new URL(req.url);
        const parsedId = categoryIdSchema.safeParse(searchParams.get("id"));

        if (!parsedId.success) {
            return NextResponse.json({ success: false, error: "Valid category ID is required" }, { status: 400 });
        }

        await deleteCategory(userId, parsedId.data);

        return NextResponse.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting custom category:", error);
        return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 500 });
    }
}
