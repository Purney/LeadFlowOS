import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createSupportTicket } from "@/services/maintenance-service";
import { supportTicketInputSchema } from "@/validation/maintenance";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();
  try {
    const ticket = await createSupportTicket(
      { organisationId: session.user.organisationId, userId: session.user.id },
      supportTicketInputSchema.parse(await request.json()),
    );
    if (!ticket) return NextResponse.json({ error: "Client or project not found." }, { status: 404 });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid ticket data." }, { status: 400 });
    }
    return NextResponse.json({ error: "Support ticket request failed." }, { status: 500 });
  }
}
