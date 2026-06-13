import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createDeliverable } from "@/services/execution-service";
import { deliverableInputSchema } from "@/validation/execution";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const deliverable = await createDeliverable(
      { organisationId: session.user.organisationId, userId: session.user.id },
      deliverableInputSchema.parse(await request.json()),
    );
    if (!deliverable) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid deliverable data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Deliverable request failed." }, { status: 500 });
  }
}
