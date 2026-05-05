import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createMobileHandoffToken } from "@/lib/mobile-auth";
import { MobileAuthRedirect } from "./MobileAuthRedirect";

export const dynamic = "force-dynamic";

export default async function MobileAuthCallbackPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const token = await createMobileHandoffToken(session.user.id);
    const encodedToken = encodeURIComponent(token);
    const deepLink = `monev://auth/callback?token=${encodedToken}`;
    const intentLink = `intent://auth/callback?token=${encodedToken}#Intent;scheme=monev;package=com.creativealip.monev;end`;

    return <MobileAuthRedirect deepLink={deepLink} intentLink={intentLink} />;
}
