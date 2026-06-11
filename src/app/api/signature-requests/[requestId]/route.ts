import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateSignatureRequest } from "@/services/portal-service";
import { signatureRequestUpdateSchema } from "@/validation/portal";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { requestId } = await context.params;
    const signature = await updateSignatureRequest(
      { organisationId: session.user.organisationId, userId: session.user.id },
      requestId,
      signatureRequestUpdateSchema.parse(await request.json()),
    );

    if (!signature) {
      return NextResponse.json({ error: "Signature not found." }, { status: 404 });
    }

    return NextResponse.json({ signature });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid signature update." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Signature update failed." }, { status: 500 });
  }
}
