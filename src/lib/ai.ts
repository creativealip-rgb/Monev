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

export interface AIResult {
    type?: "receipt" | "checkout";
    transactionType?: "expense" | "income";
    merchantName?: string;
    amount: number;
    description: string;
    date: string;
    category: string;
}

export interface CategorizationResult {
    category: string;
    transactionType: "expense" | "income";
    confidence: number;
    reason: string;
    searchUsed: boolean;
    merchantType?: string;
}

export interface NLPResult {
    intent: "transaction" | "query";
    amount?: number;
    description?: string;
    transactionType?: "expense" | "income";
    category?: string;
    queryEntities?: string[]; // e.g., ["saldo", "pemasukan", "goal"]
}

export interface FinancialContext {
    monthlyStats: {
        income: number;
        expense: number;
        balance: number;
    };
    goals: Array<{
        name: string;
        targetAmount: number;
        currentAmount: number;
        remaining: number;
        percent: number;
    }>;
    userName?: string;
}

export async function processOCR(input: Buffer | string): Promise<AIResult> {
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
                    content: `Anda adalah asisten AI yang mengekstrak informasi transaksi keuangan dari gambar receipt (struk belanja) atau screenshot checkout (keranjang belanja/halaman pembayaran). 
                    
Extrahak informasi berikut dari gambar:
- type: "receipt" (jika sudah dibayar/ada bukti transfer) atau "checkout" (jika masih berupa keranjang belanja/menunggu pembayaran)
- transactionType: "expense" (pengeluaran) atau "income" (pemasukan, misal transfer masuk/gaji)
- merchantName: Nama toko/merchant (jika ada)
- amount: Jumlah nominal transaksi (angka saja, tanpa Rupiah)
- description: Deskripsi transaksi
- date: Tanggal transaksi (format ISO YYYY-MM-DD). PENTING: Jika tanggal di struk terlihat sangat lama (misal tahun lalu), gunakan tanggal hari ini (${new Date().toISOString().split('T')[0]}) kecuali user menyebutkan tanggal spesifik.

Kategori yang tersedia:
${CATEGORIES.map(c => `- ${c}`).join("\n")}

Jawab dalam format JSON saja, tanpa markdown:
{
  "type": "receipt",
  "transactionType": "expense",
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
            transactionType: "expense",
            description: "Gagal memproses gambar",
            category: "Lainnya",
            date: new Date().toISOString()
        };
    }
}

export async function processVoice(audioBuffer: Buffer): Promise<{ transcription: string; parsed: AIResult }> {
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
- transactionType: "expense" (pengeluaran) atau "income" (pemasukan, misal gajian/transfer masuk)
- description: Deskripsi transaksi
- date: Tanggal transaksi (format ISO YYYY-MM-DD). PENTING: Jika tidak disebutkan tahun, gunakan tahun sekarang (${new Date().getFullYear()}). Jika tanggal terlihat lama, gunakan tanggal hari ini (${new Date().toISOString().split('T')[0]}).

Kategori yang tersedia:
${CATEGORIES.map(c => `- ${c}`).join("\n")}

Jawab dalam format JSON saja:
{
  "merchantName": "nama merchant",
  "amount": 50000,
  "transactionType": "expense",
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
                transactionType: "expense",
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

async function searchMerchant(merchantName: string): Promise<string | null> {
    try {
        const query = encodeURIComponent(`${merchantName} toko bisnis Indonesia`);
        const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`;

        const res = await fetch(url, {
            signal: AbortSignal.timeout(5000)
        });

        if (!res.ok) return null;
        const data = await res.json();
        const parts: string[] = [];

        if (data.Abstract) parts.push(data.Abstract);
        if (data.AbstractText) parts.push(data.AbstractText);

        if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
            for (const topic of data.RelatedTopics.slice(0, 3)) {
                if (topic.Text) parts.push(topic.Text);
            }
        }

        const result = parts.join(". ").substring(0, 500);

        if (!result || result.length < 10) {
            return await searchMerchantFallback(merchantName);
        }

        console.log(`[Detective] Web search for "${merchantName}":`, result.substring(0, 100));
        return result;
    } catch (e) {
        console.warn("[Detective] Web search failed:", e);
        return await searchMerchantFallback(merchantName);
    }
}

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

export async function categorizeTransaction(merchantName: string | null, description: string | null): Promise<CategorizationResult> {
    try {
        const openai = getOpenAIClient();

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
  "transactionType": "expense",
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

        if (result1.confidence >= 0.7) {
            return { ...result1, searchUsed: false, transactionType: result1.transactionType || "expense" };
        }

        const searchContext = merchantName ? await searchMerchant(merchantName) : null;

        if (!searchContext) {
            return { ...result1, searchUsed: false, transactionType: result1.transactionType || "expense" };
        }

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
  "transactionType": "expense",
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
        return { ...result2, searchUsed: true, transactionType: result2.transactionType || "expense" };

    } catch (e) {
        console.error("Categorize Error:", e);
        return {
            category: "Lainnya",
            transactionType: "expense",
            confidence: 0,
            reason: "AI Error or Parse Error",
            searchUsed: false
        };
    }
}

export async function getPsychologicalImpact(amount: number, hourlyRate: number, primaryGoal?: { name: string; targetAmount: number }) {
    const workHours = amount / hourlyRate;
    let message = `⏱️ Pengeluaran ini sebanding dengan **${workHours.toFixed(1)} jam** kerja kamu.`;

    if (primaryGoal) {
        const percentOfGoal = (amount / primaryGoal.targetAmount) * 100;
        message += `\n🎯 Ini setara dengan **${percentOfGoal.toFixed(2)}%** dari target **"${primaryGoal.name}"** kamu.`;

        if (percentOfGoal > 0.05) {
            message += `\n⚠️ Hati-hati Bos, jajan ini bikin target "${primaryGoal.name}" makin menjauh!`;
        }
    }

    return message;
}

export async function getImpulseJudgment(data: { item: string, amount: number, category: string }, recentHistory: any[], budgetInfo?: any) {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `Anda adalah "Impulse Buying Judge" yang galak, sarkas, tapi peduli dengan masa depan finansial user. 
Tugas Anda adalah menilai apakah user sebaiknya checkout barang ini atau tidak.

Data Konteks:
- Item: ${data.item}
- Harga: Rp ${data.amount.toLocaleString('id-ID')}
- Kategori: ${data.category}
- Riwayat barang serupa/kategori ini baru-baru ini: ${JSON.stringify(recentHistory)}
- Budget sisa bulan ini (kategori ${data.category}): ${budgetInfo ? `Rp ${(budgetInfo.amount - budgetInfo.spent).toLocaleString('id-ID')}` : "Tidak ada budget set"}

Aturan:
1. Beri penilaian yang punchy, jujur, dan sedikit "nyelekit" jika user terlihat boros atau impulsif. 
2. Gunakan bahasa Indonesia santai (gaul/seru). 
3. Jika budget sudah tipis atau habis, larang dengan keras!
4. Ingatkan tentang konsekuensi terhadap kondisi dompet mereka.
5. Jawab dalam 2-3 kalimat saja.`
            },
            {
                role: "user",
                content: "Haruskah saya beli ini?"
            }
        ],
        max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "Pikir-pikir dulu deh, mending simpan duitnya buat masa depan.";
}

/**
 * Natural Language Processor for flexible text input.
 * Handles "freelance 10 juta", "tadi makan soto 25rb" (TRANSACTION)
 * or "berapa saldo saya?", "goal kurang berapa?" (QUERY)
 */
export async function processNLP(text: string): Promise<NLPResult | null> {
    try {
        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten AI yang menganalisa pesan user untuk menentukan apakah mereka ingin MENCATAT transaksi atau BERTANYA tentang keuangan mereka.
                    
Tentukan intent:
1. "transaction": Jika user menyebutkan barang/jasa dan nominal uang (e.g., "makan 20rb", "gajian 10jt").
2. "query": Jika user bertanya tentang saldo, pengeluaran, pemasukan, atau target goal. Pastikan pertanyaan tetap di ranah KEUANGAN PRIBADI.

Jika user bertanya hal yang sama sekali tidak berhubungan dengan keuangan (misal: "siapa presiden?", "resep nasi goreng", dll), tetap kategorikan sebagai "query", tapi asisten di langkah selanjutnya akan menolak menjawab secara detail.

Untuk "transaction":
- Ekstrak 'amount' (nominal angka), 'description', 'transactionType' (expense/income), dan 'category'.

Untuk "query":
- Ekstrak 'queryEntities' (daftar hal yang ditanyakan: "saldo", "pemasukan", "pengeluaran", "goal").

Jawab dalam format JSON saja:
{
  "intent": "transaction",
  "amount": 10000000,
  "description": "gajian freelance",
  "transactionType": "income",
  "category": "Freelance"
}
Atau:
{
  "intent": "query",
  "queryEntities": ["saldo", "pemasukan"]
}`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            max_tokens: 300,
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content || "";
        const parsed = JSON.parse(cleanJsonResponse(content));

        return {
            intent: parsed.intent || "transaction",
            amount: parsed.amount ? Number(parsed.amount) : undefined,
            description: parsed.description || text,
            transactionType: parsed.transactionType,
            category: parsed.category,
            queryEntities: parsed.queryEntities
        };
    } catch (e) {
        console.error("NLP Error:", e);
        return null;
    }
}

/**
 * AI Assistant to answer financial questions based on context.
 */
export async function askFinanceAgent(query: string, context: FinancialContext): Promise<string> {
    try {
        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten keuangan pribadi yang cerdas dan bersahabat. 
Tugas Anda adalah menjawab pertanyaan user berdasarkan data keuangan berikut:

DATA BULAN INI:
- Pemasukan: Rp ${context.monthlyStats.income.toLocaleString('id-ID')}
- Pengeluaran: Rp ${context.monthlyStats.expense.toLocaleString('id-ID')}
- Saldo (Pemasukan - Pengeluaran): Rp ${context.monthlyStats.balance.toLocaleString('id-ID')}

TARGET GOAL:
${context.goals.map(g => `- ${g.name}: Terkumpul Rp ${g.currentAmount.toLocaleString('id-ID')} dari Rp ${g.targetAmount.toLocaleString('id-ID')} (${g.percent.toFixed(1)}%). Sisa: Rp ${g.remaining.toLocaleString('id-ID')}`).join("\n")}

Aturan:
1. Jawab dengan bahasa Indonesia yang santai, suportif, dan ringkas.
2. Gunakan emoji yang relevan.
3. Jika saldo menipis, berikan saran penghematan singkat.
4. Jika goal hampir tercapai, berikan semangat!
5. **PENTING: Anda adalah asisten KEUANGAN. Jika user bertanya hal di luar keuangan (politik, selebriti, pengetahuan umum non-finansial, dll), jawab dengan sopan bahwa Anda hanya fokus membantu mengelola keuangan Bos.** Jangan menjawab pertanyaan seperti "siapa presiden", "cuaca hari ini", atau topik non-keuangan lainnya.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            max_tokens: 500,
        });

        return response.choices[0]?.message?.content || "Duh, maaf saya agak bingung nih. Bisa diulang pertanyaannya?";
    } catch (e) {
        console.error("Agent Chat Error:", e);
        return "Maaf, asisten AI sedang istirahat sebentar. Coba tanya lagi nanti ya!";
    }
}
