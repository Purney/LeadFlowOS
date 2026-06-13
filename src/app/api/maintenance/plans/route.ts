import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createMaintenancePlan } from "@/services/maintenance-service";
import { maintenancePlanInputSchema } from "@/validation/maintenance";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  try {
    const plan = await createMaintenancePlan(
      { organisationId: session.user.organisationId, userId: session.user.id },
      maintenancePlanInputSchema.parse(await request.json()),
    );
    if (!plan) return NextResponse.json({ error: "Client or project not found." }, { status: 404 });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid plan data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Maintenance plan request failed." }, { status: 500 });
  }
}
