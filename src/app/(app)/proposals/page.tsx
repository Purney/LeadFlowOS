import { redirect } from "next/navigation";
import { FileText, Send, ThumbsUp } from "lucide-react";
import { auth } from "@/auth";
import { AiProposalForm } from "@/components/proposals/ai-proposal-form";
import { CreateProposalForm } from "@/components/proposals/create-proposal-form";
import { ProposalActions } from "@/components/proposals/proposal-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listDiscoveryResponses } from "@/services/discovery-service";
import { getProposalMetrics, listProposals } from "@/services/proposal-service";
import type { ProposalContent, ProposalStatus } from "@/types/proposal";

type ProposalView = {
  _id: { toString(): string };
  title: string;
  status: ProposalStatus;
  currentVersion: number;
  content: ProposalContent;
  versions: unknown[];
  updatedAt: Date;
};

export default async function ProposalsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [proposals, responses, metrics] = await Promise.all([
    listProposals(session.user.organisationId),
    listDiscoveryResponses(session.user.organisationId),
    getProposalMetrics(session.user.organisationId),
  ]);
  const proposalViews = proposals as ProposalView[];
  const responseOptions = responses.map((response) => ({
    id: response._id.toString(),
    label:
      response.respondentName ??
      response.respondentEmail ??
      new Date(response.submittedAt).toLocaleString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Proposals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Draft, edit, version, and track proposal status. PDF export and
          signatures are prepared for later phases.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Send className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.byStatus.sent ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Accepted</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <ThumbsUp className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.byStatus.accepted ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create proposal</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateProposalForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI draft from discovery</CardTitle>
          </CardHeader>
          <CardContent>
            <AiProposalForm responses={responseOptions} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Proposal pipeline</h2>
        {proposalViews.length > 0 ? (
          proposalViews.map((proposal) => (
            <Card key={proposal._id.toString()}>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{proposal.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Version {proposal.currentVersion} · {proposal.status} ·{" "}
                    {new Date(proposal.updatedAt).toLocaleString()}
                  </p>
                </div>
                <ProposalActions
                  proposalId={proposal._id.toString()}
                  status={proposal.status}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Executive summary
                    </p>
                    <p className="mt-2 text-sm">{proposal.content.executiveSummary}</p>
                  </div>
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Proposed solution
                    </p>
                    <p className="mt-2 text-sm">{proposal.content.proposedSolution}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Deliverables
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {proposal.content.deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Assumptions
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {proposal.content.assumptions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Timeline
                    </p>
                    <p className="mt-2 text-sm">{proposal.content.estimatedTimeline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No proposals yet.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
