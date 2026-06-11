import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createPortalMessage,
  listPortalMessages,
} from "@/services/portal-service";
import { portalMessageInputSchema } from "@/validation/portal";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const messages = await listPortalMessages(session.user.organisationId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const message = await createPortalMessage(
      { organisationId: session.user.organisationId, userId: session.user.id },
      portalMessageInputSchema.parse(await request.json()),
    );

    if (!message) {
      return NextResponse.json(
        { error: "Client or project not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid portal message data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Portal message failed." }, { status: 500 });
  }
}
