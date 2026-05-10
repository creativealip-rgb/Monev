import { getDb } from "../index";
import { splitBillItems, splitBillParticipants, splitBills } from "../schema";
import { and, desc, eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export type SplitBillItemInput = {
    name: string;
    price: number;
    quantity?: number;
    assignedParticipantName?: string;
};

export type SplitBillParticipantInput = {
    name: string;
    phone?: string;
    amountOwed?: number;
};

export type CreateSplitBillInput = {
    title: string;
    receiptImageUrl?: string;
    paymentInstructions?: string;
    items: SplitBillItemInput[];
    participants: SplitBillParticipantInput[];
};

function publicId() {
    return `split_${randomBytes(8).toString("hex")}`;
}

function paymentToken() {
    return `pay_${randomBytes(12).toString("hex")}`;
}

function itemTotal(item: SplitBillItemInput) {
    return item.price * (item.quantity ?? 1);
}

function calculateParticipants(items: SplitBillItemInput[], participants: SplitBillParticipantInput[]) {
    const explicitTotal = participants.reduce((sum, participant) => sum + (participant.amountOwed ?? 0), 0);
    if (explicitTotal > 0) {
        return participants.map((participant) => ({
            ...participant,
            amountOwed: Math.round((participant.amountOwed ?? 0) * 100) / 100,
        }));
    }

    const total = items.reduce((sum, item) => sum + itemTotal(item), 0);
    const share = participants.length > 0 ? Math.round((total / participants.length) * 100) / 100 : 0;

    return participants.map((participant, index) => ({
        ...participant,
        amountOwed: index === participants.length - 1
            ? Math.round((total - share * (participants.length - 1)) * 100) / 100
            : share,
    }));
}

async function getSplitBillById(id: number) {
    const db = getDb();
    const bill = await db.select().from(splitBills).where(eq(splitBills.id, id)).get();
    if (!bill) return null;

    const [items, participants] = await Promise.all([
        db.select().from(splitBillItems).where(eq(splitBillItems.splitBillId, bill.id)).all(),
        db.select().from(splitBillParticipants).where(eq(splitBillParticipants.splitBillId, bill.id)).all(),
    ]);

    return { ...bill, items, participants };
}

export async function createSplitBill(userId: number, input: CreateSplitBillInput) {
    if (!input.title?.trim()) throw new Error("Judul split bill wajib diisi");
    if (!input.items?.length) throw new Error("Minimal satu item wajib diisi");
    if (!input.participants?.length) throw new Error("Minimal satu peserta wajib diisi");

    const db = getDb();
    const totalAmount = input.items.reduce((sum, item) => sum + itemTotal(item), 0);
    const participants = calculateParticipants(input.items, input.participants);
    const now = new Date();

    const billResult = await db.insert(splitBills).values({
        creatorId: userId,
        publicId: publicId(),
        title: input.title.trim(),
        totalAmount: Math.round(totalAmount * 100) / 100,
        receiptImageUrl: input.receiptImageUrl,
        status: "pending",
        paymentInstructions: input.paymentInstructions,
        createdAt: now,
        updatedAt: now,
    }).returning({ id: splitBills.id });

    const splitBillId = billResult[0].id;
    const insertedParticipants = await db.insert(splitBillParticipants).values(participants.map((participant) => ({
        splitBillId,
        name: participant.name.trim(),
        phone: participant.phone,
        amountOwed: participant.amountOwed,
        paymentToken: paymentToken(),
        createdAt: now,
    }))).returning({ id: splitBillParticipants.id, name: splitBillParticipants.name });

    const participantIdByName = new Map(insertedParticipants.map((participant) => [participant.name.toLowerCase(), participant.id]));

    await db.insert(splitBillItems).values(input.items.map((item) => ({
        splitBillId,
        name: item.name.trim(),
        price: item.price,
        quantity: item.quantity ?? 1,
        assignedParticipantId: item.assignedParticipantName
            ? participantIdByName.get(item.assignedParticipantName.toLowerCase())
            : undefined,
        createdAt: now,
    })));

    return getSplitBillById(splitBillId);
}

export async function listUserSplitBills(userId: number) {
    const db = getDb();
    return db.select().from(splitBills).where(eq(splitBills.creatorId, userId)).orderBy(desc(splitBills.createdAt)).all();
}

export async function getUserSplitBill(userId: number, publicIdOrId: string) {
    const db = getDb();
    const numericId = Number(publicIdOrId);
    const bill = Number.isFinite(numericId)
        ? await db.select().from(splitBills).where(and(eq(splitBills.id, numericId), eq(splitBills.creatorId, userId))).get()
        : await db.select().from(splitBills).where(and(eq(splitBills.publicId, publicIdOrId), eq(splitBills.creatorId, userId))).get();

    return bill ? getSplitBillById(bill.id) : null;
}

export async function getPublicSplitBill(publicId: string) {
    const db = getDb();
    const bill = await db.select().from(splitBills).where(eq(splitBills.publicId, publicId)).get();
    return bill ? getSplitBillById(bill.id) : null;
}

export async function markSplitBillParticipantPaid(paymentTokenValue: string, proofUrl?: string) {
    const db = getDb();
    const participant = await db
        .select()
        .from(splitBillParticipants)
        .where(eq(splitBillParticipants.paymentToken, paymentTokenValue))
        .get();

    if (!participant) return null;

    const now = new Date();
    await db.update(splitBillParticipants).set({
        paidAt: now,
        paymentProofUrl: proofUrl,
    }).where(eq(splitBillParticipants.id, participant.id));

    const participants = await db
        .select()
        .from(splitBillParticipants)
        .where(eq(splitBillParticipants.splitBillId, participant.splitBillId))
        .all();

    const paidCount = participants.filter((item) => item.id === participant.id || item.paidAt).length;
    const status = paidCount === participants.length ? "completed" : "partial";

    await db.update(splitBills).set({ status, updatedAt: now }).where(eq(splitBills.id, participant.splitBillId));

    return getSplitBillById(participant.splitBillId);
}
