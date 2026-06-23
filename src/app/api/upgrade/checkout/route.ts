import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPakasirTransaction, isPakasirConfigured } from "@/lib/pakasir";
import { createLogger } from "@/lib/logger";

const logger = createLogger("UpgradeCheckout");

const TIER_PRICES: Record<string, number> = {
  pro: 29000,
  sultan: 49000,
  benefector: 99000,
  benefactor: 99000,
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPakasirConfigured()) {
    return NextResponse.json(
      { error: "Pembayaran belum dikonfigurasi" },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const tier = String(body.tier || "").toLowerCase().replace("benefactor", "benefector");

  if (!TIER_PRICES[tier]) {
    return NextResponse.json(
      { error: "Tier tidak valid. Pilih: pro, sultan, benefactor" },
      { status: 400 },
    );
  }

  const userId = Number(session.user.id);
  const amount = TIER_PRICES[tier];
  const orderRef = `UPG-${userId}-${tier}-${Date.now()}`;

  try {
    const payment = await createPakasirTransaction({
      orderId: orderRef,
      amount,
      method: "qris",
    });

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? "https://monev.app"
    ).replace(/\/$/, "");
    const redirect = `&redirect=${encodeURIComponent(`${appUrl}/fitur/upgrade`)}`;
    const pakasirPaymentUrl = `https://app.pakasir.com/pay/${payment.project}/${payment.amount}?order_id=${encodeURIComponent(payment.order_id)}&qris_only=1${redirect}`;

    logger.info("Pakasir checkout created", { userId, tier, orderRef });

    return NextResponse.json({
      success: true,
      data: { orderRef, pakasirPaymentUrl, amount },
    });
  } catch (error) {
    logger.error("Pakasir checkout failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal membuat pembayaran",
      },
      { status: 502 },
    );
  }
}
