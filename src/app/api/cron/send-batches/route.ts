import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/env";
import { processDueApprovedSendBatchesGlobally } from "@/jobs/send-batch-jobs";

export const runtime = "nodejs";
export const maxDuration = 60;
export const preferredRegion = "iad1";

function isAuthorized(request: Request) {
  const expected = requireEnv("CRON_SECRET");
  const header = request.headers.get("authorization");

  return header === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await processDueApprovedSendBatchesGlobally({ limit: 50 });

  return NextResponse.json({
    processed: result.processed,
    results: result.results,
  });
}
