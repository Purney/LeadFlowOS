import { Brain, CheckCircle2, Search, Target } from "lucide-react";
import { auth } from "@/auth";
import { CreateResearchForm } from "@/components/research/create-research-form";
import {
  ResearchChecklistToggle,
  ResearchSummaryButton,
} from "@/components/research/research-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getResearchMetrics,
  listClientResearch,
} from "@/services/research-service";

function scoreTone(score: number) {
  if (score >= 75) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (score >= 50) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

export default async function ResearchPage() {
  const session = await auth();
  const [researchItems, metrics] = await Promise.all([
    listClientResearch(session!.user.organisationId),
    getResearchMetrics(session!.user.organisationId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Phase 15</p>
        <h1 className="text-3xl font-semibold tracking-tight">Client Research</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Qualify target accounts with ICP scoring, research
          checklists, pain hypotheses, opportunity angles, and AI summaries.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Research records</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Search aria-hidden className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">High fit</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Target aria-hidden className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.highFit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Qualified</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <CheckCircle2 aria-hidden className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.byStatus.qualified ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Checklist open</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Brain aria-hidden className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.incompleteChecklist}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add target account</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateResearchForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {researchItems.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
                <Search aria-hidden className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No client research yet</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Add target accounts here before moving them into the sales workflow.
                </p>
              </CardContent>
            </Card>
          ) : (
            researchItems.map((item) => {
              const completed = item.checklist.filter(
                (checklistItem) => checklistItem.completed,
              ).length;

              return (
                <Card key={item.id}>
                  <CardHeader className="gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{item.companyName}</CardTitle>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs ${scoreTone(item.fitScore)}`}
                        >
                          {item.fitScore}/100
                        </span>
                        <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs capitalize">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[item.industry, item.companySize, item.region]
                          .filter(Boolean)
                          .join(" · ") || "No firmographic notes"}
                      </p>
                    </div>
                    <ResearchSummaryButton researchId={item.id} />
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Pain hypotheses
                        </p>
                        <ul className="mt-2 space-y-1 text-sm">
                          {(item.painHypotheses.length > 0
                            ? item.painHypotheses
                            : ["No hypotheses yet"]
                          ).map((hypothesis) => (
                            <li key={hypothesis}>{hypothesis}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase text-muted-foreground">
                          Opportunity angle
                        </p>
                        <p className="mt-2 text-sm">
                          {item.opportunityAngle || "No opportunity angle yet"}
                        </p>
                      </div>
                    </div>

                    {item.aiSummary ? (
                      <div className="rounded-md border border-border bg-muted/50 p-4">
                        <p className="text-sm font-medium">AI research summary</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.aiSummary.fitSummary}
                        </p>
                      </div>
                    ) : null}

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium">Research checklist</p>
                        <p className="text-xs text-muted-foreground">
                          {completed}/{item.checklist.length}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {item.checklist.map((checklistItem) => (
                          <div
                            className="flex items-center justify-between gap-3 rounded-md border border-border p-2"
                            key={checklistItem.itemId}
                          >
                            <span
                              className={
                                checklistItem.completed
                                  ? "text-sm text-muted-foreground line-through"
                                  : "text-sm"
                              }
                            >
                              {checklistItem.label}
                            </span>
                            <ResearchChecklistToggle
                              completed={checklistItem.completed}
                              itemId={checklistItem.itemId}
                              researchId={item.id}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
