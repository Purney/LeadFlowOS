import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateDeal } from "@/services/sales-service";
import { dealUpdateSchema } from "@/validation/sales";

type Params = { params: Promise<{ dealId: string }> };

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const { dealId } = await params;
    const deal = await updateDeal(
      { organisationId: session.user.organisationId, userId: session.user.id },
      dealId,
      dealUpdateSchema.parse(await request.json()),
    );
    if (!deal) {
      return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    }
    return NextResponse.json({ deal });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid deal data." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Deal request failed." }, { status: 500 });
  }
}
