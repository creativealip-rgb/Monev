import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/timing-safe-equal";
import { syncPendingPakasirPayments } from "@/lib/pakasir-sync";

export const dynamic = "force-dynamic";

async function runCron(request: NextRequest) {
  const provided = request.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  if (!expected)
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  if (!safeEqual(provided, expected))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? 20),
    50,
  );
  const result = await syncPendingPakasirPayments(limit);
  return NextResponse.json({ ok: true, result });
}

export async function GET(request: NextRequest) {
  return runCron(request);
}

export async function POST(request: NextRequest) {
  return runCron(request);
}
