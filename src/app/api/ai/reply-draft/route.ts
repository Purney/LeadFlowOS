import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { generateReplyDraft } from "@/services/ai-service";
import { replyDraftGenerationSchema } from "@/validation/ai";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const draft = await generateReplyDraft(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      replyDraftGenerationSchema.parse(await request.json()),
    );

    if (!draft) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid AI request." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error && error.message.includes("OPENAI_API_KEY")
        ? "OpenAI is not configured. Add OPENAI_API_KEY to your environment."
        : "AI reply drafting failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
