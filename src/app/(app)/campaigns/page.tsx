import { redirect } from "next/navigation";
import { Layers, MailCheck, Split, Users } from "lucide-react";
import { auth } from "@/auth";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form";
import { LeadIdBridge } from "@/components/campaigns/lead-id-bridge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCampaigns } from "@/services/campaign-service";
import { listLeads } from "@/services/lead-service";
import type { CampaignStatus } from "@/types/campaign";
import { applyPersonalisation } from "@/utils/personalisation";

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
  const previewLead = leads[0] ?? {
    firstName: "Ada",
    lastName: "Lovelace",
    company: "Analytical Engines Ltd",
    website: "https://example.com",
  };

  return (
    <div className="space-y-6">
      <LeadIdBridge leadIds={leadIds} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build multi-stage cold email sequences with personalisation,
          scheduling delays, and A/B variants. Manual approval and sending start
          in Phase 4.
        </p>
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
            <p className="text-2xl font-semibold">
              {viewCampaigns.filter((campaign) => campaign.status === "active").length}
            </p>
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
            <p className="text-2xl font-semibold">
              {
                viewCampaigns.filter((campaign) =>
                  campaign.steps.some(
                    (step) =>
                      step.subjectVariants.length > 1 || step.bodyVariants.length > 1,
                  ),
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Create campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCampaignForm />
        </CardContent>
      </Card>

      <section className="space-y-4">
        {viewCampaigns.length > 0 ? (
          viewCampaigns.map((campaign) => {
            const firstStep = campaign.steps[0];
            return (
              <Card key={campaign._id.toString()}>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {campaign.goal ?? "No goal set"} ·{" "}
                      {campaign.serviceOffer ?? "No service offer set"}
                    </p>
                  </div>
                  <CampaignActions
                    campaignId={campaign._id.toString()}
                    status={campaign.status}
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Stages
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {campaign.steps.length}
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Enrolled
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {campaign.enrollmentCount}
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Status
                      </p>
                      <p className="mt-1 text-xl font-semibold">{campaign.status}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-muted text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Stage</th>
                          <th className="px-4 py-3 font-medium">Delay</th>
                          <th className="px-4 py-3 font-medium">Subject variants</th>
                          <th className="px-4 py-3 font-medium">Body variants</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {campaign.steps.map((step) => (
                          <tr key={`${campaign._id.toString()}-${step.order}`}>
                            <td className="px-4 py-3">{step.name}</td>
                            <td className="px-4 py-3">{step.delayDays} days</td>
                            <td className="px-4 py-3">
                              {step.subjectVariants.length}
                            </td>
                            <td className="px-4 py-3">{step.bodyVariants.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {firstStep ? (
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Personalisation preview
                      </p>
                      <p className="mt-2 font-medium">
                        {applyPersonalisation(
                          firstStep.subjectVariants[0],
                          previewLead,
                        )}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {applyPersonalisation(firstStep.bodyVariants[0], previewLead)}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No campaigns yet. Create a draft sequence to start Phase 3.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
