import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { enrollLeadsInCampaign } from "@/services/campaign-service";
import { campaignEnrollSchema } from "@/validation/campaign";

type Params = {
  params: Promise<{
    campaignId: string;
  }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const { campaignId } = await params;
    const result = await enrollLeadsInCampaign(
      {
        organisationId: session.user.organisationId,
        userId: session.user.id,
      },
      campaignId,
      campaignEnrollSchema.parse(await request.json()),
    );

    if (!result) {
      return NextResponse.json(
        { error: "Campaign not found or has no stages." },
        { status: 404 },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid enrollment data." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Enrollment request failed." },
      { status: 500 },
    );
  }
}
