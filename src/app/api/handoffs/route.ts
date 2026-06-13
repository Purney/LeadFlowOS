import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createOnboardingHandoff,
  listOnboardingHandoffs,
} from "@/services/handoff-service";
import { onboardingHandoffInputSchema } from "@/validation/handoff";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const handoffs = await listOnboardingHandoffs(session.user.organisationId);
  return NextResponse.json({ handoffs });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const result = await createOnboardingHandoff(
      { organisationId: session.user.organisationId, userId: session.user.id },
      onboardingHandoffInputSchema.parse(await request.json()),
    );
    if (!result) {
      return NextResponse.json(
        { error: "Won deal not found or handoff could not be created." },
        { status: 404 },
      );
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid handoff data." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Handoff request failed." }, { status: 500 });
  }
}
