export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { processOCR } from "@/lib/ai";
import { optimizeBase64Image, needsOptimization } from "@/lib/image-optimize";
import { applyRateLimit } from "@/lib/api-rate-limit";

export async function POST(req: NextRequest) {
    // Rate limiting - AI endpoint
    const rateLimitResponse = await applyRateLimit(req, "ai");
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const body = await req.json();
        const { imageBase64, imageUrl } = body;

        if (!imageBase64 && !imageUrl) {
            return NextResponse.json(
                { success: false, error: "No image provided" },
                { status: 400 }
            );
        }

        let imageContent: string;

        if (imageBase64) {
            // Optimize the image before OCR
            const base64WithPrefix = imageBase64.startsWith("data:")
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`;

            try {
                // Check if optimization is needed (for large images)
                const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
                const inputBuffer = Buffer.from(base64Data, "base64");

                const shouldOptimize = await needsOptimization(inputBuffer, 300 * 1024); // 300KB threshold

                if (shouldOptimize) {
                    console.log(`Optimizing image (${(inputBuffer.length / 1024).toFixed(1)}KB -> ...)`);
                    const { buffer } = await optimizeBase64Image(imageBase64, {
                        maxWidth: 1024,
                        maxHeight: 1024,
                        quality: 80,
                        format: "jpeg"
                    });

                    const optimizedBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
                    imageContent = optimizedBase64;
                    console.log(`Optimized image size: ${(buffer.length / 1024).toFixed(1)}KB`);
                } else {
                    // Use original if small enough
                    imageContent = base64WithPrefix;
                }
            } catch (optimizeError) {
                console.error("Image optimization failed, using original:", optimizeError);
                // Fall back to original if optimization fails
                imageContent = base64WithPrefix;
            }
        } else {
            imageContent = imageUrl;
        }

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
