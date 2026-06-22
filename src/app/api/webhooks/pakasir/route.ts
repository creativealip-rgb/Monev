import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { users, mayarPayments } from "@/backend/db/schema";
import {
  getPakasirTransactionDetail,
  pakasirProject,
  type PakasirWebhook,
} from "@/lib/pakasir";
import { createLogger } from "@/lib/logger";

const logger = createLogger("PakasirWebhook");

type Tier = "pro" | "sultan";

function identifyTier(orderId: string): { tier?: Tier; isBenefector: boolean } {
  const id = orderId.toLowerCase();
  const isBenefector = id.includes("benefector") || id.includes("benefactor");
  if (id.includes("sultan")) return { tier: "sultan", isBenefector };
  if (id.includes("pro")) return { tier: "pro", isBenefector };
  return { isBenefector };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PakasirWebhook | null;
  if (!body?.order_id || !body.amount || !body.project) {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const expectedProject = pakasirProject();
  if (expectedProject && body.project !== expectedProject) {
    return NextResponse.json({ error: "Project mismatch" }, { status: 403 });
  }

  const orderId = body.order_id;
  const amount = Number(body.amount);
  const plan = identifyTier(orderId);

  // Extract user ID from order ID: format UPG-{userId}-{tier}-{timestamp}
  const match = orderId.match(/^UPG-(\d+)-/);
  const userId = match ? Number(match[1]) : null;

  if (!userId) {
    logger.warn("Cannot extract userId from order_id", { orderId });
    return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
  }

  // Verify with Pakasir API
  try {
    const detail = await getPakasirTransactionDetail({ orderId, amount });
    if (detail.transaction?.status !== "completed") {
      return NextResponse.json({
        ok: true,
        ignored: true,
        status: detail.transaction?.status ?? body.status,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify Pakasir transaction",
      },
      { status: 502 },
    );
  }

  const db = getDb();

  // Idempotency: check if already recorded
  const existing = await db
    .select()
    .from(mayarPayments)
    .where(eq(mayarPayments.transactionId, orderId))
    .get();
  if (existing) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  // Verify user exists
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Activate tier
  const userPatch: Partial<typeof users.$inferInsert> = {};
  if (plan.tier) {
    userPatch.tier = plan.tier;
    userPatch.tierExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  if (plan.isBenefector) {
    userPatch.isBenefector = true;
  }

  if (Object.keys(userPatch).length > 0) {
    await db.update(users).set(userPatch).where(eq(users.id, userId)).run();
  }

  // Record payment
  await db.insert(mayarPayments).values({
    transactionId: orderId,
    userId,
    customerEmail: user.email,
    customerName: user.name,
    productId: `monev-${plan.tier ?? "benefector"}`,
    productName: `Monev ${plan.tier ? plan.tier.toUpperCase() : "Benefector"}`,
    amount,
    status: "completed",
    tier: plan.tier,
    isBenefector: plan.isBenefector,
    rawPayload: JSON.stringify(body),
  });

  logger.info("Pakasir payment activated", {
    userId,
    tier: plan.tier,
    isBenefector: plan.isBenefector,
  });

  return NextResponse.json({ ok: true, activated: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, provider: "pakasir" });
}
