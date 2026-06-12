import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Route,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLifecycleCommandCenter } from "@/services/lifecycle-service";
import {
  lifecycleStageDescriptions,
  lifecycleStageLabels,
  lifecycleStages,
  type LifecycleStage,
} from "@/types/lifecycle";
import { auth } from "@/auth";

function formatDate(value?: string) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function stageTone(stage: LifecycleStage) {
  const tones: Record<LifecycleStage, string> = {
    client_research: "border-sky-200 bg-sky-50 text-sky-900",
    cold_outreach: "border-emerald-200 bg-emerald-50 text-emerald-900",
    proposal_sales: "border-violet-200 bg-violet-50 text-violet-900",
    onboarding_payment: "border-amber-200 bg-amber-50 text-amber-900",
    solution_execution: "border-rose-200 bg-rose-50 text-rose-900",
    maintenance: "border-slate-200 bg-slate-50 text-slate-900",
  };

  return tones[stage];
}

export default async function AccountsPage() {
  const session = await auth();
  const { accounts, metrics, recentEvents } = await getLifecycleCommandCenter(
    session!.user.organisationId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Phase 14</p>
          <h1 className="text-3xl font-semibold tracking-tight">Account Lifecycle</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            One operating view from research through outreach, sales, onboarding,
            delivery, and maintenance.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-md border border-border bg-card px-3 py-2">
            <p className="text-muted-foreground">Accounts</p>
            <p className="text-xl font-semibold">{metrics.total}</p>
          </div>
          <div className="rounded-md border border-border bg-card px-3 py-2">
            <p className="text-muted-foreground">Due actions</p>
            <p className="text-xl font-semibold">{metrics.dueNextActions}</p>
          </div>
          <div className="rounded-md border border-border bg-card px-3 py-2">
            <p className="text-muted-foreground">At risk</p>
            <p className="text-xl font-semibold">{metrics.byStatus.at_risk ?? 0}</p>
          </div>
        </div>
      </div>

      <section className="grid gap-3 xl:grid-cols-6">
        {lifecycleStages.map((stage) => (
          <Card key={stage} className="rounded-md">
            <CardHeader className="p-4">
              <div
                className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md border ${stageTone(stage)}`}
              >
                <Route aria-hidden className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm leading-tight">
                {lifecycleStageLabels[stage]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <p className="text-2xl font-semibold">{metrics.byStage[stage]}</p>
              <p className="text-xs leading-5 text-muted-foreground">
                {lifecycleStageDescriptions[stage]}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Accounts In Motion</CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-border text-center">
                <Search aria-hidden className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No lifecycle accounts yet</p>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Create or import leads to start building the account lifecycle
                  view.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {accounts.map((account) => (
                  <div
                    className="grid gap-3 py-4 lg:grid-cols-[1fr_180px_180px]"
                    key={account.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{account.name}</p>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs ${stageTone(account.stage)}`}
                        >
                          {lifecycleStageLabels[account.stage]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {account.primaryEmail ?? account.website ?? "No primary contact"}
                      </p>
                      {account.nextAction ? (
                        <p className="mt-2 text-sm">{account.nextAction}</p>
                      ) : null}
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">
                        {account.status.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Next action due</p>
                      <p className="font-medium">{formatDate(account.nextActionDueAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-border text-center">
                <CalendarClock
                  aria-hidden
                  className="mb-3 h-8 w-8 text-muted-foreground"
                />
                <p className="font-medium">No lifecycle events yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div className="flex gap-3" key={event.id}>
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                      {event.action.includes("stage") ? (
                        <ArrowRight aria-hidden className="h-4 w-4" />
                      ) : (
                        <CircleAlert aria-hidden className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {lifecycleStageLabels[event.stage]} · {formatDate(event.occurredAt)}
                      </p>
                      {event.body ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {event.body}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
