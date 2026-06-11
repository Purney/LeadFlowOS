import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { updateCampaign } from "@/services/campaign-service";
import { campaignUpdateSchema } from "@/validation/campaign";

type Params = {
  params: Promise<{
    campaignId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { campaignId } = await params;
    const campaign = await updateCampaign(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      campaignId,
      campaignUpdateSchema.parse(await request.json()),
    );

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid campaign data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Campaign request failed." },
      { status: 500 },
    );
  }
}
