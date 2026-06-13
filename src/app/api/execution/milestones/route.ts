import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createExecutionMilestone } from "@/services/execution-service";
import { milestoneInputSchema } from "@/validation/execution";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const milestone = await createExecutionMilestone(
      { organisationId: session.user.organisationId, userId: session.user.id },
      milestoneInputSchema.parse(await request.json()),
    );
    if (!milestone) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid milestone data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Milestone request failed." }, { status: 500 });
  }
}
