import { DefaultSession } from "next-auth";
import type { UserTier } from "@/lib/tier-gate";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            tier: UserTier;
            sessionToken?: string;
        } & DefaultSession["user"];
    }
}
