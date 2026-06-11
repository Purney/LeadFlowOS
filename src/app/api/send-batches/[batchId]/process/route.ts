import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { processApprovedSendBatch } from "@/services/email-service";

type Params = {
  params: Promise<{
    batchId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const { batchId } = await params;
  const body = (await request.json().catch(() => ({}))) as { dryRun?: boolean };
  const result = await processApprovedSendBatch(
    {
      organisationId: session.user.organisationId,
      userId: session.user.id,
    },
    batchId,
    { dryRun: body.dryRun ?? false },
  );

  if (!result) {
    return NextResponse.json(
      { error: "Only approved batches can be processed." },
      { status: 409 },
    );
  }

  return NextResponse.json(result);
}
