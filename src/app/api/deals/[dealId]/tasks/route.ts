import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createSalesTask } from "@/services/sales-service";
import { salesTaskInputSchema } from "@/validation/sales";

type Params = { params: Promise<{ dealId: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const { dealId } = await params;
    const body = await request.json();
    const task = await createSalesTask(
      { organisationId: session.user.organisationId, userId: session.user.id },
      salesTaskInputSchema.parse({ ...body, dealId }),
    );
    if (!task) {
      return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    }
    return NextResponse.json({ task }, { status: 201 });
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
