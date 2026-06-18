import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  getOrganisationSettings,
  updateOrganisationSettings,
} from "@/services/organisation-service";
import { organisationSettingsSchema } from "@/validation/organisation";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const settings = await getOrganisationSettings(session.user.organisationId);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const settings = await updateOrganisationSettings(
      session.user.organisationId,
      organisationSettingsSchema.parse(await request.json()),
    );

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid organisation settings." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Organisation settings update failed." },
      { status: 500 },
    );
  }
}
