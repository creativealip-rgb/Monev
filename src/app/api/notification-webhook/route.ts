import { NextRequest, NextResponse } from 'next/server';
import { processNotification } from '@/lib/ai';
import { getCategories, getUserByTelegramId } from '@/backend/db/operations';
import { processAndSaveTransaction } from '@/lib/transaction-pipeline';
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { app, title, body: content, timestamp, apiKey } = body;

        // Simple API Key validation
        if (apiKey !== process.env.NOTIFICATION_API_KEY) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        if (!content) {
            return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
        }

        console.log(`Received notification from ${app}: ${content}`);

        // 1. Parse notification using AI
        const parsed = await processNotification(content, title || app);

        if (!parsed || parsed.amount === 0) {
            console.log("AI could not parse transaction from notification or amount is 0.");
            return NextResponse.json({ success: true, message: 'Notification ignored (not a transaction)' });
        }

        // 2. Identify User (For now, we might need a way to link the phone to a user)
        // Since we don't have a direct 'phoneId' yet, we'll try to find a user 
        // who has linked their account. For this implementation, we assume the user 
        // setting up MacroDroid is the primary user or we use a header/apiKey to identify.
        // Let's assume the apiKey is unique per user for now, or we lookup by a 'deviceId'.

        // For demonstration, let's find the first user or a user with a specific flag.
        // In a real app, the apiKey should be user-specific.
        // For now, let's use a hardcoded userId 1 or find by the provided telegramId if MacroDroid sends it.
        const telegramId = body.telegramId;
        let user = null;
        if (telegramId) {
            user = await getUserByTelegramId(telegramId);
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found/linked' }, { status: 404 });
        }

        const userId = user.id;

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
