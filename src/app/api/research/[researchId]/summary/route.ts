import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { generateResearchSummary } from "@/services/research-service";

type Params = { params: Promise<{ researchId: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { researchId } = await params;
    const result = await generateResearchSummary(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      { researchId },
    );

    if (!result) {
      return NextResponse.json({ error: "Research not found." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid summary request." },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Research summary failed." }, { status: 500 });
  }
}
