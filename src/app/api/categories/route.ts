import { NextResponse } from "next/server";
import { getCategories, createCategory, deleteCategory } from "@/backend/db/operations";
import { auth } from "@/auth";
import { z } from "zod";

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
    name: z.string().min(1, "Nama kategori wajib diisi"),
    icon: z.string().min(1, "Icon wajib dipilih"),
    color: z.string().min(1, "Warna wajib dipilih"),
    type: z.enum(["expense", "income"]),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const body = await req.json();
        const validatedData = createCategorySchema.parse(body);

        const category = await createCategory({
            ...validatedData,
            userId
        });

        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: (error as any).errors[0].message }, { status: 400 });
        }
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

        const userId = parseInt(session.user.id);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
        }

        await deleteCategory(userId, parseInt(id));

        return NextResponse.json({ success: true, message: "Category deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting custom category:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to delete category" }, { status: 500 });
    }
}
