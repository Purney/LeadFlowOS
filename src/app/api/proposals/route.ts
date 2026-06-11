import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createProposal,
  generateProposalFromDiscovery,
  listProposals,
} from "@/services/proposal-service";
import { proposalAiDraftSchema, proposalInputSchema } from "@/validation/proposal";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const proposals = await listProposals(session.user.organisationId);
  return NextResponse.json({ proposals });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const body = await request.json();

    if (body.mode === "ai_from_discovery") {
      const proposal = await generateProposalFromDiscovery(
        { organisationId: session.user.organisationId, userId: session.user.id },
        proposalAiDraftSchema.parse(body),
      );

      if (!proposal) {
        return NextResponse.json(
          { error: "Discovery response not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({ proposal }, { status: 201 });
    }

    const proposal = await createProposal(
      { organisationId: session.user.organisationId, userId: session.user.id },
      proposalInputSchema.parse(body),
    );

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid proposal data." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error && error.message.includes("OPENAI_API_KEY")
        ? "OpenAI is not configured. Add OPENAI_API_KEY to your environment."
        : "Proposal request failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
