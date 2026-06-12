import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createClientResearch,
  listClientResearch,
} from "@/services/research-service";
import { clientResearchInputSchema } from "@/validation/research";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid research data." },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: "Research request failed." }, { status: 500 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const research = await listClientResearch(session.user.organisationId);

  return NextResponse.json({ research });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const research = await createClientResearch(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      clientResearchInputSchema.parse(await request.json()),
    );

    return NextResponse.json({ research }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
