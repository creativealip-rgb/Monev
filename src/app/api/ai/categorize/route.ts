export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyRateLimit } from "@/lib/api-rate-limit";
import { checkAIRateLimit, incrementAIUsage, getRateLimitHeaders } from "@/lib/rate-limiter";
import { UserTier } from "@/lib/tier-gate";

function getOpenAIClient() {
    const { default: OpenAI } = require("openai");
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const CATEGORIES = [
    "Makan & Minuman",
    "Transportasi",
    "Hiburan",
    "Belanja",
    "Kesehatan",
    "Pendidikan",
    "Tagihan",
    "Investasi",
    "Gaji",
    "Freelance",
    "Lainnya"
];

export async function POST(req: NextRequest) {
    // Rate limiting - AI endpoint
    const rateLimitResponse = await applyRateLimit(req, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        // @ts-ignore
        const userTier = (session.user.tier as UserTier) || "miskin";

        // Check AI daily limit
        const aiRateLimit = checkAIRateLimit(userId, userTier);
        if (!aiRateLimit.allowed) {
            return NextResponse.json(
                {
                    error: "AI limit exceeded",
                    message: `You have reached your daily AI limit (${aiRateLimit.limit} requests).`,
                    used: aiRateLimit.used,
                    limit: aiRateLimit.limit
                },
                {
                    status: 429,
                    headers: getRateLimitHeaders(aiRateLimit)
                }
            );
        }

        const openai = getOpenAIClient();
        const body = await req.json();
        const { merchantName, description } = body;

        if (!merchantName && !description) {
            return NextResponse.json(
                { success: false, error: "No merchant or description provided" },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten AI yang mengategorikan transaksi keuangan berdasarkan nama merchant atau deskripsi.
                    
Nama merchant yang tidak jelas perlu diidentifikasi jenisusnya. Misalnya:
- "CV. MAKMUR JAYA" → perlu dicek, bisa toko bahan kue, bengkel, dll
- "Toko Abadi" → perlu dicek jenisnya
- "Grab" → Transportasi
- "Gojek" → Transportasi
- "Netflix" → Hiburan
- "Spotify" → Hiburan

Kategori yang tersedia:
${CATEGORIES.map(c => `- ${c}`).join("\n")}

Petunjuk tambahan:
- Jika nama merchant jelas (Netflix, Grab, Gojek, Shell, Pertamina), langsung kategorikan
- Jika nama merchant ambigu, gunakan pengetahuan Anda tentang bisnis di Indonesia
- Transaksi dengan nominal besar untuk F&B (>500rb) kemungkinan adalah makan bareng/party

Jawab dalam format JSON saja:
{
  "category": "Nama Kategori",
  "confidence": 0.95,
  "reason": "alasan mengapa memilih kategori ini"
}`
                },
                {
                    role: "user",
                    content: `Merchant: ${merchantName || "tidak ada"}\nDescription: ${description || "tidak ada"}`
                }
            ],
            max_tokens: 300,
        });

        const content = completion.choices[0]?.message?.content || "";

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            parsed = {
                category: "Lainnya",
                confidence: 0.5,
                reason: "Failed to parse, defaulting to Lainnya"
            };
        }

        if (!CATEGORIES.includes(parsed.category)) {
            parsed.category = "Lainnya";
        }

        incrementAIUsage(userId);
        return NextResponse.json({
            success: true,
            data: parsed
        });
    } catch (error) {
        console.error("Categorize Error:", error);
        return NextResponse.json(
            { success: false, error: "Categorization failed" },
            { status: 500 }
        );
    }
}
