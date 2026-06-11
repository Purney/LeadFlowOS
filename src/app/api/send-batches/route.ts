import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  generateSendBatch,
  listSendBatches,
} from "@/services/sending-service";
import { generateSendBatchSchema } from "@/validation/sending";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const batches = await listSendBatches(session.user.organisationId);
  return NextResponse.json({ batches });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const result = await generateSendBatch(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      generateSendBatchSchema.parse(await request.json()),
    );

    if (!result) {
      return NextResponse.json(
        { error: "Campaign or sending account not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid send batch data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Send batch request failed." },
      { status: 500 },
    );
  }
}
