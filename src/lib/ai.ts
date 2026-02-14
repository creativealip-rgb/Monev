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
    paymentMethod?: "cash" | "qris" | "transfer";
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
    intent: "transaction" | "query" | "debt";
    amount?: number;
    description?: string;
    transactionType?: "expense" | "income";
    category?: string;
    paymentMethod?: "cash" | "qris" | "transfer";
    queryEntities?: string[]; // e.g., ["saldo", "pemasukan", "goal"]
    debtorName?: string;
    debtType?: "receivable" | "payable";
}

export interface FinancialContext {
    monthlyStats: {
        income: number;
        expense: number;
        balance: number;
    };
    goals: Array<{
        id: number;
        name: string;
        targetAmount: number;
        currentAmount: number;
        remaining: number;
        percent: number;
    }>;
    budgets: Array<{
        id: number;
        category: string;
        limit: number;
        spent: number;
        remaining: number;
        percent: number;
    }>;
    transactions: Array<{
        id: number;
        date: string;
        amount: number;
        description: string;
        category: string;
        type: "expense" | "income";
    }>;
    investments: Array<{
        id: number;
        name: string;
        type: string;
        quantity: number;
        currentPrice: number;
        totalValue: number;
        platform: string | null;
    }>;
    bills: Array<{
        id: number;
        name: string;
        amount: number;
        dueDate: number;
        isPaid: boolean;
        frequency: string;
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
- paymentMethod: Deteksi metode pembayaran ("cash", "qris", "transfer") jika ada indikasi di gambar. Default "qris" jika tidak yakin, kecuali struk fisik yang terlihat bayar tunai.

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

export async function getPsychologicalImpact(
    amount: number,
    hourlyRate: number,
    primaryGoal?: { name: string; targetAmount: number },
    monthlySaving: number = 0 // Estimated monthly saving capacity
) {
    const workHours = amount / hourlyRate;
    let message = `⏱️ Setara **${workHours.toFixed(1)} jam** kerja.`;

    if (primaryGoal) {
        const percentOfGoal = (amount / primaryGoal.targetAmount) * 100;

        // Calculate Delay
        // Asumsi: Jika saving 0, gunakan 20% dari budget bulanan (misal UMR 5jt -> saving 1jt) as fallback or just 0.
        const dailySaving = monthlySaving > 0 ? monthlySaving / 30 : (amount * 10); // Fallback: anggap user nabung 10% dari jajan ini per hari (arbitrary heuristic)

        const delayDays = Math.ceil(amount / dailySaving);

        if (percentOfGoal > 0.1 || amount > 50000) {
            message += `\n🎯 **Goal Alert: "${primaryGoal.name}"**`;
            message += `\n📉 Jajan ini bikin targetmu **MUNDUR ${delayDays} HARI**!`;

            if (delayDays > 7) {
                message += `\n💀 Yakin? Seminggu kerja rodi cuma buat ini?`;
            } else if (delayDays > 3) {
                message += `\n⚠️ Sayang banget lho...`;
            }
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

export async function getSocialDebtReminder(debtorName: string, amount: number, type: "polite" | "firm" | "aggressive" = "polite"): Promise<string> {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: `Anda adalah asisten "Social Debt Collector" yang ahli merangkai kata-kata untuk menagih utang.
                
Tugas Anda: Buatlah pesan singkat untuk menagih utang ke teman/kerabat.

Konteks:
- Nama: ${debtorName}
- Jumlah: Rp ${amount.toLocaleString('id-ID')}
- Gaya Bahasa: ${type}

Gaya Bahasa Guide:
1. "polite": Sopan, halus, basa-basi dulu (e.g., "Halo bro, apa kabar? Btw mau ingetin...").
2. "firm": Tegas, to the point, formal tapi tidak kasar (e.g., "Halo, mohon segera diselesaikan...").
3. "aggressive": Sarkas, menyindir, atau sedikit menekan (e.g., "Woy, gaya elit bayar utang sulit...").

Buat pesan yang natural dan cocok dikirim via WhatsApp.`
            },
            {
                role: "user",
                content: "Buatkan draft pesannya."
            }
        ],
        max_tokens: 200,
    });

    return response.choices[0]?.message?.content || `Halo ${debtorName}, jangan lupa utangnya Rp ${amount.toLocaleString('id-ID')} ya. Thanks!`;
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
2. "debt": Jika user menyebutkan pinjaman, utang, atau bayarin orang lain (e.g., "pinjamkan Budi 50rb", "utang ke Ani 20rb", "bayarin makan Siti 30rb").
3. "query": Jika user bertanya tentang saldo, pengeluaran, pemasukan, atau target goal.

Jika user bertanya hal yang sama sekali tidak berhubungan dengan keuangan, tetap kategorikan sebagai "query".

Untuk "transaction":
- Ekstrak 'amount', 'description', 'transactionType' (expense/income), 'category', dan 'paymentMethod' (cash/transfer/qris - default "qris" untuk jajan, "transfer" untuk gaji/besar, "cash" jika disebut tunai).
- PENTING: Pilih kategori yang paling sesuai dari daftar berikut:
${CATEGORIES.map(c => `- ${c}`).join("\n")}
- Jika user membeli barang fisik (seperti sepatu, baju, elektronik), gunakan kategori "Belanja".
- Jika user membeli makanan/minuman, gunakan "Makan & Minuman".

Untuk "debt":
- Ekstrak 'amount', 'debtorName' (nama orangnya), 'debtType' ("receivable" jika kita meminjamkan/bayarin, "payable" jika kita berhutang).
- 'description' (optional, e.g. "makan siang").

Untuk "query":
- Ekstrak 'queryEntities'.

Jawab dalam format JSON saja:
{
  "intent": "debt",
  "amount": 50000,
  "debtorName": "Budi",
  "debtType": "receivable",
  "description": "pinjam uang"
}
Aturan categorization yang ketat: Selalu gunakan salah satu dari kategori yang tersedia di atas.`
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
            paymentMethod: parsed.paymentMethod,
            queryEntities: parsed.queryEntities,
            debtorName: parsed.debtorName,
            debtType: parsed.debtType
        };
    } catch (e) {
        console.error("NLP Error:", e);
        return null;
    }
}

/**
 * AI Assistant to answer financial questions based on context.
 */
export async function askFinanceAgent(
    query: string,
    context: FinancialContext,
    history: { role: "user" | "assistant", content: string }[] = []
): Promise<{ content: string; toolCall?: any }> {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });

    try {
        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten keuangan pribadi yang cerdas dan bersahabat. 
SAPAAN: Panggil user dengan sebutan "Bos" atau "Alip".

WAKTU SEKARANG: ${dateStr}, pukul ${timeStr}.
PENTING: Gunakan waktu sekarang sebagai acuan untuk kata "hari ini", "kemarin", "besok", atau "bulan ini".

SUMBER KEBENARAN UTAMA:
Data yang tertera di bawah ini (DATA BULAN INI, TARGET GOAL, dll.) adalah data ASLI dari database saat ini. 
PENTING: Jika riwayat obrolan (history) sebelumnya menyebutkan sebuah data sudah dihapus atau diubah, tapi data tersebut MASIH MUNCUL atau BERBEDA di context di bawah ini, maka Anda HARUS mengikuti data di context ini. Jangan berbohong kepada Bos berdasarkan ingatan masa lalu jika database berkata lain.

Tugas Anda adalah:
1. Menjawab pertanyaan user berdasarkan DATA REAL-TIME yang disediakan di bawah.
2. Membantu mencatat/ubah/hapus transaksi jika diminta.

DATA BULAN INI:
- Pemasukan: Rp ${context.monthlyStats.income.toLocaleString('id-ID')}
- Pengeluaran: Rp ${context.monthlyStats.expense.toLocaleString('id-ID')}
- Saldo (Pemasukan - Pengeluaran): Rp ${context.monthlyStats.balance.toLocaleString('id-ID')}

DATA INVESTASI:
${context.investments ? context.investments.map(i => `- [ID: ${i.id}] ${i.name} (${i.type}): ${i.quantity} unit @ Rp ${i.currentPrice.toLocaleString('id-ID')}/unit = Total Rp ${i.totalValue.toLocaleString('id-ID')} (${i.platform || 'Manual'})`).join("\n") : "Belum ada data investasi"}
Total Nilai Investasi: Rp ${(context.investments || []).reduce((sum, i) => sum + i.totalValue, 0).toLocaleString('id-ID')}

DATA TAGIHAN (BILLS):
${context.bills ? context.bills.map(b => `- [ID: ${b.id}] ${b.name}: Rp ${b.amount.toLocaleString('id-ID')} (Tgl ${b.dueDate}, ${b.frequency}) [${b.isPaid ? 'SUDAH DIBAYAR' : 'BELUM DIBAYAR'}]`).join("\n") : "Belum ada data tagihan"}

TARGET GOAL:
${context.goals.map(g => `- [ID: ${g.id}] ${g.name}: Terkumpul Rp ${g.currentAmount.toLocaleString('id-ID')} dari Rp ${g.targetAmount.toLocaleString('id-ID')} (${g.percent.toFixed(1)}%). Sisa: Rp ${g.remaining.toLocaleString('id-ID')}`).join("\n")}

BUDGET BULAN INI:
${context.budgets.map(b => `- [ID: ${b.id}] ${b.category}: Limit Rp ${b.limit.toLocaleString('id-ID')}, Terpakai Rp ${b.spent.toLocaleString('id-ID')} (${b.percent.toFixed(1)}%). Sisa: Rp ${b.remaining.toLocaleString('id-ID')}`).join("\n")}

RIWAYAT TRANSAKSI TERAKHIR (30 transaksi terakhir):
${context.transactions.map(t => `- [ID: ${t.id}] [${new Date(t.date).toLocaleDateString('id-ID')}] ${t.description}: ${t.type === 'expense' ? '-' : '+'}Rp ${t.amount.toLocaleString('id-ID')} (${t.category})`).join("\n")}

Aturan:
1. Jawab dengan bahasa Indonesia yang santai, suportif, dan ringkas.
2. Gunakan emoji yang relevan.
3. JANGAN GUNAKAN MARKDOWN BOLD (**). Tulis teks seperti biasa saja.
4. Jika saldo menipis, berikan saran penghematan singkat.
5. Jika goal hampir tercapai, berikan semangat!
6. **MENCATAT/UBAH/HAPUS TRANSAKSI**: Gunakan tool 'record_transaction', 'update_transaction', atau 'delete_transaction'.
   - Untuk update/delete, WAJIB gunakan ID yang tertera di data riwayat.
7. **BUAT/UBAH/HAPUS BUDGET**: Gunakan tool 'create_budget', 'update_budget', atau 'delete_budget'.
   - Untuk update/delete, WAJIB gunakan ID yang tertera di data budget.
7. **BUAT/UBAH/HAPUS GOAL**: Gunakan tool 'create_goal', 'update_goal', atau 'delete_goal'.
   - Untuk update/delete, WAJIB gunakan ID yang tertera di data goal.
   - **PENTING**: Jika user ingin membuat goal baru yang belum ada, gunakan 'create_goal'. JANGAN mengubah goal lama milik user
8. **PENGELOLAAN DANA GOAL**:
   - Untuk menambah tabungan ke goal dari Saldo Utama: Gunakan tool add_goal_funds.
   - Untuk memindahkan dana antar goal atau mengembalikan dana goal ke Saldo Utama: Gunakan tool reallocate_goal_funds.
   - Jika Bos minta hapus goal yang MASIH ADA TABUNGANNYA (currentAmount > 0), Anda DILARANG langsung memanggil delete_goal. Anda WAJIB bertanya dulu: "Bos, uang Rp XXX di goal [Nama Goal] mau dipindah ke goal mana? Atau mau saya masukkan kembali ke Saldo (Pemasukan)?"
9. **KELOLA TAGIHAN (BILLS)**:
   - Gunakan tool 'create_bill', 'update_bill', 'delete_bill', atau 'mark_bill_paid'.
   - Jika user bilang "saya sudah bayar listrik pakai saldo", pastikan set parameter 'paidFromBalance' ke true saat memanggil 'mark_bill_paid'.
   - Jika user hanya bilang "saya sudah bayar listrik" (tanpa mention saldo), tanya dulu: "Oke Bos, pembayarannya mau dicatat mengurangi Saldo Utama (buat transaksi pengeluaran) atau cuma tandai lunas saja?"
10. **KELOLA INVESTASI**:
     - Gunakan tool 'create_investment', 'update_investment', atau 'delete_investment'.
     - Jika user ingin MENJUAL atau WITHDRAW investasi:
       - **JUAL SEMUA**: Gunakan 'delete_investment' dengan parameter 'soldAmount'.
       - **JUAL SEBAGIAN (Partial)**: Gunakan 'update_investment'. ANDA HARUS MENGHITUNG MATEMATIKA DENGAN BENAR.
         Contoh: Punya 100 unit, jual 10%. 100 * 0.9 = 90. Maka parameter 'quantity' HARUS 90. Jangan isi 10!
       - WAJIB tanya dulu: "Oke Bos, uang hasil penjualannya berapa? Dan mau dimasukkan kembali ke Saldo Utama (Pemasukan)?"
     - Jika user menyebut nominal penjualan, masukkan ke parameter 'soldAmount' saat memanggil tool.
11. **PENTING - DATA YANG DIHAPUS**: Jika Anda baru saja menghapus sebuah data (transaksi/budget/goal/tagihan/investasi) menggunakan tool delete_* data tersebut sudah tidak ada di database. 
   - JANGAN mencoba mengupdate ID yang baru saja dihapus. 
   - Jika user ingin "mengganti" data yang baru saja dihapus, gunakan tool 'create_*' untuk membuat entry baru.
12. **PENTING: Anda adalah asisten KEUANGAN. Jika user bertanya hal di luar keuangan, jawab dengan sopan bahwa Anda hanya fokus membantu mengelola keuangan Bos.**`
                },
                ...history.map(h => ({
                    role: h.role,
                    content: h.content
                })),
                {
                    role: "user",
                    content: query
                }
            ],
            tools: [
                {
                    type: "function",
                    function: {
                        name: "record_transaction",
                        description: "Mencatat transaksi keuangan baru (pemasukan atau pengeluaran)",
                        parameters: {
                            type: "object",
                            properties: {
                                amount: { type: "number", description: "Nominal transaksi (angka positif)" },
                                description: { type: "string", description: "Keterangan transaksi" },
                                category: { type: "string", description: "Nama kategori" },
                                type: { type: "string", enum: ["expense", "income"], description: "Tipe transaksi" }
                            },
                            required: ["amount", "description", "category", "type"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "create_budget",
                        description: "Membuat budget bulanan baru untuk kategori tertentu",
                        parameters: {
                            type: "object",
                            properties: {
                                amount: { type: "number", description: "Limit budget (angka positif)" },
                                category: { type: "string", description: "Nama kategori budget" },
                                month: { type: "number", description: "Bulan (1-12)" },
                                year: { type: "number", description: "Tahun" }
                            },
                            required: ["amount", "category", "month", "year"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "create_goal",
                        description: "Membuat target tabungan/financial goal baru",
                        parameters: {
                            type: "object",
                            properties: {
                                name: { type: "string", description: "Nama target (misal: Beli Laptop)" },
                                targetAmount: { type: "number", description: "Jumlah yang ingin dikumpulkan" },
                                deadline: { type: "string", description: "Tenggat waktu (format ISO: YYYY-MM-DD)" },
                                icon: { type: "string", description: "Emoji yang cocok untuk goal ini" }
                            },
                            required: ["name", "targetAmount"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_transaction",
                        description: "Mengubah data transaksi yang sudah ada",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID transaksi yang akan diubah" },
                                amount: { type: "number", description: "Nominal baru" },
                                description: { type: "string", description: "Deskripsi baru" },
                                category: { type: "string", description: "Kategori baru" },
                                type: { type: "string", enum: ["expense", "income"], description: "Tipe baru" }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "delete_transaction",
                        description: "Menghapus transaksi",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID transaksi yang akan dihapus" }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_budget",
                        description: "Mengubah limit budget bulanan",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID budget yang akan diubah" },
                                amount: { type: "number", description: "Limit baru" }
                            },
                            required: ["id", "amount"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "delete_budget",
                        description: "Menghapus budget",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID budget yang akan dihapus" }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_goal",
                        description: "Mengubah target tabungan/goal yang sudah ada",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID goal yang akan diubah" },
                                name: { type: "string", description: "Nama baru" },
                                targetAmount: { type: "number", description: "Target nominal baru" },
                                deadline: { type: "string", description: "Deadline baru (YYYY-MM-DD)" },
                                icon: { type: "string", description: "Icon/Emoji baru" }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "reallocate_goal_funds",
                        description: "Memindahkan dana tabungan dari satu goal ke goal lain ATAU dari goal kembali ke saldo umum (Pemasukan)",
                        parameters: {
                            type: "object",
                            properties: {
                                fromGoalId: { type: "number", description: "ID goal sumber dana" },
                                toGoalId: { type: "number", description: "ID goal tujuan (opsional, jika target adalah 'goal')" },
                                target: { type: "string", enum: ["goal", "balance"], description: "Tujuan pengalokasian dana" },
                                amount: { type: "number", description: "Jumlah dana yang akan dipindah (default: semua dana di goal sumber)" }
                            },
                            required: ["fromGoalId", "target"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "add_goal_funds",
                        description: "Menambahkan dana ke sebuah goal dari saldo utama (akan dicatat sebagai pengeluaran/tabungan)",
                        parameters: {
                            type: "object",
                            properties: {
                                goalId: { type: "number", description: "ID goal yang akan ditambah dananya" },
                                amount: { type: "number", description: "Jumlah dana yang ditambahkan" }
                            },
                            required: ["goalId", "amount"]
                        }
                    }
                },
                // --- BILLS TOOLS ---
                {
                    type: "function",
                    function: {
                        name: "create_bill",
                        description: "Mencatat tagihan rutin baru",
                        parameters: {
                            type: "object",
                            properties: {
                                name: { type: "string", description: "Nama tagihan" },
                                amount: { type: "number", description: "Jumlah tagihan" },
                                dueDate: { type: "number", description: "Tanggal jatuh tempo (1-31)" },
                                frequency: { type: "string", enum: ["monthly", "weekly", "yearly"], description: "Frekuensi tagihan (default: monthly)" },
                                icon: { type: "string" }
                            },
                            required: ["name", "amount", "dueDate"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_bill",
                        description: "Mengubah data tagihan",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID tagihan" },
                                name: { type: "string" },
                                amount: { type: "number" },
                                dueDate: { type: "number" }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "delete_bill",
                        description: "Menghapus tagihan",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID tagihan" }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "mark_bill_paid",
                        description: "Menandai tagihan sudah dibayar (atau belum)",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID tagihan" },
                                paidFromBalance: { type: "boolean", description: "Set true jika pembayaran ini harus mengurangi Saldo Utama (membuat transaksi pengeluaran). Default: false" }
                            },
                            required: ["id"]
                        }
                    }
                },
                // --- INVESTMENTS TOOLS ---
                {
                    type: "function",
                    function: {
                        name: "create_investment",
                        description: "Mencatat aset investasi baru",
                        parameters: {
                            type: "object",
                            properties: {
                                name: { type: "string", description: "Nama aset (misal: BBCA, Bitcoin)" },
                                type: { type: "string", enum: ["stock", "crypto", "mutual_fund", "gold", "bond", "other"], description: "Jenis investasi" },
                                quantity: { type: "number", description: "Jumlah unit/lot" },
                                buyPrice: { type: "number", description: "Harga beli rata-rata per unit" },
                                currentPrice: { type: "number", description: "Harga sekarang per unit" },
                                platform: { type: "string", description: "Platform investasi (opsional)" }
                            },
                            required: ["name", "type", "quantity", "buyPrice", "currentPrice"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_investment",
                        description: "Mengubah data investasi (atau jual sebagian/withdraw partial)",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID investasi" },
                                quantity: { type: "number", description: "Jumlah unit BARU (setelah dikurangi/ditambah)" },
                                buyPrice: { type: "number" },
                                currentPrice: { type: "number" },
                                soldAmount: { type: "number", description: "Jika jual sebagian, masukkan nominal uang yang didapat (Rupiah). Nanti akan jadi Pemasukan." }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "delete_investment",
                        description: "Menghapus aset investasi (atau menjual/withdraw)",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID investasi" },
                                soldAmount: { type: "number", description: "Jika dijual, masukkan total nilai penjualan (Rupiah). Jika hanya dihapus (karena salah input), biarkan kosong." }
                            },
                            required: ["id"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "delete_goal",
                        description: "Menghapus target tabungan/goal",
                        parameters: {
                            type: "object",
                            properties: {
                                id: { type: "number", description: "ID goal yang akan dihapus" }
                            },
                            required: ["id"]
                        }
                    }
                }
            ],
            tool_choice: "auto",
            max_tokens: 500,
        });

        const message = response.choices[0]?.message;

        if (message?.tool_calls && message.tool_calls.length > 0) {
            return {
                content: message.content || "Sedang memproses catatan transaksi Anda...",
                toolCall: message.tool_calls[0]
            };
        }

        return {
            content: message?.content || "Duh, maaf saya agak bingung nih. Bisa diulang pertanyaannya?"
        };
    } catch (e) {
        console.error("Agent Chat Error:", e);
        return { content: "Maaf, asisten AI sedang istirahat sebentar. Coba tanya lagi nanti ya!" };
    }
}

/**
 * AI Insight Generator for Analysis Page.
 * Analyzes the 50/30/20 allocation and category breakdowns.
 */
export async function getFinancialInsights(data: {
    income: number;
    expense: number;
    balance: number;
    allocations: Array<{ name: string; amount: number; percentage: number; target: number; color: string }>;
    categoryBreakdown: {
        expense: Array<{ name: string; amount: number; color: string; icon: string }>;
        income: Array<{ name: string; amount: number; color: string; icon: string }>;
    };
}) {
    try {
        const openai = getOpenAIClient();
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Anda adalah asisten AI Analis Keuangan pribadi yang cerdas. 
Tugas Anda adalah menganalisa data alokasi pengeluaran user berdasarkan Rule 50/30/20 dan memberikan saran yang RINGKAS, TAJAM, dan MEMBANTU.

DATA ANALISA BULAN INI:
- Income: Rp ${data.income.toLocaleString('id-ID')}
- Expense: Rp ${data.expense.toLocaleString('id-ID')}
- Sisa Saldo: Rp ${data.balance.toLocaleString('id-ID')}

ALOKASI 50/30/20:
${data.allocations.map(a => `- ${a.name}: ${a.percentage}% (Target Ideal: ${a.target}%)`).join("\n")}

TOP 5 PENGELUARAN PER KATEGORI:
${data.categoryBreakdown.expense.slice(0, 5).map(e => `- ${e.name}: Rp ${e.amount.toLocaleString('id-ID')}`).join("\n")}

ATURAN OUTPUT:
1. Jawab dalam Bahasa Indonesia yang santai tapi profesional (seperti asisten pribadi).
2. Fokus pada 1-2 point paling krusial saja.
3. Jika "Keinginan" (Wants) > 30%, berikan teguran halus dan saran penghematan.
4. Jika "Tabungan" (Savings) < 20%, beri tips cara menambah porsi tabungan.
5. Gunakan emoji yang relevan.
6. JANGAN bertele-tele. Maksimal 3-4 kalimat pendek.
7. Akhiri dengan satu kalimat penyemangat.`
                },
                {
                    role: "user",
                    content: "Berikan analisa singkat dan saran untuk keuangan saya bulan ini."
                }
            ],
            max_tokens: 300,
        });

        return response.choices[0]?.message?.content || "Data belum cukup untuk memberikan analisa. Terus catat transaksi Anda ya! 😊";
    } catch (e) {
        console.error("Financial Insights Error:", e);
        return "Gagal menghasilkan analisa AI saat ini. Coba cek lagi nanti!";
    }
}
