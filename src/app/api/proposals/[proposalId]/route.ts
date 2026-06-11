import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateProposal } from "@/services/proposal-service";
import { proposalUpdateSchema } from "@/validation/proposal";

type Params = {
  params: Promise<{ proposalId: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { proposalId } = await params;
    const proposal = await updateProposal(
      { organisationId: session.user.organisationId, userId: session.user.id },
      proposalId,
      proposalUpdateSchema.parse(await request.json()),
    );

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid proposal data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Proposal request failed." }, { status: 500 });
  }
}
