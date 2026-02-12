export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function getOpenAIClient() {
    const { default: OpenAI } = require("openai");
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten AI yang mengekstrak informasi transaksi keuangan dari gambar receipt atau screenshot transfer. 
                    
Extrahak informasi berikut dari gambar:
- merchantName: Nama toko/merchant (jika ada)
- amount: Jumlah nominal transaksi (angka saja, tanpa Rupiah)
- description: Deskripsi transaksi
- date: Tanggal transaksi (format ISO jika terlihat, atau hari ini jika tidak jelas)

Kategori yang tersedia:
- Makan & Minuman (restoran, cafe, makanan)
- Transportasi (grab, gojek, bensin, parking, tol)
- Hiburan (netflix, spotify, bioskop, game)
- Belanja (belanja online, supermarket, pakaian)
- Kesehatan (apotek, dokter, gym)
- Pendidikan (kursus, buku, sekolah)
- Tagihan (listrik, air, internet, pulsa)
- Investasi (reksadana, saham,crypto)
- Gaji (pendapatan tetap)
- Freelance (pendapatan tidak tetap)
- Lainnya

Jawab dalam format JSON saja, tanpa markdown:
{
  "merchantName": "nama merchant",
  "amount": 50000,
  "description": "deskripsi",
  "date": "2026-02-13",
  "category": "Makan & Minuman"
}`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "image_url",
                            image_url: { url: imageContent }
                        }
                    ]
                }
            ],
            max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content || "";
        
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            return NextResponse.json({
                success: false,
                error: "Failed to parse OCR result",
                raw: content
            });
        }

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
