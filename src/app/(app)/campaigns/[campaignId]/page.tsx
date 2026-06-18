import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Split } from "lucide-react";
import { auth } from "@/auth";
import { CampaignActions } from "@/components/campaigns/campaign-actions";
import { LeadIdBridge } from "@/components/campaigns/lead-id-bridge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaignById } from "@/services/campaign-service";
import { listLeads } from "@/services/lead-service";
import type { CampaignStatus } from "@/types/campaign";
import { applyPersonalisation } from "@/utils/personalisation";
import { renderSpintax } from "@/utils/spintax";

type CampaignPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

type CampaignStepView = {
  name: string;
  order: number;
  delayDays: number;
  subjectVariants: string[];
  bodyVariants: string[];
};

type CampaignView = {
  _id: { toString(): string };
  name: string;
  goal?: string;
  serviceOffer?: string;
  status: CampaignStatus;
  steps: CampaignStepView[];
};

const sampleLead = {
  firstName: "Ada",
  lastName: "Lovelace",
  company: "Analytical Engines Ltd",
  website: "https://example.com",
  specificDataPoint: "your team is scaling delivery across several live projects",
  normalisedCompany: "Analytical Engines Ltd",
  magnetName: "automation opportunity map",
  personalisedWorkflowValue:
    "reduce repetitive drawing updates and document admin",
  senderEmailSignature: "Best,\nAlex",
};

const primaryLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#0f372f]";
const secondaryLinkClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted";

export default async function CampaignPage({ params }: CampaignPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { campaignId } = await params;
  const [campaignResult, leads] = await Promise.all([
    getCampaignById(session.user.organisationId, campaignId),
    listLeads({ organisationId: session.user.organisationId }),
  ]);

  if (!campaignResult) {
    notFound();
  }

  const campaign = campaignResult as CampaignView;
  const leadIds = leads.map((lead) => lead._id.toString());
  const previewLead = leads[0] ?? sampleLead;
  const totalSubjectVariants = campaign.steps.reduce(
    (total, step) => total + step.subjectVariants.length,
    0,
  );
  const totalBodyVariants = campaign.steps.reduce(
    (total, step) => total + step.bodyVariants.length,
    0,
  );

  return (
    <div className="space-y-6">
      <LeadIdBridge leadIds={leadIds} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            href="/campaigns"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Campaigns
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {campaign.goal ?? "No goal set"} |{" "}
            {campaign.serviceOffer ?? "No service offer set"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {campaign.status === "draft" ? (
            <Link className={primaryLinkClass} href={`/campaigns/${campaignId}/edit`}>
              <Pencil aria-hidden className="h-4 w-4" />
              Edit campaign
            </Link>
          ) : null}
          <Link className={secondaryLinkClass} href="/campaigns/create">
            Create another
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{campaign.status}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{campaign.steps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalSubjectVariants}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Bodies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalBodyVariants}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Campaign controls</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignActions campaignId={campaignId} status={campaign.status} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        {campaign.steps.map((step, index) => (
          <Card key={`${campaignId}-${step.order}`}>
            <CardHeader>
              <CardTitle>
                Stage {index + 1}: {step.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Delay
                  </p>
                  <p className="mt-1 text-xl font-semibold">{step.delayDays} days</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Subject variants
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {step.subjectVariants.length}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <Split aria-hidden className="h-3.5 w-3.5" />
                    Body variants
                  </div>
                  <p className="mt-1 text-xl font-semibold">
                    {step.bodyVariants.length}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">Subject variants</h2>
                  {step.subjectVariants.map((subject, variantIndex) => (
                    <div
                      className="rounded-md border border-border p-3"
                      key={`${step.order}-subject-${variantIndex}`}
                    >
                      <p className="text-xs uppercase text-muted-foreground">
                        Subject {String.fromCharCode(65 + variantIndex)}
                      </p>
                      <p className="mt-2 break-words text-sm font-medium">
                        {subject}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold">Body variants</h2>
                  {step.bodyVariants.map((body, variantIndex) => (
                    <div
                      className="rounded-md border border-border p-3"
                      key={`${step.order}-body-${variantIndex}`}
                    >
                      <p className="text-xs uppercase text-muted-foreground">
                        Body {String.fromCharCode(65 + variantIndex)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-visible rounded-md bg-muted p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Test email preview
                </p>
                <p className="mt-2 break-words font-medium">
                  {applyPersonalisation(
                    renderSpintax(
                      step.subjectVariants[0] ?? "",
                      `${campaignId}:${step.order}:subject`,
                    ),
                    previewLead,
                  )}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                  {applyPersonalisation(
                    renderSpintax(
                      step.bodyVariants[0] ?? "",
                      `${campaignId}:${step.order}:body`,
                    ),
                    previewLead,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
