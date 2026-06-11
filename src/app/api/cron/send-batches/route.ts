import { NextResponse } from "next/server";
import { Organisation } from "@/models/organisation";
import { connectToDatabase } from "@/lib/db";
import { requireEnv } from "@/lib/env";
import { processDueApprovedSendBatches } from "@/jobs/send-batch-jobs";

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

  await connectToDatabase();

  const organisations = await Organisation.find({}).select("_id").lean();
  const results = [];

  for (const organisation of organisations) {
    const result = await processDueApprovedSendBatches(organisation._id.toString(), {
      limit: 10,
    });
    results.push({ organisationId: organisation._id.toString(), ...result });
  }

  return NextResponse.json({
    organisations: results.length,
    processed: results.reduce((total, result) => total + result.processed, 0),
    results,
  });
}
