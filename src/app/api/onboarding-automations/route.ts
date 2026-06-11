import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { runOnboardingAutomation } from "@/services/portal-service";
import { onboardingAutomationInputSchema } from "@/validation/portal";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const tasks = await runOnboardingAutomation(
      { organisationId: session.user.organisationId, userId: session.user.id },
      onboardingAutomationInputSchema.parse(await request.json()),
    );

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "Client or project not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ tasks }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid automation data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Onboarding automation failed." }, { status: 500 });
  }
}
