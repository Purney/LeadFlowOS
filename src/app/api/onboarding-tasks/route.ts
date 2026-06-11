import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createOnboardingTask,
  listOnboardingTasks,
} from "@/services/portal-service";
import { onboardingTaskInputSchema } from "@/validation/portal";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const tasks = await listOnboardingTasks(session.user.organisationId);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const task = await createOnboardingTask(
      { organisationId: session.user.organisationId, userId: session.user.id },
      onboardingTaskInputSchema.parse(await request.json()),
    );

    if (!task) {
      return NextResponse.json(
        { error: "Client or project not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid onboarding task data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Onboarding task request failed." }, { status: 500 });
  }
}
