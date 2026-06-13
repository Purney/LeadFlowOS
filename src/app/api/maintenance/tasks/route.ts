import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createMaintenanceTask } from "@/services/maintenance-service";
import { maintenanceTaskInputSchema } from "@/validation/maintenance";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  try {
    const task = await createMaintenanceTask(
      { organisationId: session.user.organisationId, userId: session.user.id },
      maintenanceTaskInputSchema.parse(await request.json()),
    );
    if (!task) return NextResponse.json({ error: "Maintenance plan not found." }, { status: 404 });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid task data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Maintenance task request failed." }, { status: 500 });
  }
}
