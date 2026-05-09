import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateBudgetSuggestion } from "@/backend/services/budgetSuggestionService";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { monthlyIncome } = body;

    if (!monthlyIncome || monthlyIncome <= 0) {
      return NextResponse.json(
        { error: "Invalid monthlyIncome. Must be a positive number" },
        { status: 400 }
      );
    }

    const suggestion = generateBudgetSuggestion(monthlyIncome);

    return NextResponse.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    console.error("Error generating budget suggestion:", error);
    return NextResponse.json(
      { error: "Failed to generate budget suggestion" },
      { status: 500 }
    );
  }
}
