import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import bcrypt from "bcryptjs";

async function getUser(email: string) {
    const db = getDb();
    try {
        const user = await db.select().from(users).where(eq(users.email, email)).get();
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    callbacks: {
        async session({ session, token }) {
            if (session?.user && token?.sub) {
                session.user.id = token.sub; // token.sub is usually the ID
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id?.toString();
            }
            return token;
        }
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    if (!user.password) return null; // User might have signed up via OAuth (if enabled later)

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        // Return user with ID as string to satisfy NextAuth types
                        return {
                            ...user,
                            id: user.id.toString(),
                        };
                    }
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
});
