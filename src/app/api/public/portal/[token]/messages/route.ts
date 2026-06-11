import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkPersistentRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { createPublicPortalMessage } from "@/services/portal-service";
import { publicPortalMessageSchema } from "@/validation/portal";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const rateLimit = await checkPersistentRateLimit(rateLimitKey(request, `portal-message:${token}`), {
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const message = await createPublicPortalMessage(
      token,
      publicPortalMessageSchema.parse(await request.json()),
    );

    if (!message) {
      return NextResponse.json({ error: "Portal not found." }, { status: 404 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid message data." },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Portal message failed." }, { status: 500 });
  }
}
