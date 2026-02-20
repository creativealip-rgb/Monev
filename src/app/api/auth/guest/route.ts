import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, transactions, categories } from "@/backend/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { userSettings } from "@/backend/db/schema";
import { hashPin } from "@/lib/security";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { initialBalance = 0, pin = "", notifications = true } = body;

        const db = getDb();

        // Generate unique guest username and a random password
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const guestEmail = `${guestId}@monev.guest`;
        const guestName = "Pengguna";
        const guestPassword = `gp_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
        const hashedPassword = await bcrypt.hash(guestPassword, 10);

        // Create guest user with password
        const newUser = await db.insert(users).values({
            email: guestEmail,
            name: guestName,
            firstName: guestName,
            username: guestId,
            password: hashedPassword,
        }).returning().get();

        console.log("[Guest] Created guest user:", { id: newUser.id, email: guestEmail });

        // Create user settings for the guest
        let hashedPin: string | null = null;
        if (pin && pin.length === 6) {
            hashedPin = await hashPin(pin);
        }

        await db.insert(userSettings).values({
            userId: newUser.id,
            securityPin: hashedPin,
            isAppLockEnabled: !!hashedPin,
            hourlyRate: 50000,
            hideBalance: false,
            notificationsEnabled: notifications, // Added notifications setting
        });

        // If there's an initial balance, create the first transaction
        if (initialBalance > 0) {
            try {
                // Find or create an income category for this user
                let incomeCategory = await db.select()
                    .from(categories)
                    .where(eq(categories.name, "Pemasukan"))
                    .get();

                if (!incomeCategory) {
                    incomeCategory = await db.insert(categories).values({
                        name: "Pemasukan",
                        type: "income",
                        color: "#10b981",
                        icon: "Wallet",
                    }).returning().get();
                }

                await db.insert(transactions).values({
                    userId: newUser.id,
                    amount: initialBalance,
                    description: "Saldo Awal",
                    type: "income",
                    categoryId: incomeCategory.id,
                    date: new Date(),
                    isVerified: true,
                });

                console.log("[Guest] Created initial balance transaction:", { amount: initialBalance });
            } catch (txError) {
                console.error("[Guest] Failed to create initial balance transaction:", txError);
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                name: guestName,
                email: guestEmail
            },
            credentials: {
                email: guestEmail,
                password: guestPassword,
            }
        });
    } catch (error) {
        console.error("[Guest] Error creating guest user:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create guest user" },
            { status: 500 }
        );
    }
}
