import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { generateDiscoverySummary } from "@/services/discovery-service";
import { discoverySummaryInputSchema } from "@/validation/discovery";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const draft = await generateDiscoverySummary(
      { organisationId: session.user.organisationId, userId: session.user.id },
      discoverySummaryInputSchema.parse(await request.json()),
    );

    if (!draft) {
      return NextResponse.json({ error: "Response not found." }, { status: 404 });
    }

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid summary request." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error && error.message.includes("OPENAI_API_KEY")
        ? "OpenAI is not configured. Add OPENAI_API_KEY to your environment."
        : "Discovery summary generation failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
