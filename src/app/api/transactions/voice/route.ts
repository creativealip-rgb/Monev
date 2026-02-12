export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function getOpenAIClient() {
    const { default: OpenAI } = require("openai");
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
    try {
        const openai = getOpenAIClient();
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { success: false, error: "No audio file provided" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await audioFile.arrayBuffer());
        
        const transcription = await openai.audio.transcriptions.create({
            file: new File([buffer], "audio.webm", { type: "audio/webm" }),
            model: "whisper-1",
            language: "id",
            response_format: "json",
        });

        const text = transcription.text;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten AI yang mengekstrak informasi transaksi keuangan dari voice note.
                    
Ekstrak informasi berikut dari teks:
- merchantName: Nama toko/merchant (jika ada)
- amount: Jumlah nominal transaksi (angka saja)
- description: Deskripsi transaksi
- date: Tanggal transaksi (hari ini jika tidak disebut)

Kategori yang tersedia:
- Makan & Minuman (restoran, cafe, makanan)
- Transportasi (grab, gojek, bensin, parking, tol)
- Hiburan (netflix, spotify, bioskop, game)
- Belanja (belanja online, supermarket, pakaian)
- Kesehatan (apotek, dokter, gym)
- Pendidikan (kursus, buku, sekolah)
- Tagihan (listrik, air, internet, pulsa)
- Investasi (reksadana, saham, crypto)
- Gaji (pendapatan tetap)
- Freelance (pendapatan tidak tetap)
- Lainnya

Jawab dalam format JSON saja:
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
                    content: text
                }
            ],
            max_tokens: 500,
        });

        const content = completion.choices[0]?.message?.content || "";
        
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            parsed = {
                description: text,
                amount: 0,
                category: "Lainnya"
            };
        }

        return NextResponse.json({
            success: true,
            data: {
                transcription: text,
                parsed
            }
        });
    } catch (error) {
        console.error("Voice Error:", error);
        return NextResponse.json(
            { success: false, error: "Voice processing failed" },
            { status: 500 }
        );
    }
}
