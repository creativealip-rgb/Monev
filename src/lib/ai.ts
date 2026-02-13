import OpenAI from "openai";

function getOpenAIClient() {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const CATEGORIES = [
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

function cleanJsonResponse(content: string) {
    return content.replace(/^```json/, "").replace(/```$/, "").trim();
}

export async function processOCR(input: Buffer | string) {
    try {
        const openai = getOpenAIClient();
        // Support both Buffer (from Telegram) and string URL (from web API)
        const imageContent = typeof input === "string"
            ? input
            : `data:image/jpeg;base64,${input.toString("base64")}`;

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
- date: Tanggal transaksi (format ISO YYYY-MM-DD). PENTING: Jika tanggal di struk terlihat sangat lama (misal tahun lalu), gunakan tanggal hari ini (${new Date().toISOString().split('T')[0]}) kecuali user menyebutkan tanggal spesifik.

Kategori yang tersedia:
${CATEGORIES.map(c => `- ${c}`).join("\n")}

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
        return JSON.parse(cleanJsonResponse(content));
    } catch (e) {
        console.error("OCR Error:", e);
        return {
            amount: 0,
            description: "Gagal memproses gambar",
            category: "Lainnya",
            date: new Date().toISOString()
        };
    }
}

export async function processVoice(audioBuffer: Buffer) {
    let text = "";
    try {
        const openai = getOpenAIClient();

        // Correctly convert Buffer to File for OpenAI v4+ in Node
        const file = await OpenAI.toFile(audioBuffer, "audio.ogg", { type: "audio/ogg" });

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: "id",
            response_format: "json",
        });

        text = transcription.text;

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
- date: Tanggal transaksi (format ISO YYYY-MM-DD). PENTING: Jika tanggal di struk terlihat sangat lama (misal tahun lalu), gunakan tanggal hari ini (${new Date().toISOString().split('T')[0]}) kecuali user menyebutkan tanggal spesifik.

Kategori yang tersedia:
${CATEGORIES.map(c => `- ${c}`).join("\n")}

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
        return { transcription: text, parsed: JSON.parse(cleanJsonResponse(content)) };
    } catch (e) {
        console.error("Voice Error:", e);
        return {
            transcription: text,
            parsed: {
                amount: 0,
                description: text || "Gagal memproses suara",
                category: "Lainnya",
                date: new Date().toISOString()
            }
        };
    }
}

// =====================================
// Detective Agent: Smart Categorization
// =====================================

/**
 * Search the web for a merchant name to determine what type of business it is.
 * Uses DuckDuckGo (no API key required).
 */
async function searchMerchant(merchantName: string): Promise<string | null> {
    try {
        const query = encodeURIComponent(`${merchantName} toko bisnis Indonesia`);
        const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`;

        const res = await fetch(url, {
            signal: AbortSignal.timeout(5000) // 5s timeout
        });

        if (!res.ok) return null;
        const data = await res.json();

        // Collect useful text from DuckDuckGo response
        const parts: string[] = [];

        if (data.Abstract) parts.push(data.Abstract);
        if (data.AbstractText) parts.push(data.AbstractText);

        // Check related topics for hints
        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics.slice(0, 3)) {
                if (topic.Text) parts.push(topic.Text);
            }
        }

        const result = parts.join(". ").substring(0, 500);

        if (!result || result.length < 10) {
            // Fallback: try Google search via scraping snippet
            return await searchMerchantFallback(merchantName);
        }

        console.log(`[Detective] Web search for "${merchantName}":`, result.substring(0, 100));
        return result;
    } catch (e) {
        console.warn("[Detective] Web search failed:", e);
        return await searchMerchantFallback(merchantName);
    }
}

/**
 * Fallback search using simple Google scraping for merchant info.
 */
async function searchMerchantFallback(merchantName: string): Promise<string | null> {
    try {
        const query = encodeURIComponent(`"${merchantName}" adalah`);
        const url = `https://www.google.com/search?q=${query}&num=3&hl=id`;

        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) return null;
        const html = await res.text();

        // Extract text snippets from search results (between > and <)
        const snippets = html.match(/<span[^>]*>([^<]{20,200})<\/span>/g);
        if (!snippets || snippets.length === 0) return null;

        const cleanSnippets = snippets
            .map(s => s.replace(/<[^>]*>/g, ""))
            .filter(s => s.length > 20 && !s.includes("javascript"))
            .slice(0, 3)
            .join(". ");

        console.log(`[Detective] Fallback search for "${merchantName}":`, cleanSnippets.substring(0, 100));
        return cleanSnippets || null;
    } catch (e) {
        console.warn("[Detective] Fallback search also failed:", e);
        return null;
    }
}

/**
 * Smart categorization with "Detective Agent" two-pass system:
 * - Pass 1: AI categorizes with internal knowledge
 * - Pass 2: If confidence < 0.7, search the web for merchant info, then re-categorize
 */
export async function categorizeTransaction(merchantName: string | null, description: string | null) {
    try {
        const openai = getOpenAIClient();

        // === PASS 1: AI Internal Knowledge ===
        const pass1 = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten AI yang mengategorikan transaksi keuangan berdasarkan nama merchant atau deskripsi.
                    
Kategori yang tersedia:
${CATEGORIES.map(c => `- ${c}`).join("\n")}

Jawab dalam format JSON saja:
{
  "category": "Nama Kategori",
  "confidence": 0.95,
  "reason": "alasan singkat"
}`
                },
                {
                    role: "user",
                    content: `Merchant: ${merchantName || "tidak ada"}\nDescription: ${description || "tidak ada"}`
                }
            ],
            max_tokens: 300,
        });

        const pass1Content = pass1.choices[0]?.message?.content || "";
        const result1 = JSON.parse(cleanJsonResponse(pass1Content));

        console.log(`[Detective] Pass 1 — "${merchantName}" → ${result1.category} (confidence: ${result1.confidence})`);

        // If confidence is high enough, return immediately
        if (result1.confidence >= 0.7) {
            return { ...result1, searchUsed: false };
        }

        // === PASS 2: Web Search + Re-categorize ===
        console.log(`[Detective] Confidence low (${result1.confidence}). Searching web for "${merchantName}"...`);

        const searchContext = merchantName ? await searchMerchant(merchantName) : null;

        if (!searchContext) {
            console.log("[Detective] No web results found. Using Pass 1 result.");
            return { ...result1, searchUsed: false };
        }

        // Re-categorize with search context
        const pass2 = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten AI yang mengategorikan transaksi keuangan.

Berikut informasi dari internet tentang merchant ini:
"${searchContext}"

Berdasarkan informasi di atas DAN nama merchant, tentukan kategori yang tepat.

Kategori yang tersedia:
${CATEGORIES.map(c => `- ${c}`).join("\n")}

Jawab dalam format JSON saja:
{
  "category": "Nama Kategori",
  "confidence": 0.95,
  "reason": "alasan berdasarkan info dari internet",
  "merchantType": "jenis usaha yang ditemukan"
}`
                },
                {
                    role: "user",
                    content: `Merchant: ${merchantName}\nDescription: ${description || "tidak ada"}`
                }
            ],
            max_tokens: 300,
        });

        const pass2Content = pass2.choices[0]?.message?.content || "";
        const result2 = JSON.parse(cleanJsonResponse(pass2Content));

        console.log(`[Detective] Pass 2 — "${merchantName}" → ${result2.category} (confidence: ${result2.confidence}, type: ${result2.merchantType})`);

        return { ...result2, searchUsed: true };

    } catch (e) {
        console.error("Categorize Error:", e);
        return {
            category: "Lainnya",
            confidence: 0,
            reason: "AI Error or Parse Error",
            searchUsed: false
        };
    }
}
