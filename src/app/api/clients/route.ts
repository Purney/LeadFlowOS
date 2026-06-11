import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  convertLeadToClient,
  createClient,
  listClients,
} from "@/services/client-service";
import { clientInputSchema, convertLeadSchema } from "@/validation/client";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return unauthorized();
  return NextResponse.json({
    clients: await listClients(session.user.organisationId),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const body = await request.json();
    const context = {
      organisationId: session.user.organisationId,
      userId: session.user.id,
    };
    const client =
      body.mode === "convert_lead"
        ? await convertLeadToClient(context, convertLeadSchema.parse(body))
        : await createClient(context, clientInputSchema.parse(body));

    if (!client) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid client data." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Client request failed." }, { status: 500 });
  }
}
