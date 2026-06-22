import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { mayarPayments, users } from "@/backend/db/schema";
import { getPakasirTransactionDetail } from "@/lib/pakasir";
import { createLogger } from "@/lib/logger";

const logger = createLogger("PakasirSync");

type Tier = "pro" | "sultan";

export type PakasirSyncResult = {
  scanned: number;
  activated: number;
  errors: Array<{ ref: string; error: string }>;
};

function identifyTier(orderId: string): { tier?: Tier; isBenefector: boolean } {
  const id = orderId.toLowerCase();
  const isBenefector = id.includes("benefector") || id.includes("benefactor");
  if (id.includes("sultan")) return { tier: "sultan", isBenefector };
  if (id.includes("pro")) return { tier: "pro", isBenefector };
  return { isBenefector };
}

/**
 * Sync pending Pakasir upgrade payments.
 * Scans mayarPayments with status "pending_pakasir" and checks Pakasir API.
 */
export async function syncPendingPakasirPayments(
  limit = 20,
): Promise<PakasirSyncResult> {
  const result: PakasirSyncResult = { scanned: 0, activated: 0, errors: [] };
  const db = getDb();

  const pending = await db
    .select()
    .from(mayarPayments)
    .where(eq(mayarPayments.status, "pending_pakasir"))
    .orderBy(desc(mayarPayments.createdAt))
    .limit(limit)
    .all();

  for (const payment of pending) {
    result.scanned += 1;
    try {
      const detail = await getPakasirTransactionDetail({
        orderId: payment.transactionId,
        amount: Math.round(Number(payment.amount)),
      });

      if (detail.transaction?.status !== "completed") continue;

      // Activate
      if (payment.userId) {
        const plan = identifyTier(payment.transactionId);
        const userPatch: Partial<typeof users.$inferInsert> = {};
        if (plan.tier) {
          userPatch.tier = plan.tier;
          userPatch.tierExpiresAt = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          );
        }
        if (plan.isBenefector) {
          userPatch.isBenefector = true;
        }

        if (Object.keys(userPatch).length > 0) {
          await db
            .update(users)
            .set(userPatch)
            .where(eq(users.id, payment.userId))
            .run();
        }
      }

      await db
        .update(mayarPayments)
        .set({ status: "completed" })
        .where(eq(mayarPayments.id, payment.id))
        .run();

      result.activated += 1;
      logger.info("Pakasir sync activated", {
        transactionId: payment.transactionId,
      });
    } catch (error) {
      result.errors.push({
        ref: payment.transactionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
