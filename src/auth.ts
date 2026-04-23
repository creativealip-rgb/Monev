import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import type { UserTier } from "@/lib/tier-gate";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createLogger } from "@/lib/logger";

const authLogger = createLogger("Auth");

async function getUser(email: string) {
    const db = getDb();
    try {
        const user = await db.select().from(users).where(eq(users.email, email)).get();
        return user;
    } catch (error) {
        authLogger.error("Failed to fetch user", error);
        throw new Error("Failed to fetch user.");
    }
}

async function generateUniqueUsername(baseUsername: string): Promise<string> {
    const db = getDb();
    let username = baseUsername;
    let counter = 1;

    // Check if username already exists
    while (true) {
        const existingUser = await db.select().from(users).where(eq(users.username, username)).get();
        if (!existingUser) {
            break;
        }
        // If exists, append number and try again
        username = `${baseUsername}${counter}`;
        counter++;
    }

    return username;
}

async function createOAuthUser(email: string, name: string, image?: string | null, username?: string) {
    const db = getDb();
    try {
        // Generate unique username from email prefix
        const baseUsername = username || email.split("@")[0];
        const uniqueUsername = await generateUniqueUsername(baseUsername);

        const result = await db.insert(users).values({
            email,
            name,
            firstName: name, // Set firstName for profile page
            image,
            username: uniqueUsername,
        }).returning().get();

        authLogger.info("Created OAuth user", { userId: result.id, email, username: uniqueUsername });
        return result;
    } catch (error) {
        authLogger.error("Failed to create OAuth user", error);
        throw new Error("Failed to create user.");
    }
}

async function updateUserWithGoogleData(userId: number, googleData: {
    name?: string | null;
    image?: string | null;
    username?: string;
}) {
    const db = getDb();
    try {
        const updateData: { name?: string; firstName?: string; image?: string; username?: string } = {};

        if (googleData.name) {
            updateData.name = googleData.name;
            updateData.firstName = googleData.name; // Also update firstName for profile page
        }
        const currentUser = await db.select().from(users).where(eq(users.id, userId)).get();
        if (googleData.image) {
            // Only update image if current image is null or doesn't look like a local upload
            if (!currentUser?.image || !currentUser.image.startsWith("/uploads/")) {
                updateData.image = googleData.image;
            }
        }
        if (googleData.username) {
            // Only update username if it's different and not already taken
            if (currentUser && currentUser.username !== googleData.username) {
                const existingUser = await db.select().from(users).where(eq(users.username, googleData.username)).get();
                if (!existingUser) {
                    updateData.username = googleData.username;
                }
            }
        }

        if (Object.keys(updateData).length > 0) {
            await db.update(users)
                .set(updateData)
                .where(eq(users.id, userId))
                .run();
            authLogger.debug("Updated OAuth profile", {
                userId,
                updatedFields: Object.keys(updateData),
            });
        }
    } catch (error) {
        authLogger.error("Failed to update user with Google data", error);
        throw new Error("Failed to update user.");
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    trustHost: true,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Handle OAuth sign in
            if (account?.provider === "google" && user.email) {
                const db = getDb();
                const existingUser = await db.select().from(users).where(eq(users.email, user.email)).get();
                authLogger.info("Processing Google sign-in", {
                    email: user.email,
                    existingUserId: existingUser?.id ?? null,
                });

                // Get name from profile first (more reliable), fallback to user.name, then email prefix
                const userName = profile?.name || user.name || user.email.split("@")[0];
                // Get image from profile or user
                const userImage = profile?.picture || profile?.image || user.image;
                // Generate username from email prefix
                const baseUsername = user.email.split("@")[0];

                if (!existingUser) {
                    // Create new user from OAuth data
                    const newUser = await createOAuthUser(user.email, userName, userImage, baseUsername);
                    authLogger.info("Google user created", { userId: newUser.id, email: user.email });

                    // Revalidate pages
                    revalidatePath("/profile");
                    revalidatePath("/dashboard");
                } else {
                    // Update existing user with latest Google data
                    // Force update even if name looks the same (to ensure firstName is set)
                    await updateUserWithGoogleData(existingUser.id, {
                        name: userName,
                        image: userImage,
                        username: baseUsername
                    });

                    // Revalidate profile and dashboard pages
                    revalidatePath("/profile");
                    revalidatePath("/dashboard");

                    authLogger.debug("Google user refreshed", { userId: existingUser.id });
                }
            }
            return true;
        },
        async session({ session, token }) {
            if (session?.user && token?.sub) {
                session.user.id = token.sub;

                // Fetch latest user data from database to ensure profile is up to date
                try {
                    const db = getDb();
                    const userId = parseInt(token.sub);
                    if (isNaN(userId)) {
                        authLogger.warn("Invalid user ID in session token");
                        return session;
                    }

                    const dbUser = await db.select().from(users).where(eq(users.id, userId)).get();
                    if (dbUser) {
                        session.user.name = dbUser.name;
                        session.user.image = dbUser.image;
                        session.user.tier = (dbUser.tier as UserTier) || "starter";
                        
                        // Ensure firstName is always set for profile page
                        if (!dbUser.firstName && (dbUser.name || dbUser.email)) {
                            const firstName = dbUser.name || (dbUser.email ? dbUser.email.split("@")[0] : null);
                            if (firstName) {
                                await db.update(users).set({ firstName }).where(eq(users.id, userId)).run();
                            }
                        }
                        authLogger.debug("Session hydrated from database", {
                            userId: dbUser.id,
                            tier: dbUser.tier,
                        });
                    } else {
                        authLogger.warn("Session user not found in database", { userId });
                    }
                } catch (error) {
                    authLogger.error("Failed to fetch user data for session", error);
                }
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                if (account?.provider === "google") {
                    // For Google, we need to map the Google sub ID to our internal database ID
                    const db = getDb();
                    const dbUser = await db.select().from(users).where(eq(users.email, user.email!)).get();
                    if (dbUser) {
                        token.sub = dbUser.id.toString();
                        authLogger.debug("Mapped Google account to internal user", { userId: dbUser.id });
                    }
                } else {
                    token.sub = user.id?.toString();
                }

                token.name = user.name;
                token.picture = user.image;
            }
            return token;
        },
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    if (!user.password) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        return {
                            ...user,
                            id: user.id.toString(),
                        };
                    }
                }

                authLogger.warn("Invalid credentials attempt");
                return null;
            },
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
            checks: [], // Disable all checks to avoid cookie parsing issues
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    scope: "openid email profile",
                },
            },
            profile(profile) {
                // Extract and normalize Google profile data
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
            },
        }),
    ],
});
