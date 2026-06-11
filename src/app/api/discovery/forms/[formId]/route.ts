import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateDiscoveryForm } from "@/services/discovery-service";
import { discoveryFormUpdateSchema } from "@/validation/discovery";

type Params = {
  params: Promise<{ formId: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { formId } = await params;
    const form = await updateDiscoveryForm(
      { organisationId: session.user.organisationId, userId: session.user.id },
      formId,
      discoveryFormUpdateSchema.parse(await request.json()),
    );

    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    return NextResponse.json({ form });
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
