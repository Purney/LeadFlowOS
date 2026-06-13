import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateOnboardingHandoff } from "@/services/handoff-service";
import { onboardingHandoffUpdateSchema } from "@/validation/handoff";

type Params = { params: Promise<{ handoffId: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const { handoffId } = await params;
    const handoff = await updateOnboardingHandoff(
      { organisationId: session.user.organisationId, userId: session.user.id },
      handoffId,
      onboardingHandoffUpdateSchema.parse(await request.json()),
    );
    if (!handoff) {
      return NextResponse.json({ error: "Handoff not found." }, { status: 404 });
    }
    return NextResponse.json({ handoff });
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
