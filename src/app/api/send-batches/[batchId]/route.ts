import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateSendBatch } from "@/services/sending-service";
import { sendBatchUpdateSchema } from "@/validation/sending";

type Params = {
  params: Promise<{
    batchId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { batchId } = await params;
    const batch = await updateSendBatch(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      batchId,
      sendBatchUpdateSchema.parse(await request.json()),
    );

    if (!batch) {
      return NextResponse.json({ error: "Send batch not found." }, { status: 404 });
    }

    return NextResponse.json({ batch });
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
