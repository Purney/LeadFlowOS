import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkPersistentRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { signPortalSignature } from "@/services/portal-service";
import { publicSignatureSchema } from "@/validation/portal";

type RouteContext = {
  params: Promise<{ token: string; requestId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token, requestId } = await context.params;
    const rateLimit = await checkPersistentRateLimit(rateLimitKey(request, `portal-sign:${token}`), {
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const signature = await signPortalSignature(
      token,
      requestId,
      publicSignatureSchema.parse(await request.json()),
    );

    if (!signature) {
      return NextResponse.json(
        { error: "Signature request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ signature });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid signature data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Signature failed." }, { status: 500 });
  }
}
