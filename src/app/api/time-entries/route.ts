import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createTimeEntry, listTimeEntries } from "@/services/client-service";
import { timeEntryInputSchema } from "@/validation/client";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  return NextResponse.json({
    timeEntries: await listTimeEntries(session.user.organisationId),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const entry = await createTimeEntry(
      { organisationId: session.user.organisationId, userId: session.user.id },
      timeEntryInputSchema.parse(await request.json()),
    );

    if (!entry) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid time entry data." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Time entry request failed." }, { status: 500 });
  }
}
