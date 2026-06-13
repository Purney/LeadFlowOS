import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateSalesTask } from "@/services/sales-service";
import { salesTaskUpdateSchema } from "@/validation/sales";

type Params = { params: Promise<{ taskId: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const { taskId } = await params;
    const task = await updateSalesTask(
      { organisationId: session.user.organisationId, userId: session.user.id },
      taskId,
      salesTaskUpdateSchema.parse(await request.json()),
    );
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid task data." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Task request failed." }, { status: 500 });
  }
}
