import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createSignatureRequest,
  listSignatureRequests,
} from "@/services/portal-service";
import { signatureRequestInputSchema } from "@/validation/portal";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const signatures = await listSignatureRequests(session.user.organisationId);
  return NextResponse.json({ signatures });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const signature = await createSignatureRequest(
      { organisationId: session.user.organisationId, userId: session.user.id },
      signatureRequestInputSchema.parse(await request.json()),
    );

    if (!signature) {
      return NextResponse.json(
        { error: "Client or proposal not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ signature }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid signature request data." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error &&
      (error.message.includes("SIGNATURE_PROVIDER_API_KEY") ||
        error.message.includes("Signature provider"))
        ? error.message
        : "Signature request failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
