import { NextResponse } from "next/server";
import { sendPaymentReminders } from "@/lib/payment-reminders";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const period = new Date().toISOString().slice(0, 7);
  const count = await sendPaymentReminders(period);

  return NextResponse.json({ period, sent: count });
}
