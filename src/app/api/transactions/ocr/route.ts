export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { processOCR } from "@/lib/ai";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBase64, imageUrl } = body;

        if (!imageBase64 && !imageUrl) {
            return NextResponse.json(
                { success: false, error: "No image provided" },
                { status: 400 }
            );
        }

        const imageContent = imageBase64
            ? `data:image/jpeg;base64,${imageBase64}`
            : imageUrl;

        const parsed = await processOCR(imageContent);

        return NextResponse.json({
            success: true,
            data: parsed
        });
    } catch (error) {
        console.error("OCR Error:", error);
        return NextResponse.json(
            { success: false, error: "OCR processing failed" },
            { status: 500 }
        );
    }
}
