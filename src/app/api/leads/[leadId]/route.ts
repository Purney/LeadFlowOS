import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { deleteLead, updateLead } from "@/services/lead-service";
import { leadUpdateSchema } from "@/validation/lead";

type Params = {
  params: Promise<{
    leadId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid lead data." },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message.includes("duplicate key")) {
    return NextResponse.json(
      { error: "A lead with that email already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json({ error: "Lead request failed." }, { status: 500 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { leadId } = await params;
    const lead = await updateLead(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      leadId,
      leadUpdateSchema.parse(await request.json()),
    );

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  const { leadId } = await params;
  const deleted = await deleteLead(
    {
      organisationId: session.user.organisationId,
      userId: session.user.id,
    },
    leadId,
  );

  if (!deleted) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
