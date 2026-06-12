import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  createLifecycleAccount,
  listLifecycleAccounts,
} from "@/services/lifecycle-service";
import {
  lifecycleAccountInputSchema,
  lifecycleQuerySchema,
} from "@/validation/lifecycle";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid account data." },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: "Account request failed." }, { status: 500 });
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  const url = new URL(request.url);
  const filters = lifecycleQuerySchema.parse({
    stage: url.searchParams.get("stage") ?? "all",
    status: url.searchParams.get("status") ?? "all",
    search: url.searchParams.get("search") ?? undefined,
  });
  const accounts = await listLifecycleAccounts(
    session.user.organisationId,
    filters,
  );

  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) return unauthorized();

  try {
    const account = await createLifecycleAccount(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      lifecycleAccountInputSchema.parse(await request.json()),
    );

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
