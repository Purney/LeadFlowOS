import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { submitDiscoveryResponse } from "@/services/discovery-service";
import { discoveryResponseInputSchema } from "@/validation/discovery";

type Params = {
  params: Promise<{ publicSlug: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const { publicSlug } = await params;
  const rateLimit = checkRateLimit(
    rateLimitKey(request, `public-discovery:${publicSlug}`),
    { limit: 20, windowMs: 60_000 },
  );

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const result = await submitDiscoveryResponse(
      publicSlug,
      discoveryResponseInputSchema.parse(await request.json()),
    );

    if (!result) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    if ("errors" in result) {
      return NextResponse.json({ errors: result.errors }, { status: 400 });
    }

    return NextResponse.json({ response: result.response }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid response." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Discovery response request failed." },
      { status: 500 },
    );
  }
}
