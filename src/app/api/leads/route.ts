import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createLead, importLeads, listLeads } from "@/services/lead-service";
import { leadImportSchema, leadInputSchema, leadQuerySchema } from "@/validation/lead";

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

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  const url = new URL(request.url);
  const filters = leadQuerySchema.parse({
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? "all",
    tag: url.searchParams.get("tag") ?? undefined,
  });

  const leads = await listLeads(
    { organisationId: session.user.organisationId },
    filters,
  );

  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();

    if (body.mode === "import") {
      const result = await importLeads(
        {
          organisationId: session.user.organisationId,
          userId: session.user.id,
        },
        leadImportSchema.parse(body),
      );

      return NextResponse.json(result, { status: 201 });
    }

    const lead = await createLead(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      leadInputSchema.parse(body),
    );

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
