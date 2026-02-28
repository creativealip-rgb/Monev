import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { users } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

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

        console.log("[OAuth] Created new user:", { id: result.id, email, name, firstName: name, username: uniqueUsername });
        return result;
    } catch (error) {
        console.error("Failed to create OAuth user:", error);
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
            console.log("[OAuth] Executing database update:", { userId, updateData });
            const result = await db.update(users)
                .set(updateData)
                .where(eq(users.id, userId))
                .returning()
                .get();
            console.log("[OAuth] Database update result:", result);
        } else {
            console.log("[OAuth] No data to update for user:", userId);
        }
    } catch (error) {
        console.error("[OAuth] Failed to update user with Google data:", error);
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
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("[OAuth] SignIn callback - Provider:", account?.provider);
            console.log("[OAuth] User data:", {
                email: user.email,
                name: user.name,
                image: user.image
            });
            console.log("[OAuth] Profile data:", {
                name: profile?.name,
                email: profile?.email,
                picture: profile?.picture || profile?.image
            });

            // Handle OAuth sign in
            if (account?.provider === "google" && user.email) {
                const db = getDb();
                const existingUser = await db.select().from(users).where(eq(users.email, user.email)).get();

                // Get name from profile first (more reliable), fallback to user.name, then email prefix
                const userName = profile?.name || user.name || user.email.split("@")[0];
                // Get image from profile or user
                const userImage = profile?.picture || profile?.image || user.image;
                // Generate username from email prefix
                const baseUsername = user.email.split("@")[0];

                if (!existingUser) {
                    // Create new user from OAuth data
                    console.log("[OAuth] Creating new user with data:", {
                        email: user.email,
                        name: userName,
                        image: userImage,
                        username: baseUsername
                    });
                    const newUser = await createOAuthUser(user.email, userName, userImage, baseUsername);
                    console.log("[OAuth] New user created:", {
                        userId: newUser.id,
                        name: newUser.name,
                        firstName: newUser.firstName
                    });

                    // Revalidate pages
                    revalidatePath("/profile");
                    revalidatePath("/dashboard");
                } else {
                    // Update existing user with latest Google data
                    console.log("[OAuth] Updating existing user:", {
                        userId: existingUser.id,
                        currentName: existingUser.name,
                        currentFirstName: existingUser.firstName,
                        newName: userName,
                        currentImage: existingUser.image,
                        newImage: userImage
                    });

                    // Force update even if name looks the same (to ensure firstName is set)
                    await updateUserWithGoogleData(existingUser.id, {
                        name: userName,
                        image: userImage,
                        username: baseUsername
                    });

                    // Revalidate profile and dashboard pages
                    revalidatePath("/profile");
                    revalidatePath("/dashboard");

                    // Fetch and verify the update
                    const updatedUser = await db.select().from(users).where(eq(users.id, existingUser.id)).get();
                    console.log("[OAuth] User after update:", {
                        userId: updatedUser?.id,
                        name: updatedUser?.name,
                        firstName: updatedUser?.firstName,
                        image: updatedUser?.image
                    });
                }
            }
            return true;
        },
        async session({ session, token }) {
            console.log("[Session] Callback - Token SUB:", token?.sub);
            if (session?.user && token?.sub) {
                session.user.id = token.sub;

                // Fetch latest user data from database to ensure profile is up to date
                try {
                    const db = getDb();
                    const userId = parseInt(token.sub);
                    if (isNaN(userId)) {
                        console.error("[Session] Invalid user ID in token:", token.sub);
                        return session;
                    }

                    const dbUser = await db.select().from(users).where(eq(users.id, userId)).get();
                    if (dbUser) {
                        console.log("[Session] Found user in DB:", { id: dbUser.id, name: dbUser.name, tier: dbUser.tier });
                        session.user.name = dbUser.name;
                        session.user.image = dbUser.image;
                        // @ts-ignore
                        session.user.tier = dbUser.tier || "miskin";
                    } else {
                        console.log("[Session] User not found in DB for ID:", userId);
                    }
                } catch (error) {
                    console.error("[Session] Failed to fetch user data:", error);
                }
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                console.log("[JWT] Initial login - Provider:", account?.provider, "User ID:", user.id);

                if (account?.provider === "google") {
                    // For Google, we need to map the Google sub ID to our internal database ID
                    const db = getDb();
                    const dbUser = await db.select().from(users).where(eq(users.email, user.email!)).get();
                    if (dbUser) {
                        console.log("[JWT] Mapping Google user to DB ID:", dbUser.id);
                        token.sub = dbUser.id.toString();
                    }
                } else {
                    token.sub = user.id?.toString();
                }

                token.name = user.name;
                token.picture = user.image;
            }
            return token;
        }
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

                console.log("Invalid credentials");
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
