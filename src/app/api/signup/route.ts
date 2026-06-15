import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SignupClosedError, createFirstOwner } from "@/services/auth-service";
import { signupSchema } from "@/validation/auth";

const envKeys = new Set([
  "MONGODB_URI",
  "AUTH_SECRET",
  "AUTH_URL",
  "CRON_SECRET",
  "MAILGUN_API_BASE_URL",
]);

function isDuplicateKeyError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

function isMongoError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return (
    error.name.startsWith("Mongo") ||
    /mongodb|mongo|querysrv|econnrefused|authentication failed|bad auth/i.test(
      error.message,
    )
  );
}

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
      const key = String(error.issues[0]?.path[0] ?? "");

      if (envKeys.has(key)) {
        return NextResponse.json(
          { error: `${key} is not configured correctly.` },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid signup details." },
        { status: 400 },
      );
    }

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { error: "An owner or organisation with these details already exists." },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message.includes("MONGODB_URI")) {
      return NextResponse.json(
        { error: "MongoDB is not configured. Add MONGODB_URI to your environment." },
        { status: 500 },
      );
    }

    if (isMongoError(error)) {
      return NextResponse.json(
        { error: "MongoDB could not be reached. Check MONGODB_URI and network access." },
        { status: 500 },
      );
    }

    console.error("Initial owner signup failed.", error);
    return NextResponse.json(
      { error: "Unable to create the initial owner. Check server logs for details." },
      { status: 500 },
    );
  }
}
