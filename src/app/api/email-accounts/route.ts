import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createEmailAccount,
  listEmailAccounts,
} from "@/services/sending-service";
import { emailAccountInputSchema } from "@/validation/sending";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid email account data." },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message.includes("duplicate key")) {
    return NextResponse.json(
      { error: "That sending email already exists." },
      { status: 409 },
    );
  }

  return NextResponse.json(
    { error: "Email account request failed." },
    { status: 500 },
  );
}

export async function GET() {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const accounts = await listEmailAccounts(session.user.organisationId);
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const account = await createEmailAccount(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      emailAccountInputSchema.parse(await request.json()),
    );

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
