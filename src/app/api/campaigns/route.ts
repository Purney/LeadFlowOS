import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createCampaign, listCampaigns } from "@/services/campaign-service";
import { campaignInputSchema } from "@/validation/campaign";

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Invalid campaign data." },
      { status: 400 },
    );
  }

  return NextResponse.json({ error: "Campaign request failed." }, { status: 500 });
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  const campaigns = await listCampaigns(session.user.organisationId);
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const campaign = await createCampaign(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      campaignInputSchema.parse(await request.json()),
    );

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
