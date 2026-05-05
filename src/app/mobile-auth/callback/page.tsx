import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createMobileHandoffToken } from "@/lib/mobile-auth";

export default async function MobileAuthCallbackPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const token = await createMobileHandoffToken(session.user.id);
    redirect(`monev://auth/callback?token=${encodeURIComponent(token)}`);
}
