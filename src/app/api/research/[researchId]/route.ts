import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateClientResearch } from "@/services/research-service";
import { clientResearchUpdateSchema } from "@/validation/research";

type Params = { params: Promise<{ researchId: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { researchId } = await params;
    const research = await updateClientResearch(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      researchId,
      clientResearchUpdateSchema.parse(await request.json()),
    );

    if (!research) {
      return NextResponse.json({ error: "Research not found." }, { status: 404 });
    }

    return NextResponse.json({ research });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid research data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Research request failed." }, { status: 500 });
  }
}
