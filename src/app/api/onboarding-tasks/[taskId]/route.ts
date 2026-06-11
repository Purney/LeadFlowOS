import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateOnboardingTask } from "@/services/portal-service";
import { onboardingTaskUpdateSchema } from "@/validation/portal";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { taskId } = await context.params;
    const task = await updateOnboardingTask(
      { organisationId: session.user.organisationId, userId: session.user.id },
      taskId,
      onboardingTaskUpdateSchema.parse(await request.json()),
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid task update." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Task update failed." }, { status: 500 });
  }
}
