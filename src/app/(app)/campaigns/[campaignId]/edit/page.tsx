import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaignById } from "@/services/campaign-service";

type EditCampaignPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

type CampaignStepView = {
  name: string;
  delayDays: number;
  subjectVariants: string[];
  bodyVariants: string[];
};

const secondaryLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted";

export default async function EditCampaignPage({ params }: EditCampaignPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { campaignId } = await params;
  const campaign = await getCampaignById(session.user.organisationId, campaignId);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit campaign</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Update draft copy, stages, delays, and A/B variants.
          </p>
        </div>
        <Link className={secondaryLinkClass} href={`/campaigns/${campaignId}`}>
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Back to campaign
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{campaign.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCampaignForm
            initialCampaign={{
              id: campaign._id.toString(),
              name: campaign.name,
              goal: campaign.goal,
              serviceOffer: campaign.serviceOffer,
              steps: (campaign.steps as CampaignStepView[]).map((step) => ({
                name: step.name,
                delayDays: step.delayDays,
                subjectVariants: step.subjectVariants,
                bodyVariants: step.bodyVariants,
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
