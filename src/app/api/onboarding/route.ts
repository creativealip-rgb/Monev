import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { completeOnboardingAction } from "@/backend/actions/onboarding-actions";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        // Validate required fields
        const onboardingData = {
            currency: body.currency || "IDR",
            language: body.language || "id",
            pin: body.pin || "",
            notifications: body.notifications ?? true,
            initialBalance: Number(body.initialBalance) || 0,
            monthlyIncome: Number(body.monthlyIncome) || 0,
            accounts: Array.isArray(body.accounts) ? body.accounts : [],
            budgetRecommendations: Array.isArray(body.budgetRecommendations)
                ? body.budgetRecommendations
                : [],
        };

        // Call server action
        const result = await completeOnboardingAction(onboardingData);

        if (result.success) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { success: false, error: result.message || "Failed to complete onboarding" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Onboarding API Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
