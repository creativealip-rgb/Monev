import "server-only";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/backend/db";
import { userSettings } from "@/backend/db/schema";
import { eq } from "drizzle-orm";

export async function toggleHideBalance(hideBalance: boolean) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = parseInt(session.user.id, 10);
    const db = getDb();

    await db
        .update(userSettings)
        .set({ hideBalance, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId));

    revalidatePath("/dashboard");
    revalidatePath("/settings"); // Assuming there's a settings page where this toggle might live
}
