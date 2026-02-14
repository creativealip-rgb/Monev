export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { processVoice } from "@/lib/ai";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { success: false, error: "No audio file provided" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await audioFile.arrayBuffer());
        const result = await processVoice(buffer);

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Voice Error:", error);
        return NextResponse.json(
            { success: false, error: "Voice processing failed" },
            { status: 500 }
        );
    }
}
