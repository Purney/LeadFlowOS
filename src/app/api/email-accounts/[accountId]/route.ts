import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateEmailAccount } from "@/services/sending-service";
import { emailAccountUpdateSchema } from "@/validation/sending";

type Params = {
  params: Promise<{
    accountId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const { accountId } = await params;
    const account = await updateEmailAccount(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      accountId,
      emailAccountUpdateSchema.parse(await request.json()),
    );

    if (!account) {
      return NextResponse.json(
        { error: "Email account not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid email account data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Email account request failed." },
      { status: 500 },
    );
  }
}
