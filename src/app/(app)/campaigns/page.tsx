import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Layers, MailCheck, Pencil, Plus, Split, Users } from "lucide-react";
import { auth } from "@/auth";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { LeadIdBridge } from "@/components/campaigns/lead-id-bridge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCampaigns } from "@/services/campaign-service";
import { listLeads } from "@/services/lead-service";
import type { CampaignStatus } from "@/types/campaign";

type CampaignView = {
  _id: { toString(): string };
  name: string;
  goal?: string;
  serviceOffer?: string;
  status: CampaignStatus;
  enrollmentCount: number;
  steps: {
    name: string;
    order: number;
    delayDays: number;
    subjectVariants: string[];
    bodyVariants: string[];
  }[];
};

const primaryLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#0f372f]";
const secondaryLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted";

export default async function CampaignsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [campaigns, leads] = await Promise.all([
    listCampaigns(session.user.organisationId),
    listLeads({ organisationId: session.user.organisationId }),
  ]);
  const viewCampaigns = campaigns as CampaignView[];
  const leadIds = leads.map((lead) => lead._id.toString());
  const activeCampaigns = viewCampaigns.filter(
    (campaign) => campaign.status === "active",
  );
  const abReadyCampaigns = viewCampaigns.filter((campaign) =>
    campaign.steps.some(
      (step) => step.subjectVariants.length > 1 || step.bodyVariants.length > 1,
    ),
  );

  return (
    <div className="space-y-6">
      <LeadIdBridge leadIds={leadIds} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Monitor campaign readiness, manage statuses, enroll visible leads,
            and open individual campaign pages for stage details and draft edits.
          </p>
        </div>
        <Link className={primaryLinkClass} href="/campaigns/create">
          <Plus aria-hidden className="h-4 w-4" />
          Create campaign
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{viewCampaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <MailCheck className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{activeCampaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Lead pool</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{leadIds.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">A/B ready</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Split className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{abReadyCampaigns.length}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Campaign list</CardTitle>
        </CardHeader>
        <CardContent>
          {viewCampaigns.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Stages</th>
                    <th className="px-4 py-3 font-medium">A/B variants</th>
                    <th className="px-4 py-3 font-medium">Enrolled</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {viewCampaigns.map((campaign) => {
                    const campaignId = campaign._id.toString();
                    const subjectVariants = campaign.steps.reduce(
                      (total, step) => total + step.subjectVariants.length,
                      0,
                    );
                    const bodyVariants = campaign.steps.reduce(
                      (total, step) => total + step.bodyVariants.length,
                      0,
                    );

                    return (
                      <tr key={campaignId}>
                        <td className="px-4 py-4 align-top">
                          <Link
                            className="font-medium text-foreground hover:text-primary"
                            href={`/campaigns/${campaignId}`}
                          >
                            {campaign.name}
                          </Link>
                          <p className="mt-1 max-w-md text-xs text-muted-foreground">
                            {campaign.goal ?? "No goal set"} |{" "}
                            {campaign.serviceOffer ?? "No service offer set"}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">{campaign.status}</td>
                        <td className="px-4 py-4 align-top">
                          {campaign.steps.length}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {subjectVariants} subjects / {bodyVariants} bodies
                        </td>
                        <td className="px-4 py-4 align-top">
                          {campaign.enrollmentCount}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                className={secondaryLinkClass}
                                href={`/campaigns/${campaignId}`}
                              >
                                <Eye aria-hidden className="h-4 w-4" />
                                View
                              </Link>
                              {campaign.status === "draft" ? (
                                <Link
                                  className={secondaryLinkClass}
                                  href={`/campaigns/${campaignId}/edit`}
                                >
                                  <Pencil aria-hidden className="h-4 w-4" />
                                  Edit
                                </Link>
                              ) : null}
                            </div>
                            <CampaignActions
                              campaignId={campaignId}
                              status={campaign.status}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No campaigns yet. Create a draft sequence to start outreach.
              </p>
              <Link className={`${primaryLinkClass} mt-4`} href="/campaigns/create">
                <Plus aria-hidden className="h-4 w-4" />
                Create campaign
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
