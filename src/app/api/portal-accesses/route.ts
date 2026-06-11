import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createPortalAccess,
  listPortalAccesses,
} from "@/services/portal-service";
import { portalAccessInputSchema } from "@/validation/portal";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const accesses = await listPortalAccesses(session.user.organisationId);
  return NextResponse.json({ accesses });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const result = await createPortalAccess(
      { organisationId: session.user.organisationId, userId: session.user.id },
      portalAccessInputSchema.parse(await request.json()),
    );

    if (!result) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid portal access data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Portal access request failed." }, { status: 500 });
  }
}
