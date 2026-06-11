import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createPublicPortalMessage } from "@/services/portal-service";
import { publicPortalMessageSchema } from "@/validation/portal";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
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
