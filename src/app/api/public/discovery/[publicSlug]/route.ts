import { NextResponse } from "next/server";
import { getPublicDiscoveryForm } from "@/services/discovery-service";

type Params = {
  params: Promise<{ publicSlug: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { publicSlug } = await params;
  const form = await getPublicDiscoveryForm(publicSlug);

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  return NextResponse.json({ form });
}
