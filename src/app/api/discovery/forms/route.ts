import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createDiscoveryForm,
  listDiscoveryForms,
} from "@/services/discovery-service";
import { discoveryFormInputSchema } from "@/validation/discovery";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const forms = await listDiscoveryForms(session.user.organisationId);
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const form = await createDiscoveryForm(
      { organisationId: session.user.organisationId, userId: session.user.id },
      discoveryFormInputSchema.parse(await request.json()),
    );

    return NextResponse.json({ form }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid discovery form." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Discovery form request failed." },
      { status: 500 },
    );
  }
}
