import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { moveLifecycleAccountStage } from "@/services/lifecycle-service";
import { lifecycleStageUpdateSchema } from "@/validation/lifecycle";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid lifecycle stage data." },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: "Stage update failed." }, { status: 500 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { accountId } = await params;
    const account = await moveLifecycleAccountStage(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      accountId,
      lifecycleStageUpdateSchema.parse(await request.json()),
    );

    if (!account) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    return errorResponse(error);
  }
}
