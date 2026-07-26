import { NextRequest, NextResponse } from "next/server";
import { runCareersMonitorAll } from "@/lib/monitors/careers";
import { syncFollowUpAlerts } from "@/lib/monitors/network";

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [careers, followUps] = await Promise.all([runCareersMonitorAll(), syncFollowUpAlerts()]);
  return NextResponse.json({ ok: true, careers, followUps });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
