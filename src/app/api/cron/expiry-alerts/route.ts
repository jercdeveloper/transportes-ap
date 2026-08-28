import { NextResponse } from "next/server";
import { sendExpiryAlerts } from "@/lib/expiry-alerts";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const count = await sendExpiryAlerts();

  return NextResponse.json({ alerts: count });
}
