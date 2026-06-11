import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createSuppression,
  listSuppressions,
} from "@/services/suppression-service";
import { suppressionInputSchema } from "@/validation/suppression";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const suppressions = await listSuppressions(session.user.organisationId);
  return NextResponse.json({ suppressions });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const suppression = await createSuppression(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      suppressionInputSchema.parse(await request.json()),
    );

    return NextResponse.json({ suppression }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid suppression data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Suppression request failed." },
      { status: 500 },
    );
  }
}
