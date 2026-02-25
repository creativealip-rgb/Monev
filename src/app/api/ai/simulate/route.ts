import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAnalysisData, getInvestments, getGoals } from "@/backend/db/operations";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(session.user.id);

        const { scenario, amount, type } = await req.json();

        if (!scenario || !amount || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Gather context
        const [analysis, investments, goals] = await Promise.all([
            getAnalysisData(userId, year, month),
            getInvestments(userId),
            getGoals(userId)
        ]);

        const financialContext = {
            currentStats: {
                monthlyIncome: analysis.income,
                monthlyExpense: analysis.expense,
                balance: analysis.balance
            },
            investments: investments.map(i => ({ name: i.name, value: i.quantity * i.currentPrice })),
            goals: goals.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount }))
        };

        const prompt = `
            Context Finansial User:
            - Pemasukan Bulanan: ${financialContext.currentStats.monthlyIncome}
            - Pengeluaran Bulanan: ${financialContext.currentStats.monthlyExpense}
            - Saldo Sisa: ${financialContext.currentStats.balance}
            - Investasi: ${JSON.stringify(financialContext.investments)}
            - Goals: ${JSON.stringify(financialContext.goals)}

            Skenario "What-If" User:
            - Skenario: ${scenario}
            - Nominal: ${amount}
            - Tipe: ${type} (one_time_expense, recurring_expense, one_time_income, recurring_income)

            Tugas Anda:
            Analisis dampak finansial dari keputusan ini. Berikan jawaban dalam format JSON:
            {
                "impact": "Deskripsi singkat dampak (misal: 'Saldo bulanan akan berkurang drastis')",
                "riskLevel": "high" | "medium" | "low",
                "runwayImpact": "Dampak pada ketahanan dana darurat",
                "goalImpact": "Dampak pada pencapaian goals yang ada",
                "advice": "Saran dari kacamata perencana keuangan profesional (singkat & tajam)"
            }
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: "You are a professional financial advisor specialized in 'What-If' simulations." }, { role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        return NextResponse.json(result);

    } catch (error) {
        console.error("Simulation API Error:", error);
        return NextResponse.json({ error: "Gagal menjalankan simulasi" }, { status: 500 });
    }
}
