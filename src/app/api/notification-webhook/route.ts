import { NextRequest, NextResponse } from 'next/server';
import { processNotification } from '@/lib/ai';
import { getCategories, getUserByTelegramId, getTransactions } from '@/backend/db/operations';
import { processAndSaveTransaction } from '@/lib/transaction-pipeline';
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();

        if (!rawBody) {
            console.warn("Received empty request body at /api/notification-webhook");
            return NextResponse.json({ success: false, error: 'Empty body' }, { status: 400 });
        }

        let body;
        try {
            body = JSON.parse(rawBody);
        } catch (e) {
            console.error("Failed to parse JSON body:", rawBody);
            return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
        }

        // Handle both JS and Native naming conventions
        const app = body.app || body.package || 'Unknown';
        const title = body.title || '';
        const content = body.body || body.text || ''; // Native uses 'text'
        const timestamp = body.timestamp || body.time || Date.now();
        const apiKey = body.apiKey;
        const notificationId = body.notificationId || body.id || ''; // Native sends this now

        // Simple API Key validation
        if (apiKey !== process.env.NOTIFICATION_API_KEY) {
            console.warn(`Unauthorized access attempt from ${app}. Key: ${apiKey}`);
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Identify User
        const rawTelegramId = String(body.telegramId || '').trim();
        let user = null;
        if (rawTelegramId && rawTelegramId !== 'null' && rawTelegramId !== '') {
            user = await getUserByTelegramId(Number(rawTelegramId));
        }

        if (!user) {
            console.error(`[404] User lookup failed for telegramId: "${rawTelegramId}" (from ${app})`);
            return NextResponse.json({ success: false, error: 'User not found/linked' }, { status: 404 });
        }

        const userId = user.id;

        // 2. Identify Unique Event (Deduplication)
        // Combine notificationId with content to avoid duplicate syncs from Native + JS
        const eventHash = `${userId}-${notificationId || content.substring(0, 50)}-${content.length}`;

        if ((global as any).processingNotifs?.has(eventHash)) {
            console.log(`[Dedupe] Race condition handled for: ${eventHash}`);
            return NextResponse.json({ success: true, message: 'Duplicate (handled)', isDuplicate: true });
        }

        if (!(global as any).processingNotifs) (global as any).processingNotifs = new Set();
        (global as any).processingNotifs.add(eventHash);
        setTimeout(() => (global as any).processingNotifs?.delete(eventHash), 10000);

        console.log(`Processing valid notification from ${app} for User ${userId}`);

        // 3. Parse notification using AI
        const parsed = await processNotification(content, title || app);

        if (!parsed || parsed.amount === 0) {
            console.log(`[Ignore] AI could not parse transaction: "${content.substring(0, 30)}..."`);
            return NextResponse.json({ success: true, message: 'Notification ignored (not a transaction)' });
        }

        // 2.5 Idempotency Check (Anti-Double Record - DB Level)
        // Check if there's a recent transaction with the same amount and type within the last 2 minutes
        const recentTransactions = await getTransactions(userId, 5);
        const now = Date.now();
        const twoMinutesAgo = now - 2 * 60 * 1000;

        const isDuplicate = recentTransactions.some(t => {
            const tDate = new Date(t.date).getTime();
            const sameAmount = Math.abs(t.amount - Number(parsed.amount)) < 0.01;
            const sameType = t.type === (parsed.transactionType || 'expense');
            const withinTime = tDate > twoMinutesAgo;

            // Fuzzy description match (if one contains the other or vice-versa)
            const desc1 = (t.description || '').toLowerCase();
            const desc2 = (parsed.description || '').toLowerCase();
            const similarDesc = desc1.includes(desc2) || desc2.includes(desc1) || desc1.substring(0, 10) === desc2.substring(0, 10);

            return sameAmount && sameType && withinTime && similarDesc;
        });

        if (isDuplicate) {
            console.log(`Duplicate transaction detected for user ${userId}: ${parsed.amount} - ${parsed.description}. Skipping.`);
            return NextResponse.json({
                success: true,
                message: 'Duplicate transaction ignored (already recorded recently)',
                isDuplicate: true
            });
        }

        // 3. Save Transaction via Shared Pipeline
        const cats = await getCategories();
        const categoryName = parsed.category || "Lainnya";
        const category = cats.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) ||
            cats.find(c => c.name === "Lainnya") ||
            { id: 1, name: "Lainnya" };

        const { transaction, message } = await processAndSaveTransaction(userId, {
            amount: Number(parsed.amount),
            description: parsed.description || `Notifikasi ${app}`,
            merchantName: parsed.merchantName,
            categoryId: category.id,
            categoryName: category.name,
            type: (parsed.transactionType as 'expense' | 'income') || 'expense',
            date: new Date(timestamp || Date.now()),
            paymentMethod: 'bank_transfer',
        }, 'notification');

        // 4. Notify via Telegram if user is linked
        if (user.telegramId) {
            await sendTelegramMessage(Number(user.telegramId), message);
        }

        return NextResponse.json({
            success: true,
            transactionId: transaction.id,
            parsed
        });

    } catch (error) {
        console.error("Notification Webhook Error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
