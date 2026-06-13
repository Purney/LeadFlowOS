import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createDeal, listDeals } from "@/services/sales-service";
import { dealInputSchema } from "@/validation/sales";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  const deals = await listDeals(session.user.organisationId);
  return NextResponse.json({ deals });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const deal = await createDeal(
      { organisationId: session.user.organisationId, userId: session.user.id },
      dealInputSchema.parse(await request.json()),
    );
    if (!deal) {
      return NextResponse.json({ error: "Linked record not found." }, { status: 404 });
    }
    return NextResponse.json({ deal }, { status: 201 });
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
