import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SignupClosedError, createFirstOwner } from "@/services/auth-service";
import { signupSchema } from "@/validation/auth";

export async function POST(request: Request) {
  try {
    const input = signupSchema.parse(await request.json());
    await createFirstOwner(input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SignupClosedError) {
      return NextResponse.json(
        { error: "An owner already exists. Sign in instead." },
        { status: 409 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid signup details." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error && error.message.includes("MONGODB_URI")
        ? "MongoDB is not configured. Add MONGODB_URI to your environment."
        : "Unable to create the initial owner.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
